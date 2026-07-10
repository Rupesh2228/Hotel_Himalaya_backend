const express = require('express');
const router = express.Router();
const { getRooms } = require('../controllers/adminController');

// Public rooms listing
router.get('/', getRooms);

module.exports = router;
