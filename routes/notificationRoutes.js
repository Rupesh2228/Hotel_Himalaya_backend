const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  getPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptionStatus
} = require('../controllers/pushController');

// Admin notification routes
router.get('/', protect, isAdmin, getNotifications);
router.patch('/:id/read', protect, isAdmin, markAsRead);
router.patch('/read-all', protect, isAdmin, markAllAsRead);
router.delete('/:id', protect, isAdmin, deleteNotification);

// Legacy route aliases
router.post('/:id/read', protect, isAdmin, markAsRead);
router.post('/read-all', protect, isAdmin, markAllAsRead);

// Web Push routes (public key is safe to expose)
router.get('/push/public-key', getPublicKey);
router.post('/push/subscribe', protect, isAdmin, subscribe);
router.delete('/push/unsubscribe', protect, isAdmin, unsubscribe);
router.get('/push/status', protect, isAdmin, getSubscriptionStatus);

// Legacy push routes
router.delete('/push/subscribe', protect, isAdmin, unsubscribe);

module.exports = router;
