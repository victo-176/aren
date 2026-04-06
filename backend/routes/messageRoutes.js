const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, deleteMessage, searchMessages } = require('../controllers/messageController');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Message routes
router.get('/', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.delete('/:id', authenticateToken, adminOnly, deleteMessage);
router.get('/search', authenticateToken, searchMessages);

module.exports = router;
