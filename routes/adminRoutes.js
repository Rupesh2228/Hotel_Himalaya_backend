const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  getUsers,
  addGalleryImage,
  addRoom,
  updateRoom,
  deleteRoom,
  addAttraction,
  updateAttraction,
  deleteAttraction,
  deleteGalleryImage,
  addAdmin,
  updateUserRole,
} = require('../controllers/adminController');

// Admin-only routes
router.get('/users', protect, isAdmin, getUsers);
router.post('/add-admin', protect, isAdmin, addAdmin);
router.put('/users/:id/role', protect, isAdmin, updateUserRole);
router.post('/gallery', protect, isAdmin, addGalleryImage);
router.delete('/gallery/:id', protect, isAdmin, deleteGalleryImage);
router.post('/rooms', protect, isAdmin, addRoom);
router.put('/rooms/:id', protect, isAdmin, updateRoom);
router.delete('/rooms/:id', protect, isAdmin, deleteRoom);
router.post('/attractions', protect, isAdmin, addAttraction);
router.put('/attractions/:id', protect, isAdmin, updateAttraction);
router.delete('/attractions/:id', protect, isAdmin, deleteAttraction);

module.exports = router;
