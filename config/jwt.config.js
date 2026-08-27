const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_hotel_jwt_secret_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_EXPIRES_DAYS = parseInt(process.env.COOKIE_EXPIRES_DAYS || "7", 10);

/**
 * Sign a JWT for the given user id.
 * @param {string|ObjectId} id - MongoDB user _id
 * @returns {string} signed JWT
 */
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Attach the JWT as an HTTP-only cookie and also return it in the
 * JSON body for clients that prefer Bearer token storage.
 *
 * @param {object} res      - Express response
 * @param {string} token    - Signed JWT
 * @param {object} user     - Safe user object (no password)
 * @param {number} [status] - HTTP status code (default 200)
 */
const sendTokenResponse = (res, token, user, status = 200) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res
    .status(status)
    .cookie("token", token, cookieOptions)
    .json({ status: "success", token, user });
};

module.exports = { JWT_SECRET, signToken, verifyToken, sendTokenResponse };

