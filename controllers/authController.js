const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
      return res.status(403).json({ error: "Admin login via Google is restricted. Please use a direct admin login." });
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
  googleLogin,
  getMe,
};
