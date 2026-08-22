const express = require('express');
const validate = require('../middleware/validate');
const { createBooking, getBookings, getBookingById } = require('../controllers/bookingController');
const { bookingValidator } = require('../validators/booking.validator');

const router = express.Router();

// Public guest routes
router.post('/', bookingValidator, validate, createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);

module.exports = router;