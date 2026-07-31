const express = require('express');
const { getBookings, createBooking } = require('../controllers/bookingController');
const { bookingValidator } = require('../validators/booking.validator');

const router = express.Router();

router.get('/', getBookings);
router.post('/', bookingValidator, createBooking);

module.exports = router;