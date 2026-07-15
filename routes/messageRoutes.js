const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { createMessage, getMessages, markMessageRead, deleteMessage } = require('../controllers/messageController');

const router = express.Router();

router.post('/', createMessage);
router.get('/', getMessages);
router.put('/:id/read', protect, isAdmin, markMessageRead);
router.patch('/:id/read', protect, isAdmin, markMessageRead);
router.delete('/:id', protect, isAdmin, deleteMessage);

module.exports = router;
