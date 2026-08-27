/**
 * Custom operational error class.
 * Attaches an HTTP status code and isOperational flag so the global
 * error handler can distinguish between known API errors and unexpected crashes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express error-handling middleware.
 * Must be registered as the LAST middleware in app.js.
 *
 * Handles:
 *  - Operational AppErrors (validation failures, auth errors, etc.)
 *  - Mongoose CastErrors (bad ObjectId format)
 *  - Mongoose Duplicate Key errors (E11000)
 *  - Mongoose Validation errors
 *  - JWT errors (TokenExpiredError, JsonWebTokenError)
 *  - Unexpected crashes (500)
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // ── Mongoose bad ObjectId ────────────────────────────────────────────────
  if (err.name === "CastError") {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // ── Mongoose duplicate key (E11000) ──────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    err = new AppError(
      `An account with ${field} "${value}" already exists.`,
      409
    );
  }

  // ── Mongoose validation error ────────────────────────────────────────────
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    err = new AppError(messages.join(". "), 400);
  }

  // ── JWT expired ──────────────────────────────────────────────────────────
  if (err.name === "TokenExpiredError") {
    err = new AppError("Your session has expired. Please log in again.", 401);
  }

  // ── JWT invalid ──────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    err = new AppError("Invalid token. Please log in again.", 401);
  }

  // ── Send response ────────────────────────────────────────────────────────
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err.message,
    });
  }

  // Unexpected / programming error — do not leak details in production
  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    status: "error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong. Please try again later."
        : err.message,
  });
};

module.exports = { AppError, ErrorResponse: AppError, globalErrorHandler };

