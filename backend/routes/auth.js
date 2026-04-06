const User = require('../models/User');
const { generateToken, generateRandomUsername, validateAdminPassword, logAdminAction } = require('./authController');
const AdminLog = require('../models/AdminLog');

// User Registration
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const username = await generateRandomUsername();

    const user = new User({
      email: email.toLowerCase(),
      username,
      passwordHash: password,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.rank,
        points: user.points,
      },
    });
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        rank: user.rank,
        points: user.points,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const isValid = await validateAdminPassword(password);
    if (!isValid) {
      // Log failed attempt
      await AdminLog.create({
        admin: null,
        action: 'admin-login-failed',
        details: { ip: req.ip },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Return admin token (requires user to have admin role)
    res.json({
      message: 'Admin password verified',
      adminPasswordValid: true,
    });
  } catch (error) {
    console.error('[ADMIN_LOGIN_ERROR]', error);
    res.status(500).json({ error: 'Admin authentication failed' });
  }
};

// Verify Admin Credentials and return token
exports.verifyAdminCredentials = async (req, res) => {
  try {
    const { userId, adminPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    const isValid = await validateAdminPassword(adminPassword);
    if (!isValid) {
      await logAdminAction(userId, 'admin-login-failed', null, { ip: req.ip }, req);
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    await logAdminAction(userId, 'login', null, { type: 'admin' }, req);

    const token = generateToken(user._id);

    res.json({
      message: 'Admin authentication successful',
      token,
      adminToken: true,
    });
  } catch (error) {
    console.error('[ADMIN_VERIFY_ERROR]', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      rank: user.rank,
      points: user.points,
      level: user.level,
      status: user.status,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('[GET_PROFILE_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    );

    res.json({
      message: 'Profile updated',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[UPDATE_PROFILE_ERROR]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
