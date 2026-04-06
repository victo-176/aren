const express = require('express');
const router = express.Router();
const { register, login, adminLogin, verifyAdminCredentials, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Auth routes
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/admin-login', loginLimiter, adminLogin);
router.post('/verify-admin', authenticateToken, verifyAdminCredentials);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
