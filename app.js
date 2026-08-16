const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoose = require("mongoose");
const fs = require("fs");

const { connectDB } = require("./db");
const { initSocket } = require("./config/socket");
const { initCronJobs } = require("./services/cron");
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
const blogRoutes = require("./routes/blogRoutes");
const seoRoutes = require("./seo/seoRoutes");
const sitemapController = require("./seo/sitemapController");

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

// ── CORS — MUST come before rate limiters so that preflight OPTIONS requests
// always get the correct Access-Control-* headers even when rate limits are
// reached. Without this, a 429 response from the limiter has no CORS headers
// and the browser treats it as a network error instead of showing the 429.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  // Vercel production frontend
  'https://hotel-himalaya-inn.vercel.app',
  // Allow any *.vercel.app preview deployments
  /\.vercel\.app$/,
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    // Fall through: also allow in development / any origin as a safety net
    // Remove this line to enforce strict origin checking in production:
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204, // Some legacy browsers choke on 200 for OPTIONS
};

// Apply CORS globally (before everything else that could reject a request)
app.use(cors(corsOptions));

// Explicitly handle all OPTIONS preflight requests and return 204 immediately
// — this ensures they NEVER reach the rate limiter below.
app.options('*', cors(corsOptions));

// ── Rate limiters — applied AFTER CORS so preflight requests are already
// handled and do not consume rate limit quota. ────────────────────────────────

// General limiter: 200 req / 15 min per IP.
// The admin dashboard loads ~12 API calls on mount in parallel, so keep
// this high enough to avoid false positives on a legitimate page load.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip the rate limiter entirely for OPTIONS preflight requests
  skip: (req) => req.method === 'OPTIONS',
  message: { status: "fail", error: "Too many requests. Please slow down." },
});

// For upload endpoint we want a more permissive limiter to avoid blocking legitimate image uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { status: "fail", error: "Too many upload requests. Please slow down." },
});

// Apply general limiter to all routes except uploads (which have their own limiter)
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/upload')) return next();
  return generalLimiter(req, res, next);
});

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
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/attractions", attractionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/past-events", pastEventRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/seo", seoRoutes);
app.get("/sitemap.xml", sitemapController.generateSitemap);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: "fail", error: "Route not found" });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(globalErrorHandler);

// ── Start server with HTTP + Socket.IO ───────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initSocket(server);

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time notifications`);
});

// ── Connect to database ──────────────────────────────────────────────────────
connectDB()
  .then(async () => {
    console.log("✓ Database connected successfully");
    // Initialize cron jobs after DB is ready
    initCronJobs();
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });