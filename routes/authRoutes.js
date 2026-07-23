const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  signup,
  verifyOTP,
  resendOTP,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const {
  signupValidator,
  loginValidator,
  verifyOTPValidator,
  resendOTPValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────────────────────

/** Strict limiter for auth write operations (signup, login, OTP) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { status: "fail", error: "Too many requests. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/** Even stricter for forgot-password to prevent abuse */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { status: "fail", error: "Too many reset attempts. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public Routes ──────────────────────────────────────────────────────────────
router.post("/signup",           authLimiter, signupValidator,           signup);
router.post("/verify-otp",       authLimiter, verifyOTPValidator,        verifyOTP);
router.post("/resend-otp",       authLimiter, resendOTPValidator,        resendOTP);
router.post("/login",            authLimiter, loginValidator,            login);
router.post("/google",           authLimiter,                            googleLogin);
router.post("/forgot-password",  forgotPasswordLimiter, forgotPasswordValidator, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPasswordValidator, resetPassword);

// ── Protected Routes ───────────────────────────────────────────────────────────
router.get("/me",     protect, getProfile);
router.post("/logout", protect, logout);

module.exports = router;
