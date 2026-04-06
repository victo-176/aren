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
} = require('../controllers/adminController');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Admin routes (all protected)
router.get('/dashboard/stats', authenticateToken, adminOnly, getDashboardStats);
router.get('/users', authenticateToken, adminOnly, getAllUsers);
router.get('/logs', authenticateToken, adminOnly, getAdminLogs);

router.post('/users/:userId/suspend', authenticateToken, adminOnly, suspendUser);
router.post('/users/:userId/ban', authenticateToken, adminOnly, banUser);
router.post('/users/:userId/unban', authenticateToken, adminOnly, unbanUser);
router.post('/users/:userId/points', authenticateToken, adminOnly, addPoints);
router.put('/users/:userId/rank', authenticateToken, adminOnly, changeRank);
router.post('/users/:userId/reset-username', authenticateToken, adminOnly, resetUsername);

router.delete('/messages/:messageId', authenticateToken, adminOnly, deleteMessage);

module.exports = router;
