const express = require('express');
const { validationResult } = require('express-validator');
const { createBooking, getBookings, getBookingById } = require('../controllers/bookingController');
const { bookingValidator } = require('../validators/booking.validator');

const router = express.Router();

// Middleware to check express-validator results and return 400 if invalid
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

// Public guest routes
router.post('/', bookingValidator, handleValidationErrors, createBooking);
router.get('/:id', getBookingById);

module.exports = router;