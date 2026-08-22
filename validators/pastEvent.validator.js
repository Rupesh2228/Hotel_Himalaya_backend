const { body } = require('express-validator');

const createPastEventValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 2000 }).withMessage('Description must be between 5 and 2000 characters'),

  body('imageUrl')
    .trim()
    .notEmpty().withMessage('Image URL is required')
    .isURL().withMessage('Image URL must be a valid URL'),
];

const updatePastEventValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 2000 }).withMessage('Description must be between 5 and 2000 characters'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('Image URL must be a valid URL'),
];

module.exports = { createPastEventValidator, updatePastEventValidator };
