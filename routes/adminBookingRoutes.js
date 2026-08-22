const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { updateBookingStatusValidator } = require('../validators/admin.validator');
const {
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookingController');

const router = express.Router();

// All admin booking routes require authentication + admin role
router.get('/', protect, isAdmin, getBookings);
router.get('/:id', protect, isAdmin, getBookingById);
router.patch('/:id/status', protect, isAdmin, updateBookingStatusValidator, validate, updateBookingStatus);
router.delete('/:id', protect, isAdmin, deleteBooking);

// Keep legacy verify route for old frontend compatibility
router.put('/:id/verify', protect, isAdmin, require('../controllers/bookingController').verifyBooking);

module.exports = router;