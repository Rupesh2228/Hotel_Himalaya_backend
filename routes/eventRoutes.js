const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const {
  createEventValidator,
  updateEventValidator,
  bookEventValidator,
} = require('../validators/event.validator');
const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  bookEvent,
  getUserBookings,
  getUserBookingsByEmail,
  getAllBookings,
  deleteBooking,
} = require('../controllers/eventController');

// Public
router.get('/', getEvents);
router.post('/book', bookEventValidator, validate, bookEvent);

// Private (Registered Users)
router.get('/my-bookings', protect, getUserBookings);
router.get('/my-bookings-by-email', getUserBookingsByEmail);

// Admin Only
router.post('/', protect, isAdmin, createEventValidator, validate, createEvent);
router.put('/:id', protect, isAdmin, updateEventValidator, validate, updateEvent);
router.delete('/:id', protect, isAdmin, deleteEvent);
router.get('/admin/bookings', protect, isAdmin, getAllBookings);
router.delete('/admin/bookings/:id', protect, isAdmin, deleteBooking);

module.exports = router;
