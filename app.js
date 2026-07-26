require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const { connectDB } = require("./db");
const { globalErrorHandler } = require("./utils/errorHandler");

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const roomRoutes = require("./routes/roomRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const attractionRoutes = require("./routes/attractionRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const tourRoutes = require("./routes/tourRoutes");
const pastEventRoutes = require("./routes/pastEventRoutes");

const app = express();

// ── Static uploads ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ── Security middleware ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.set("trust proxy", 1);

// General rate limiter (per IP, 100 req/15 min)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "fail", error: "Too many requests. Please slow down." },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true, // needed for HTTP-only cookie auth
  })
);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));           // limit payload size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());                            // parse HTTP-only auth cookie

// ── Data sanitization ─────────────────────────────────────────────────────────
// Manual NoSQL injection sanitizer (express-mongo-sanitize incompatible with Express 5)
const sanitizeValue = (val) => {
  if (val && typeof val === 'object') {
    for (const key of Object.keys(val)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete val[key];
      } else {
        sanitizeValue(val[key]);
      }
    }
  }
  return val;
};
app.use((req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
});
app.use(hpp());           // prevent HTTP Parameter Pollution

// ── Compression ───────────────────────────────────────────────────────────────
// Aggressive compression for slow networks (max compression)
app.use(compression({
  level: 9,                    // Maximum compression (1-9)
  threshold: 0,                // Compress everything, even small responses
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ── Caching headers for static assets ───────────────────────────────────────
app.use((req, res, next) => {
  if (req.url.startsWith('/uploads')) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// ── API Response Caching (5 minute cache for frequently accessed data) ───────
const apiCache = new Map();
const cacheMiddleware = (duration = 300) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const key = req.originalUrl || req.url;
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < duration * 1000) {
    res.set('X-Cache', 'HIT');
    return res.json(cached.data);
  }
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200) apiCache.set(key, { data, timestamp: Date.now() });
    return originalJson.call(this, data);
  };
  next();
};

// ── Network-aware optimization ──────────────────────────────────────────────
app.use((req, res, next) => {
  const saveData = req.get('save-data') === 'on';
  res.locals.slowNetwork = saveData;
  next();
});

// ── Health & root endpoints ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: state === 1 ? "ok" : "starting",
    message: "Hotel Himalaya INN Khona API is running",
    dbState: state,
  });
});

app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({ status: state === 1 ? "ok" : "db_connecting", state });
});

// ── DB connection guard for API routes ───────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith("/api") && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: "error",
      error: "Service temporarily unavailable (database not connected)",
      dbState: mongoose.connection.readyState,
    });
  }
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/attractions", attractionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/past-events", pastEventRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: "fail", error: "Route not found" });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(globalErrorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});

// ── Connect to database ──────────────────────────────────────────────────────
connectDB()
  .then(async () => {
    console.log("✓ Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });