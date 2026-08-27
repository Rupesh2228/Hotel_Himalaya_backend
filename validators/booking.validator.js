const { body } = require('express-validator');

/**
 * Validation rules for room booking requests.
 * Supports both new field names (guestName/guestEmail) and legacy (bookedByName/bookedByEmail).
 */
const bookingValidator = [
  // Room ID
  body('roomId')
    .trim()
    .notEmpty().withMessage('Room ID is required')
    .isMongoId().withMessage('Invalid room ID'),

  // Guest Name — supports guestName (new) OR bookedByName (legacy)
  body('guestName')
    .if(body('bookedByName').not().notEmpty())
    .trim()
    .notEmpty().withMessage('Guest name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  body('bookedByName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),

  // Guest Email — supports guestEmail (new) OR bookedByEmail (legacy)
  body('guestEmail')
    .if(body('bookedByEmail').not().notEmpty())
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('bookedByEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  // Phone
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-().]{7,20}$/).withMessage('Please enter a valid phone number (7–20 digits)'),

  // Guests count — supports guests (new) OR members (legacy)
  body('guests')
    .optional()
    .isInt({ gt: 0, lt: 51 }).withMessage('Number of guests must be between 1 and 50'),

  body('members')
    .optional()
    .isInt({ gt: 0, lt: 51 }).withMessage('Number of guests must be between 1 and 50'),

  // Check-in date
  body('checkIn')
    .trim()
    .notEmpty().withMessage('Check-in date is required')
    .isDate({ format: 'YYYY-MM-DD', strictMode: false }).withMessage('Check-in must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const checkIn = new Date(value);
      checkIn.setHours(0, 0, 0, 0);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      if (checkIn < yesterday) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),

  // Check-out date
  body('checkOut')
    .trim()
    .notEmpty().withMessage('Check-out date is required')
    .isDate({ format: 'YYYY-MM-DD', strictMode: false }).withMessage('Check-out must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const checkIn = new Date(req.body.checkIn);
      const checkOut = new Date(value);
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }
      const diffDays = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
      if (diffDays > 90) {
        throw new Error('Maximum stay is 90 nights');
      }
      return true;
    }),

  // Special request (optional)
  body('specialRequest')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Special request cannot exceed 500 characters'),
];

module.exports = { bookingValidator };