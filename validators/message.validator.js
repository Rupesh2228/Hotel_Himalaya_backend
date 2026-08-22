const { body } = require('express-validator');

// ─── Create Message (Contact Form) ───────────────────────────────────────────
const createMessageValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s\-().]{7,20}$/).withMessage('Please enter a valid phone number'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 5, max: 2000 }).withMessage('Message must be between 5 and 2000 characters'),
];

module.exports = { createMessageValidator };
