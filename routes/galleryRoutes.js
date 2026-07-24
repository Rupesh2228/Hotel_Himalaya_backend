const express = require('express');
const router = express.Router();
const { getGalleryImages, getGalleryCategories } = require('../controllers/adminController');

// Public gallery categories
router.get('/categories', getGalleryCategories);

// Public gallery listing
router.get('/', getGalleryImages);

module.exports = router;
