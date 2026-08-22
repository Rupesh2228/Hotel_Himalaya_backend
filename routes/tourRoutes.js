const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const {
  bookTourValidator,
  updateTourBookingStatusValidator,
  createTourValidator,
  updateTourValidator,
} = require('../validators/tour.validator');
const {
  createTour,
  getTours,
  updateTour,
  deleteTour,
  bookTour,
  getUserBookings,
  getUserBookingsGuest,
  updateTourBookingStatus,
  deleteTourBooking,
  getAllTourBookings,
} = require('../controllers/tourController');

router.get('/', getTours);
router.post('/book', bookTourValidator, validate, bookTour);
router.get('/my-bookings', protect, getUserBookings);
router.get('/my-bookings-guest', getUserBookingsGuest);

// Admin booking actions
router.get('/admin/bookings', protect, isAdmin, getAllTourBookings);
router.put('/bookings/:id', protect, isAdmin, updateTourBookingStatusValidator, validate, updateTourBookingStatus);
router.delete('/bookings/:id', protect, isAdmin, deleteTourBooking);

router.post('/', protect, isAdmin, createTourValidator, validate, createTour);
router.put('/:id', protect, isAdmin, updateTourValidator, validate, updateTour);
router.delete('/:id', protect, isAdmin, deleteTour);

module.exports = router;
