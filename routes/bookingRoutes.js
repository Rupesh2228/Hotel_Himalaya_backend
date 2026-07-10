const express = require('express');
const { getBookings, createBooking } = require('../controllers/bookingController');

const router = express.Router();

router.get('/', getBookings);
router.post('/', createBooking);

module.exports = router;