const express = require('express');
const router = express.Router();
const { getGalleryImages } = require('../controllers/adminController');

// Public gallery listing
router.get('/', getGalleryImages);

module.exports = router;
