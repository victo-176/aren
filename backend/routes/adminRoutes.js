const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  suspendUser,
  banUser,
  unbanUser,
  addPoints,
  changeRank,
  resetUsername,
  getAdminLogs,
  deleteMessage,
  getAllUsers,
  getAllMessages,
  getAllTasks,
  getAllReports,
} = require('../controllers/adminController');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const Task = require('../models/Task');

// Admin routes (all protected)
router.get('/dashboard/stats', authenticateToken, adminOnly, getDashboardStats);
router.get('/users', authenticateToken, adminOnly, getAllUsers);
router.get('/logs', authenticateToken, adminOnly, getAdminLogs);
router.get('/messages', authenticateToken, adminOnly, getAllMessages);
router.get('/tasks', authenticateToken, adminOnly, getAllTasks);
router.get('/reports', authenticateToken, adminOnly, getAllReports);

router.post('/users/:userId/suspend', authenticateToken, adminOnly, suspendUser);
router.post('/users/:userId/ban', authenticateToken, adminOnly, banUser);
router.post('/users/:userId/unban', authenticateToken, adminOnly, unbanUser);
router.post('/users/:userId/points', authenticateToken, adminOnly, addPoints);
router.put('/users/:userId/rank', authenticateToken, adminOnly, changeRank);
router.post('/users/:userId/reset-username', authenticateToken, adminOnly, resetUsername);

router.delete('/messages/:messageId', authenticateToken, adminOnly, deleteMessage);

// Delete task
router.delete('/tasks/:taskId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('[DELETE_TASK_ERROR]', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
