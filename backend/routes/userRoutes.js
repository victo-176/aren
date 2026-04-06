const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, searchUsers, getUserTasks } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// User routes
router.get('/', authenticateToken, getAllUsers);
router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, getUserById);
router.get('/:id/tasks', authenticateToken, getUserTasks);

module.exports = router;
