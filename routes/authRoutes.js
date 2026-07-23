const express = require("express");
const {
  googleLogin,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/google", googleLogin);

// Private route
router.get("/me", protect, getMe);

module.exports = router;
