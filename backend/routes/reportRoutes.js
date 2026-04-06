const express = require('express');
const router = express.Router();
const { createReport, getAllReports, resolveReport } = require('../controllers/reportController');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Report routes
router.post('/', authenticateToken, createReport);
router.get('/', authenticateToken, adminOnly, getAllReports);
router.put('/:id/resolve', authenticateToken, adminOnly, resolveReport);

module.exports = router;
