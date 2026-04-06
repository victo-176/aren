const User = require('../models/User');
const Message = require('../models/Message');
const Task = require('../models/Task');
const AdminLog = require('../models/AdminLog');
const { logAdminAction, generateRandomUsername } = require('./authController');

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ onlineStatus: true });
    const totalMessages = await Message.countDocuments();
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    res.json({
      totalUsers,
      activeUsers,
      totalMessages,
      bannedUsers,
      suspendedUsers,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[DASHBOARD_STATS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Suspend user
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'suspended' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'user-suspend', userId, { reason }, req);

    res.json({ message: 'User suspended', user });
  } catch (error) {
    console.error('[SUSPEND_USER_ERROR]', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
};

// Ban user
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'banned' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'user-ban', userId, { reason }, req);

    res.json({ message: 'User banned', user });
  } catch (error) {
    console.error('[BAN_USER_ERROR]', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

// Unban user
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'active' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'user-unban', userId, {}, req);

    res.json({ message: 'User unbanned', user });
  } catch (error) {
    console.error('[UNBAN_USER_ERROR]', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

// Add points to user
exports.addPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.points += points;
    user.level = Math.floor(user.points / 100) + 1;

    if (user.level >= 50) user.rank = 'Legend';
    else if (user.level >= 20) user.rank = 'Elite';
    else if (user.level >= 10) user.rank = 'Hacker';

    await user.save();

    await logAdminAction(req.userId, 'modify-points', userId, { points }, req);

    res.json({ message: 'Points added', user });
  } catch (error) {
    console.error('[ADD_POINTS_ERROR]', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
};

// Change user rank
exports.changeRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rank } = req.body;

    const validRanks = ['Newbie', 'Hacker', 'Elite', 'Legend'];
    if (!validRanks.includes(rank)) {
      return res.status(400).json({ error: 'Invalid rank' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { rank },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'change-rank', userId, { rank }, req);

    res.json({ message: 'Rank changed', user });
  } catch (error) {
    console.error('[CHANGE_RANK_ERROR]', error);
    res.status(500).json({ error: 'Failed to change rank' });
  }
};

// Reset/randomize username
exports.resetUsername = async (req, res) => {
  try {
    const { userId } = req.params;

    const newUsername = await generateRandomUsername();

    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'reset-username', userId, { newUsername }, req);

    res.json({ message: 'Username reset', user, newUsername });
  } catch (error) {
    console.error('[RESET_USERNAME_ERROR]', error);
    res.status(500).json({ error: 'Failed to reset username' });
  }
};

// Get admin logs
exports.getAdminLogs = async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    const filter = {};

    if (action) filter.action = action;

    const logs = await AdminLog.find(filter)
      .populate('admin', 'username')
      .populate('targetUser', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('[GET_ADMIN_LOGS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
};

// Delete message (admin)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await logAdminAction(req.userId, 'delete-message', null, { messageId }, req);

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('[DELETE_MESSAGE_ERROR]', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Get all users (for admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { status, rank, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (rank) filter.rank = rank;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-passwordHash')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('[GET_ALL_USERS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all messages (admin)
exports.getAllMessages = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const messages = await Message.find()
      .populate('sender.id', 'username avatar rank')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Message.countDocuments();

    res.json({
      messages,
      total,
    });
  } catch (error) {
    console.error('[GET_ALL_MESSAGES_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get all tasks (admin)
exports.getAllTasks = async (req, res) => {
  try {
    const { status, limit = 100, skip = 0 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'username avatar rank')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      total,
    });
  } catch (error) {
    console.error('[GET_ALL_TASKS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get all reports (admin)
exports.getAllReports = async (req, res) => {
  try {
    const { status = 'open', limit = 100, skip = 0 } = req.query;

    const reports = await Report.find({ status })
      .populate('reportedUser', 'username avatar rank')
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ status });

    res.json({
      reports,
      total,
    });
  } catch (error) {
    console.error('[GET_ALL_REPORTS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};
