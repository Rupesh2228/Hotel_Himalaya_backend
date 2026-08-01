const { body } = require('express-validator');

/**
 * Validation rules for room booking requests
 */
const bookingValidator = [
  // Room details
  body('roomId')
    .trim()
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid room ID'),

  // Guest name — now required
  body('bookedByName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  // Email — now required
  body('bookedByEmail')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  // Phone — now required
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage('Please enter a valid phone number (7–20 digits)'),

  // Address — now required
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Address must be between 3 and 200 characters'),

  // Members
  body('members')
    .notEmpty()
    .withMessage('Number of guests is required')
    .isInt({ gt: 0, lt: 51 })
    .withMessage('Number of guests must be between 1 and 50'),

  // Check-in date
  body('checkIn')
    .trim()
    .notEmpty()
    .withMessage('Check-in date is required')
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('Check-in must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const checkIn = new Date(value);
      checkIn.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),

  // Check-out date
  body('checkOut')
    .trim()
    .notEmpty()
    .withMessage('Check-out date is required')
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('Check-out must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.checkIn);
      const checkOut = new Date(value);
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
      // Limit stay to 90 days
      const diffDays = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
      if (diffDays > 90) {
        throw new Error('Maximum stay is 90 nights');
      }
      return true;
    }),
];

module.exports = { bookingValidator };