const { body, param } = require('express-validator');

// ─── Book Tour ────────────────────────────────────────────────────────────────
const bookTourValidator = [
  body('tourId')
    .trim()
    .notEmpty().withMessage('Tour ID is required')
    .isMongoId().withMessage('Invalid tour ID'),

  body('travelDate')
    .trim()
    .notEmpty().withMessage('Travel date is required')
    .isDate({ strictMode: false }).withMessage('Travel date must be a valid date')
    .custom((value) => {
      const travelDate = new Date(value);
      travelDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (travelDate < today) throw new Error('Travel date cannot be in the past');
      return true;
    }),

  body('guests')
    .notEmpty().withMessage('Number of guests is required')
    .isInt({ min: 1, max: 50 }).withMessage('Guests must be between 1 and 50'),

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

  body('paymentMethod')
    .optional()
    .isIn(['pay_at_site', 'online']).withMessage('Payment method must be pay_at_site or online'),
];

// ─── Update Tour Booking Status (Admin) ───────────────────────────────────────
const updateTourBookingStatusValidator = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'])
    .withMessage('Status must be one of: Pending, Confirmed, Ongoing, Completed, Cancelled'),
];

// ─── Create / Update Tour (Admin) ─────────────────────────────────────────────
const createTourValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tour title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('durationDays')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration days must be a non-negative integer'),

  body('durationNights')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration nights must be a non-negative integer'),

  body('maxTravelers')
    .optional()
    .isInt({ min: 0 }).withMessage('Max travelers must be a non-negative integer'),

  body('remainingSeats')
    .optional()
    .isInt({ min: 0 }).withMessage('Remaining seats must be a non-negative integer'),
];

const updateTourValidator = createTourValidator; // same rules apply

module.exports = { bookTourValidator, updateTourBookingStatusValidator, createTourValidator, updateTourValidator };
