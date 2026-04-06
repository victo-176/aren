const express = require('express');
const router = express.Router();
const { createTask, getAllTasks, getUserTasks, updateTaskStatus, deleteTask } = require('../controllers/taskController');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Task routes
router.post('/', authenticateToken, adminOnly, createTask);
router.get('/', authenticateToken, getAllTasks);
router.get('/user/my-tasks', authenticateToken, getUserTasks);
router.put('/:id/status', authenticateToken, updateTaskStatus);
router.delete('/:id', authenticateToken, adminOnly, deleteTask);

module.exports = router;
