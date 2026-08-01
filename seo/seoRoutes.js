const express = require('express');
const {
  getSEOByPage,
  updateSEOByPage,
  getAllSEO
} = require('./seoController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, isAdmin, getAllSEO);

router
  .route('/:page')
  .get(getSEOByPage)
  .put(protect, isAdmin, updateSEOByPage);

module.exports = router;
