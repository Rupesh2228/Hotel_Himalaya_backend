const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "dev_hotel_jwt_secret";
const restrictedAdminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || "adminhotel49@gmail.com").toLowerCase();

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    if (email.toLowerCase() === restrictedAdminEmail) {
      return res.status(400).json({ error: "Registration with this email is restricted." });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (unverified)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      provider: "local",
      isVerified: false,
    });

    if (user) {
      // generate OTP and send email for verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      const subject = "Your verification code";
      const body = `Your verification code is ${otp}. It will expire in 10 minutes.`;
      sendEmail(user.email, subject, body, `<p>${body}</p>`).catch(() => {});

      return res.status(201).json({ message: "Verification OTP sent to email" });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

/**
 * @desc Verify signup OTP and finish registration
 * @route POST /api/auth/verify-signup-otp
 * @access Public
 */
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or OTP" });

    if (!user.verificationOTP || user.verificationOTP !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.verificationOTPExpires && user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    return res.json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role, provider: user.provider || 'local', avatar: user.avatar } });
  } catch (err) {
    console.error('verifySignupOTP error:', err);
    res.status(500).json({ error: 'Server error verifying OTP' });
  }
};

/**
 * @desc Request password reset OTP
 * @route POST /api/auth/request-reset
 * @access Public
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "If that email exists, an OTP was sent" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const subject = "Your password reset code";
    const body = `Your password reset code is ${otp}. It will expire in 10 minutes.`;
    sendEmail(user.email, subject, body, `<p>${body}</p>`).catch(() => {});

    return res.json({ message: "If that email exists, an OTP was sent" });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    res.status(500).json({ error: 'Server error requesting password reset' });
  }
};

/**
 * @desc Verify reset OTP and set new password
 * @route POST /api/auth/verify-reset
 * @access Public
 */
const verifyPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: "Email, OTP and newPassword are required" });

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ error: "Invalid OTP or email" });
    }

    if (user.resetPasswordOTPExpires && user.resetPasswordOTPExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('verifyPasswordReset error:', err);
    res.status(500).json({ error: 'Server error verifying password reset' });
  }
};

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    const emailLower = String(email).toLowerCase();
    // Find user by email (normalize casing to prevent duplicates)
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // If user registered with Google and has no password
    if (!user.password) {
      return res.status(400).json({
        error: "This account is registered via Google. Please log in with Google.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider || (user.avatar && !user.password ? 'google' : 'local'),
        avatar: user.avatar,
      },
    });
    // update last login timestamp
    try {
      user.lastLogin = Date.now();
      await user.save();
    } catch (e) {
      console.warn('Failed to update lastLogin:', e.message || e);
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

/**
 * @desc    Authenticate a user with Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Google token credential is required" });
    }

    // Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = String(payload.email || '').toLowerCase();
    const { name, picture } = payload;

    // Enforce that only standard users can register or log in via Google
    if (email === restrictedAdminEmail) {
      return res.status(403).json({ error: "Admin login via Google is restricted. Please use password login." });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        role: "user",
        provider: "google",
      });
    } else {
      // Preserve existing user roles for returning users.
      user.avatar = picture || user.avatar;
      if (!user.provider && !user.password) {
        user.provider = "google";
      }
      await user.save();
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider || (user.avatar && !user.password ? 'google' : 'local'),
        avatar: user.avatar,
      },
    });

    // Update last login timestamp
    try {
      user.lastLogin = Date.now();
      await user.save();
    } catch (e) {
      console.warn('Failed to update lastLogin:', e.message || e);
    }
  } catch (err) {
    console.error("Google login error stack:", err.stack || err);
    res.status(500).json({ error: "Google authentication failed: " + err.message });
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  getMe,
  verifySignupOTP,
  requestPasswordReset,
  verifyPasswordReset,
};
