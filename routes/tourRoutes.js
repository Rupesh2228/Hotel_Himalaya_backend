const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { createTour, getTours, updateTour, deleteTour, bookTour, getUserBookings, getUserBookingsGuest } = require('../controllers/tourController');

router.get('/', getTours);
router.post('/book', bookTour);
router.get('/my-bookings', protect, getUserBookings);
router.get('/my-bookings-guest', getUserBookingsGuest);

router.post('/', protect, isAdmin, createTour);
router.put('/:id', protect, isAdmin, updateTour);
router.delete('/:id', protect, isAdmin, deleteTour);

module.exports = router;
