const { body, param, query } = require('express-validator');

// ─── Event (Create / Update) ──────────────────────────────────────────────────
const createEventValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Event description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),

  body('date')
    .trim()
    .notEmpty().withMessage('Event date is required')
    .isDate({ strictMode: false }).withMessage('Date must be a valid date'),

  body('time')
    .trim()
    .notEmpty().withMessage('Event time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Time must be in HH:MM or HH:MM:SS format'),

  body('location')
    .trim()
    .notEmpty().withMessage('Event location is required')
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('totalSeats')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Total seats must be between 1 and 10,000'),

  body('availableSeats')
    .optional()
    .isInt({ min: 0 }).withMessage('Available seats must be a non-negative integer'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('Image URL must be a valid URL'),
];

const updateEventValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),

  body('date')
    .optional()
    .isDate({ strictMode: false }).withMessage('Date must be a valid date'),

  body('time')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Time must be in HH:MM or HH:MM:SS format'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('totalSeats')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Total seats must be between 1 and 10,000'),

  body('availableSeats')
    .optional()
    .isInt({ min: 0 }).withMessage('Available seats must be a non-negative integer'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL().withMessage('Image URL must be a valid URL'),
];

// ─── Event Booking ────────────────────────────────────────────────────────────
const bookEventValidator = [
  body('eventId')
    .trim()
    .notEmpty().withMessage('Event ID is required')
    .isMongoId().withMessage('Invalid event ID'),

  body('ticketsCount')
    .notEmpty().withMessage('Tickets count is required')
    .isInt({ min: 1, max: 50 }).withMessage('Tickets count must be between 1 and 50'),

  body('bookedByName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  body('bookedByEmail')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('bookedByPhone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s\-().]{7,20}$/).withMessage('Please enter a valid phone number'),
];

module.exports = { createEventValidator, updateEventValidator, bookEventValidator };
