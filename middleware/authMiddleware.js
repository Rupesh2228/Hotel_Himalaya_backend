const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../utils/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const JWT_SECRET = process.env.JWT_SECRET || "dev_hotel_jwt_secret";

/**
 * protect — verifies JWT from Authorization Bearer header OR httpOnly cookie.
 * Attaches the user document to req.user (password excluded).
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Try Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Fallback: HTTP-only cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new AppError("Not authorized. Please log in to access this resource.", 401);
  }

  // Verify token (throws JsonWebTokenError / TokenExpiredError handled globally)
  const decoded = jwt.verify(token, JWT_SECRET);

  const currentUser = await User.findById(decoded.id).select("-password");
  if (!currentUser) {
    throw new AppError("The account associated with this token no longer exists.", 401);
  }

  req.user = currentUser;
  next();
});

/**
 * isAdmin — must be used after protect.
 * Rejects any non-admin user with a 403.
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    throw new AppError("Access denied. Admin privileges are required.", 403);
  }
  next();
};

module.exports = { protect, isAdmin };
