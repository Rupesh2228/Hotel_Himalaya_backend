const express = require('express');
const { createBooking, getBookings, getBookingById } = require('../controllers/bookingController');
const { bookingValidator } = require('../validators/booking.validator');

const router = express.Router();

// Public guest routes
router.post('/', bookingValidator, createBooking);
router.get('/:id', getBookingById);

module.exports = router;