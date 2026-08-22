const { body } = require('express-validator');

// ─── Create Blog (Admin) ──────────────────────────────────────────────────────
const createBlogValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Blog title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase letters, numbers and hyphens only'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),

  body('status')
    .optional()
    .isIn(['Published', 'Draft']).withMessage('Status must be Published or Draft'),
];

// ─── Update Blog (Admin) ──────────────────────────────────────────────────────
const updateBlogValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase letters, numbers and hyphens only'),

  body('status')
    .optional()
    .isIn(['Published', 'Draft']).withMessage('Status must be Published or Draft'),
];

module.exports = { createBlogValidator, updateBlogValidator };
