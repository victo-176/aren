const User = require('../models/User');

// Get all users (paginated)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-passwordHash')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users: users.map(u => u.getPublicProfile()),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[GET_USERS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('[GET_USER_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const users = await User.find({
      username: new RegExp(query, 'i'),
    }).select('-passwordHash');

    res.json(users.map(u => u.getPublicProfile()));
  } catch (error) {
    console.error('[SEARCH_USERS_ERROR]', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get user tasks
exports.getUserTasks = async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({ assignedTo: req.params.id });
    res.json(tasks);
  } catch (error) {
    console.error('[GET_USER_TASKS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};
