const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { getBookings, verifyBooking, deleteBooking } = require('../controllers/bookingController');

const router = express.Router();

router.get('/', protect, isAdmin, getBookings);
router.put('/:id/verify', protect, isAdmin, verifyBooking);
router.delete('/:id', protect, isAdmin, deleteBooking);

module.exports = router;