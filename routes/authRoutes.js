const express = require("express");
const {
  signup,
  login,
  googleLogin,
  getMe,
  verifySignupOTP,
  requestPasswordReset,
  verifyPasswordReset,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOTP);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/request-reset", requestPasswordReset);
router.post("/verify-reset", verifyPasswordReset);

// Private route
router.get("/me", protect, getMe);

module.exports = router;
