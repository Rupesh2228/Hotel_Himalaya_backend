const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "dev_hotel_jwt_secret";
const restrictedAdminEmail = (process.env.ADMIN_EMAIL || process.env.GOOGLE_ADMIN_EMAIL || "adminhotel49@gmail.com").toLowerCase();

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email: rawEmail, password } = req.body;

    // Additional business validation
    if (!name || !rawEmail || !password) {
      return res.status(400).json({ error: "Please enter all fields" });
    }
    
    const email = String(rawEmail).toLowerCase();

    if (email.toLowerCase() === restrictedAdminEmail) {
      return res.status(400).json({ error: "Registration with this email is restricted." });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      if (!user.isVerified) {
        // If unverified, allow them to re-signup and get a new OTP
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.name = name;
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOTP = otp;
        user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const subject = "Your verification code";
        const body = `Your verification code is ${otp}. It will expire in 10 minutes.`;
        const emailResult = await sendEmail(user.email, subject, body, `<p>${body}</p>`);
        if (!emailResult) console.error(`[AUTH] Failed to send signup OTP email to ${user.email}`);

        return res.status(201).json({ message: "Verification OTP resent to email" });
      }
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (unverified)
    user = await User.create({
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
      const emailResult = await sendEmail(user.email, subject, body, `<p>${body}</p>`);
      if (!emailResult) console.error(`[AUTH] Failed to send signup OTP email to ${user.email}`);

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
const signupValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
];

const verifySignupOTP = async (req, res) => {
  try {
    const { email: rawEmail, otp } = req.body;
    if (!rawEmail || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const email = String(rawEmail).toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or OTP" });

    if (!user.verificationOTP || String(user.verificationOTP) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.verificationOTPExpires && user.verificationOTPExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
    });

    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, provider: user.provider || 'local', avatar: user.avatar } });
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
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: "Email is required" });

    const email = String(rawEmail).toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "If that email exists, an OTP was sent" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const subject = "Your password reset code";
    const body = `Your password reset code is ${otp}. It will expire in 10 minutes.`;
    const emailResult = await sendEmail(user.email, subject, body, `<p>${body}</p>`);
    if (!emailResult) console.error(`[AUTH] Failed to send password reset OTP email to ${user.email}`);

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
    const { email: rawEmail, otp, newPassword } = req.body;
    if (!rawEmail || !otp || !newPassword) return res.status(400).json({ error: "Email, OTP and newPassword are required" });

    const email = String(rawEmail).toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOTP || String(user.resetPasswordOTP) !== String(otp)) {
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

    // Block login for unverified local accounts
    if (!user.isVerified) {
      return res.status(400).json({ error: "Please verify your email first. Check your inbox for the OTP." });
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
        isVerified: true,
      });
    } else {
      // Preserve existing user roles for returning users.
      user.avatar = picture || user.avatar;
      if (!user.provider && !user.password) {
        user.provider = "google";
      }
      await user.save();
    }

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
    });

    res.json({
      token,
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
  signupValidationRules,
  login,
  googleLogin,
  getMe,
  verifySignupOTP,
  requestPasswordReset,
  verifyPasswordReset,
};
