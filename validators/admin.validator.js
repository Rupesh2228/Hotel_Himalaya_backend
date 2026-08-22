const { body } = require('express-validator');

// ─── Add / Update Room (Admin) ────────────────────────────────────────────────
const roomValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Room title is required')
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('totalMembers')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Total members must be between 1 and 20'),

  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable must be a boolean'),
];

// ─── Add / Update Attraction (Admin) ─────────────────────────────────────────
const attractionValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Attraction title is required')
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 2000 }).withMessage('Description must be between 5 and 2000 characters'),

  body('imageUrl')
    .trim()
    .notEmpty().withMessage('Image URL is required')
    .isURL().withMessage('Image URL must be a valid URL'),

  body('subDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Sub-description cannot exceed 500 characters'),

  body('link')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Link must be a valid URL'),
];

// ─── Gallery Image (Admin) ────────────────────────────────────────────────────
const galleryImageValidator = [
  body('url')
    .trim()
    .notEmpty().withMessage('Image URL is required'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

// ─── Gallery Category (Admin) ─────────────────────────────────────────────────
const galleryCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Category name must be between 2 and 60 characters'),
];

// ─── Add Admin (Admin) ────────────────────────────────────────────────────────
const addAdminValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// ─── Update User Role (Admin) ─────────────────────────────────────────────────
const updateUserRoleValidator = [
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['user', 'admin', 'pending_admin']).withMessage('Role must be user, admin, or pending_admin'),
];

// ─── Booking Status Update (Admin) ────────────────────────────────────────────
const updateBookingStatusValidator = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'])
    .withMessage('Status must be one of: Pending, Confirmed, Ongoing, Completed, Cancelled'),
];

module.exports = {
  roomValidator,
  attractionValidator,
  galleryImageValidator,
  galleryCategoryValidator,
  addAdminValidator,
  updateUserRoleValidator,
  updateBookingStatusValidator,
};
