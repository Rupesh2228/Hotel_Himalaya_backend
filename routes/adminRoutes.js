const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const {
  roomValidator,
  attractionValidator,
  galleryImageValidator,
  galleryCategoryValidator,
  addAdminValidator,
  updateUserRoleValidator,
} = require('../validators/admin.validator');
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
  deleteUser,
  addGalleryCategory,
  deleteGalleryCategory,
} = require('../controllers/adminController');

// Admin-only routes
router.get('/users', protect, isAdmin, getUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.post('/add-admin', protect, isAdmin, addAdminValidator, validate, addAdmin);
router.put('/users/:id/role', protect, isAdmin, updateUserRoleValidator, validate, updateUserRole);

router.post('/gallery', protect, isAdmin, galleryImageValidator, validate, addGalleryImage);
router.delete('/gallery/:id', protect, isAdmin, deleteGalleryImage);
router.post('/gallery-categories', protect, isAdmin, galleryCategoryValidator, validate, addGalleryCategory);
router.delete('/gallery-categories/:id', protect, isAdmin, deleteGalleryCategory);

router.post('/rooms', protect, isAdmin, roomValidator, validate, addRoom);
router.put('/rooms/:id', protect, isAdmin, roomValidator, validate, updateRoom);
router.delete('/rooms/:id', protect, isAdmin, deleteRoom);

router.post('/attractions', protect, isAdmin, attractionValidator, validate, addAttraction);
router.put('/attractions/:id', protect, isAdmin, attractionValidator, validate, updateAttraction);
router.delete('/attractions/:id', protect, isAdmin, deleteAttraction);

module.exports = router;
