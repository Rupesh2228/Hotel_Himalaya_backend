const { body } = require('express-validator');

/**
 * Validation rules for room booking requests
 */
const bookingValidator = [
  body('roomId')
    .trim()
    .notEmpty()
    .withMessage('roomId is required'),

  body('members')
    .notEmpty()
    .withMessage('Number of members is required')
    .isInt({ gt: 0 })
    .withMessage('members must be a positive integer'),

  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isString()
    .withMessage('Invalid check-in date'),

  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isString()
    .withMessage('Invalid check-out date'),

  body('bookedByEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s\-().]{7,20}$/)
    .withMessage('Please enter a valid phone number'),

  body('bookedByName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
];

module.exports = { bookingValidator };