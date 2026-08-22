const express = require('express');
const {
  getAttractions,
  getAttractionBySlug,
  createAttraction,
  updateAttraction,
  deleteAttraction
} = require('../controllers/attractionController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { attractionValidator } = require('../validators/admin.validator');

const router = express.Router();

router
  .route('/')
  .get(getAttractions)
  .post(protect, isAdmin, attractionValidator, validate, createAttraction);

router.route('/slug/:slug').get(getAttractionBySlug);

router
  .route('/:id')
  .get(require('../controllers/adminController').getAttractionById) // Kept for backward compatibility
  .put(protect, isAdmin, attractionValidator, validate, updateAttraction)
  .delete(protect, isAdmin, deleteAttraction);

module.exports = router;
