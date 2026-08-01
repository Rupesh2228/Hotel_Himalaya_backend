const express = require('express');
const {
  getAttractions,
  getAttractionBySlug,
  createAttraction,
  updateAttraction,
  deleteAttraction
} = require('../controllers/attractionController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getAttractions)
  .post(protect, isAdmin, createAttraction);

router.route('/slug/:slug').get(getAttractionBySlug);

router
  .route('/:id')
  .get(require('../controllers/adminController').getAttractionById) // Kept for backward compatibility
  .put(protect, isAdmin, updateAttraction)
  .delete(protect, isAdmin, deleteAttraction);

module.exports = router;
