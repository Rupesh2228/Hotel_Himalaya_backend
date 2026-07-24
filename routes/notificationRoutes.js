const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { getPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');

router.get('/', protect, isAdmin, getNotifications);
router.get('/push/public-key', protect, isAdmin, getPublicKey);
router.post('/push/subscribe', protect, isAdmin, subscribe);
router.delete('/push/subscribe', protect, isAdmin, unsubscribe);
router.post('/read-all', protect, isAdmin, markAllAsRead);
router.post('/:id/read', protect, isAdmin, markAsRead);

module.exports = router;
