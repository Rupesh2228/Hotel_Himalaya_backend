const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/', protect, isAdmin, getNotifications);
router.post('/read-all', protect, isAdmin, markAllAsRead);
router.post('/:id/read', protect, isAdmin, markAsRead);

module.exports = router;
