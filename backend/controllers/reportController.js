const Report = require('../models/Report');
const User = require('../models/User');
const { logAdminAction } = require('./authController');

// Create report
exports.createReport = async (req, res) => {
  try {
    const { reportedUser, reason, description, messageId } = req.body;

    if (!reportedUser || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report = new Report({
      reportedUser,
      reportedBy: req.userId,
      reason,
      description,
      messageId,
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('[CREATE_REPORT_ERROR]', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const { status = 'open' } = req.query;

    const reports = await Report.find({ status })
      .populate('reportedUser', 'username avatar rank')
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('[GET_REPORTS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Resolve report
exports.resolveReport = async (req, res) => {
  try {
    const { status, resolution } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolution,
        resolvedBy: req.userId,
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await logAdminAction(req.userId, 'resolve-report', report.reportedUser, { reportId: report._id }, req);

    res.json(report);
  } catch (error) {
    console.error('[RESOLVE_REPORT_ERROR]', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};
