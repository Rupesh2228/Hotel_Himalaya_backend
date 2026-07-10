const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  bookEvent,
  getUserBookings,
  getAllBookings,
  deleteBooking,
} = require('../controllers/eventController');

// Public
router.get('/', getEvents);
router.post('/book', (req, res, next) => {
  // Optional auth
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, bookEvent);

// Private (Registered Users)
router.get('/my-bookings', protect, getUserBookings);

// Admin Only
router.post('/', protect, isAdmin, createEvent);
router.put('/:id', protect, isAdmin, updateEvent);
router.delete('/:id', protect, isAdmin, deleteEvent);
router.get('/admin/bookings', protect, isAdmin, getAllBookings);
router.delete('/admin/bookings/:id', protect, isAdmin, deleteBooking);

module.exports = router;
