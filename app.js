require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { connectDB } = require("./db");
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
const notificationRoutes = require('./routes/notificationRoutes');
const tourRoutes = require('./routes/tourRoutes');

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set('trust proxy', 1);
app.use(limiter);
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(hpp());

// Root and health endpoints should stay available while the database is connecting.
app.get('/', (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: state === 1 ? 'ok' : 'starting',
    message: 'Hotel Himalaya INN Khona Khona INN Khona API is running',
    dbState: state,
  });
});

app.get('/health', (req, res) => {
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  res.json({ status: state === 1 ? 'ok' : 'db_connecting', state });
});

// Only protect API routes that need a live database connection.
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Service temporarily unavailable (database not connected)',
      dbState: mongoose.connection.readyState,
    });
  }
  next();
});

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/tours', tourRoutes);


app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});

// Connect to database
connectDB().then(async () => {
  // Seed admin user after DB connects
  try {
    const User = require("./models/User");
    const bcrypt = require("bcryptjs");
    const adminEmail = "adminhotel49@gmail.com";

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("himalayan_hotel48", salt);

      await User.create({
        name: "Himalayan Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        provider: "local",
        isVerified: true,
      });
      console.log("✓ Admin user created");
    } else {
      // Ensure existing admin has isVerified=true (migration)
      if (!adminExists.isVerified) {
        adminExists.isVerified = true;
        await adminExists.save();
        console.log("✓ Admin user verified (migrated)");
      } else {
        console.log("✓ Admin user exists");
      }
    }
  } catch (err) {
    console.error("⚠ Admin seeding error:", err.message);
  }
}).catch(err => {
  console.error('Database connection error:', err.message);
});