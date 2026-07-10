const express = require('express');
const router = express.Router();
const { getAttractions, getAttractionById } = require('../controllers/adminController');

// Public attraction listing
router.get('/', getAttractions);
router.get('/:id', getAttractionById);

module.exports = router;
