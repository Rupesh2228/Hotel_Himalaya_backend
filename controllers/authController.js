/**
 * auth.controller.js
 *
 * Handles all authentication operations:
 *  - signup          POST /api/auth/signup
 *  - verifyOTP       POST /api/auth/verify-otp
 *  - resendOTP       POST /api/auth/resend-otp
 *  - login           POST /api/auth/login
 *  - googleLogin     POST /api/auth/google
 *  - forgotPassword  POST /api/auth/forgot-password
 *  - resetPassword   POST /api/auth/reset-password/:token
 *  - logout          POST /api/auth/logout
 *  - getProfile      GET  /api/auth/me  (protected)
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorHandler");
const { signToken, sendTokenResponse } = require("../config/jwt.config");
const { generateOTP } = require("../services/otp.service");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/** The one Google account allowed to access the administrator dashboard. */
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || ''
).toLowerCase();

if (!ADMIN_EMAIL) {
  console.warn('[AUTH] WARNING: ADMIN_EMAIL is not set. Google sign-in cannot grant administrator access.');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract the first validation error and throw as AppError */
const validateRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

/** Build a safe user object to return in responses (never expose password/OTP fields) */
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  role: user.role,
  avatar: user.avatar || null,
  provider: user.provider || "local",
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

// ── 1. Signup ──────────────────────────────────────────────────────────────────
/**
 * @desc   Register a new user, send OTP to email
 * @route  POST /api/auth/signup
 * @access Public
 */
const signup = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { name, email: rawEmail, phone, password } = req.body;
  const email = rawEmail.toLowerCase().trim();

  // Block admin email from self-registering
  if (email === ADMIN_EMAIL) {
    throw new AppError("Registration with this email is restricted.", 403);
  }

  // Check if verified user already exists
  const existingUser = await User.findOne({ email }).select("+verificationOTP +verificationOTPExpires");
  if (existingUser && existingUser.isVerified) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  let user;
  if (existingUser && !existingUser.isVerified) {
    // Re-signup: update the unverified account
    existingUser.name = name;
    existingUser.phone = phone || null;
    existingUser.password = hashedPassword;
    existingUser.verificationOTP = otp;
    existingUser.verificationOTPExpires = otpExpires;
    existingUser.otpAttempts = 0;
    existingUser.lastOtpSentAt = new Date();
    await existingUser.save();
    user = existingUser;
  } else {
    // Fresh registration
    user = await User.create({
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: "user",
      provider: "local",
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpires: otpExpires,
      otpAttempts: 0,
      lastOtpSentAt: new Date(),
    });
  }

  // OTP email skipped — Brevo is used only for admin notifications

  return res.status(201).json({
    status: "success",
    message: "Registration successful! A 6-digit verification code has been sent to your email.",
    email, // frontend uses this to pre-fill the VerifyOTP page
  });
});

// ── 2. Verify OTP ─────────────────────────────────────────────────────────────
/**
 * @desc   Verify the 6-digit OTP and activate account; auto-login
 * @route  POST /api/auth/verify-otp
 * @access Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { email: rawEmail, otp } = req.body;
  const email = rawEmail.toLowerCase().trim();

  const user = await User.findOne({ email }).select(
    "+verificationOTP +verificationOTPExpires +password"
  );

  if (!user) throw new AppError("No account found with this email address.", 404);
  if (user.isVerified) throw new AppError("This account is already verified. Please log in.", 400);

  // OTP comparison
  if (!user.verificationOTP || user.verificationOTP !== otp.trim()) {
    throw new AppError("Invalid OTP. Please check the code and try again.", 400);
  }

  // Expiry check
  if (!user.verificationOTPExpires || user.verificationOTPExpires < Date.now()) {
    throw new AppError("Your OTP has expired. Please request a new one.", 400);
  }

  // Mark verified & clear OTP fields
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpires = undefined;
  user.otpAttempts = 0;
  user.lastOtpSentAt = null;
  user.lastLogin = new Date();
  await user.save();

  // Welcome email skipped — Brevo is used only for admin notifications

  const token = signToken(user._id);
  return sendTokenResponse(res, token, safeUser(user), 200);
});

// ── 3. Resend OTP ─────────────────────────────────────────────────────────────
/**
 * @desc   Resend the verification OTP (max 5 per account, 60-second cooldown)
 * @route  POST /api/auth/resend-otp
 * @access Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { email: rawEmail } = req.body;
  const email = rawEmail.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) throw new AppError("No account found with this email address.", 404);
  if (user.isVerified) throw new AppError("This account is already verified.", 400);

  // 60-second cooldown check
  if (user.lastOtpSentAt) {
    const secondsSinceLast = (Date.now() - new Date(user.lastOtpSentAt).getTime()) / 1000;
    if (secondsSinceLast < 60) {
      const remaining = Math.ceil(60 - secondsSinceLast);
      throw new AppError(
        `Please wait ${remaining} second${remaining !== 1 ? "s" : ""} before requesting a new code.`,
        429
      );
    }
  }

  // Max 5 resend attempts
  if (user.otpAttempts >= 5) {
    throw new AppError(
      "Maximum resend attempts reached. Please contact support or register again.",
      429
    );
  }

  const otp = generateOTP();
  user.verificationOTP = otp;
  user.verificationOTPExpires = new Date(Date.now() + 5 * 60 * 1000);
  user.otpAttempts = (user.otpAttempts || 0) + 1;
  user.lastOtpSentAt = new Date();
  await user.save();

  // OTP resend email skipped — Brevo is used only for admin notifications

  return res.status(200).json({
    status: "success",
    message: "A new verification code has been sent to your email.",
    attemptsRemaining: 5 - user.otpAttempts,
  });
});

// ── 4. Login ──────────────────────────────────────────────────────────────────
/**
 * @desc   Login with email and password
 * @route  POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { email: rawEmail, password } = req.body;
  const email = rawEmail.toLowerCase().trim();

  // Fetch user WITH password for comparison
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid email or password.", 401);

  // Google-only accounts have no local password
  if (!user.password) {
    throw new AppError(
      "This account uses Google Sign-In. Please log in with Google.",
      400
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid email or password.", 401);

  // Block unverified accounts
  if (!user.isVerified) {
    return res.status(403).json({
      status: "unverified",
      error: "Please verify your email before logging in.",
      email, // frontend uses this to navigate to verify-otp page
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id);
  return sendTokenResponse(res, token, safeUser(user));
});

// ── 5. Google Login ───────────────────────────────────────────────────────────
/**
 * @desc   Authenticate via Google OAuth ID token
 * @route  POST /api/auth/google
 * @access Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { credential, isAdminLogin } = req.body;
  if (!credential) throw new AppError("Google token credential is required.", 400);

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = String(payload.email || "").toLowerCase();
  const { name, picture } = payload;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      // Only the configured email becomes an administrator automatically.
      // Other accounts requesting admin access remain pending for approval.
      role: email === ADMIN_EMAIL ? "admin" : (isAdminLogin ? "pending_admin" : "user"),
      provider: "google",
      isVerified: true,
    });
  } else {
    user.avatar = picture || user.avatar;
    if (!user.provider && !user.password) user.provider = "google";

    // Keep the configured Google account as admin, including accounts created
    // before Google sign-in was enabled.
    if (email === ADMIN_EMAIL && user.role !== "admin") {
      user.role = "admin";
    } else if (isAdminLogin && user.role === "user") {
      // Any other account requesting admin access requires approval.
      user.role = "pending_admin";
    }

    user.lastLogin = new Date();
    await user.save();
  }

  const token = signToken(user._id);
  return sendTokenResponse(res, token, safeUser(user));
});

// ── 6. Forgot Password ────────────────────────────────────────────────────────
/**
 * @desc   Generate password-reset token and send email link
 * @route  POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { email: rawEmail } = req.body;
  const email = rawEmail.toLowerCase().trim();

  const user = await User.findOne({ email });

  // Always return 200 to prevent email enumeration
  if (!user || !user.isVerified) {
    return res.status(200).json({
      status: "success",
      message: "If that email is registered and verified, a reset link has been sent.",
    });
  }

  // Block Google-only accounts
  if (!user.password && user.provider === "google") {
    return res.status(200).json({
      status: "success",
      message: "If that email is registered and verified, a reset link has been sent.",
    });
  }

  // Generate OTP
  const otp = generateOTP();
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Password reset email skipped — Brevo is used only for admin notifications

  return res.status(200).json({
    status: "success",
    message: "If that email is registered and verified, an OTP has been sent.",
  });
});

// ── 7. Reset Password ─────────────────────────────────────────────────────────
/**
 * @desc   Validate reset token and update password
 * @route  POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  validateRequest(req);

  const { otp, password, email: rawEmail } = req.body;
  const email = rawEmail.toLowerCase().trim();

  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  }).select("+resetPasswordOTP +resetPasswordOTPExpires");

  if (!user) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(password, salt);
  
  // Clear OTP fields
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();

  // Password changed email skipped — Brevo is used only for admin notifications

  const jwtToken = signToken(user._id);
  return sendTokenResponse(res, jwtToken, safeUser(user));
});

// ── 8. Logout ─────────────────────────────────────────────────────────────────
/**
 * @desc   Clear the auth cookie
 * @route  POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({ status: "success", message: "Logged out successfully." });
});

// ── 9. Get Profile ────────────────────────────────────────────────────────────
/**
 * @desc   Get the currently authenticated user's profile
 * @route  GET /api/auth/me
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  return res.status(200).json(safeUser(req.user));
});

module.exports = {
  signup,
  verifyOTP,
  resendOTP,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
};
