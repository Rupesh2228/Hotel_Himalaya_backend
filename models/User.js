const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      match: [/^[+]?[\d\s\-().]{7,20}$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: false,
      select: false, // never expose password by default
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "pending_admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ── Email Verification OTP ────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      select: false,
    },
    verificationOTPExpires: {
      type: Date,
      select: false,
    },
    /** How many resend-OTP attempts have been made (reset after verification) */
    otpAttempts: {
      type: Number,
      default: 0,
    },
    /** Timestamp of last OTP send — enforces the 60-second cooldown */
    lastOtpSentAt: {
      type: Date,
      default: null,
    },

    // ── Password Reset ────────────────────────────────────────────────────
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    // ── Legacy OTP fields (kept for backward compat) ──────────────────────
    resetPasswordOTP: { type: String, select: false },
    resetPasswordOTPExpires: { type: Date, select: false },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Generate a secure password-reset token.
 * Stores the hashed version in DB; returns the raw token to embed in the email link.
 */
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return rawToken;
};

module.exports = mongoose.model("User", userSchema);
