const { body } = require('express-validator');

// ─── Create Review ────────────────────────────────────────────────────────────
const createReviewValidator = [
  body('author')
    .trim()
    .notEmpty().withMessage('Author name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Author name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Author name can only contain letters, spaces, hyphens and apostrophes'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),

  body('text')
    .trim()
    .notEmpty().withMessage('Review text is required')
    .isLength({ min: 5, max: 1000 }).withMessage('Review must be between 5 and 1000 characters'),
];

// ─── Love / Unlike a review ───────────────────────────────────────────────────
const loveReviewValidator = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Identifier (email or device ID) is required')
    .isLength({ max: 200 }).withMessage('Identifier is too long'),
];

module.exports = { createReviewValidator, loveReviewValidator };
