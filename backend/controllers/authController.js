const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');

// In-memory storage for when database is unavailable
const inMemoryUsers = [];

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate random username
const generateRandomUsername = async () => {
  const animals = ['ghost', 'cyber', 'nexus', 'vortex', 'phantom', 'cipher', 'rogue', 'echo'];
  const numbers = ['silent', 'swift', 'dark', 'cold', 'wise', 'sharp', 'brave', 'quick'];
  let username;
  let exists = true;

  while (exists) {
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    username = `${animal}_${number}`;

    try {
      exists = await User.findOne({ username });
    } catch {
      // Database unavailable, check in-memory
      exists = inMemoryUsers.find(u => u.username === username);
    }
  }

  return username;
};

// Validate admin password securely
const validateAdminPassword = async (inputPassword) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('[SECURITY] Admin password not configured');
    return false;
  }
  return inputPassword === adminPassword;
};

// Log admin actions
const logAdminAction = async (adminId, action, targetUserId = null, details = null, req = null) => {
  try {
    await AdminLog.create({
      admin: adminId,
      action,
      targetUser: targetUserId,
      details,
      ipAddress: req ? req.ip : null,
      userAgent: req ? req.get('user-agent') : null,
    });
  } catch (error) {
    console.error('[ADMIN_LOG_ERROR]', error.message);
  }
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Generate random username
    const finalUsername = await generateRandomUsername();

    try {
      // Try database first
      let user = await User.findOne({ username: finalUsername });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      user = new User({
        username: finalUsername,
        passwordHash: password,
        email: `${finalUsername}@anon.local`,
        rank: 'Newbie',
        points: 0,
      });

      await user.save();
      const token = generateToken(user._id);

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: user.getPublicProfile(),
      });
    } catch (dbError) {
      console.log('[REGISTER] Database unavailable, using in-memory storage');
      
      // Use in-memory storage as fallback
      const inMemUser = {
        _id: Math.random().toString(36).substr(2, 9),
        username: finalUsername,
        passwordHash: password,
        email: `${finalUsername}@anon.local`,
        rank: 'Newbie',
        points: 0,
        isAdmin: false,
        createdAt: new Date(),
        getPublicProfile() {
          return {
            _id: this._id,
            username: this.username,
            rank: this.rank,
            points: this.points,
            email: this.email,
            isAdmin: this.isAdmin,
          };
        }
      };

      inMemoryUsers.push(inMemUser);
      const token = generateToken(inMemUser._id);

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: inMemUser.getPublicProfile(),
      });
    }
  } catch (error) {
    console.error('[REGISTER_ERROR]', error.message);
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    try {
      // Try database first
      const user = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({ message: 'Account suspended or banned' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: user.getPublicProfile(),
      });
    } catch (dbError) {
      console.log('[LOGIN] Database unavailable, checking in-memory');
      
      // Check in-memory users
      const user = inMemoryUsers.find(u => 
        u.username === username || u.email === username
      );

      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: user.getPublicProfile(),
      });
    }
  } catch (error) {
    console.error('[LOGIN_ERROR]', error.message);
    res.status(500).json({ message: 'Login failed: ' + error.message });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const isValid = await validateAdminPassword(password);
    if (!isValid) {
      console.log('[SECURITY] Failed admin login attempt from IP: ' + req.ip);
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    try {
      let adminUser = await User.findOne({ username: 'admin' });

      if (!adminUser) {
        adminUser = new User({
          username: 'admin',
          passwordHash: 'admin_panel',
          email: 'admin@anon.local',
          isAdmin: true,
          rank: 'Admin',
          status: 'active',
          points: 9999,
        });
        await adminUser.save();
      }

      await logAdminAction(adminUser._id, 'ADMIN_LOGIN', null, { ip: req.ip }, req);
      const token = generateToken(adminUser._id);

      res.json({
        message: 'Admin login successful',
        token,
        user: adminUser.getPublicProfile(),
      });
    } catch (dbError) {
      console.log('[ADMIN_LOGIN] Database unavailable, using in-memory admin');
      
      // Use in-memory admin user
      const adminUser = {
        _id: 'admin-id-' + Math.random().toString(36).substr(2, 5),
        username: 'admin',
        passwordHash: 'admin_panel',
        email: 'admin@anon.local',
        isAdmin: true,
        rank: 'Admin',
        points: 9999,
        getPublicProfile() {
          return {
            _id: this._id,
            username: this.username,
            rank: this.rank,
            points: this.points,
            email: this.email,
            isAdmin: this.isAdmin,
          };
        }
      };

      const token = generateToken(adminUser._id);

      res.json({
        message: 'Admin login successful',
        token,
        user: adminUser.getPublicProfile(),
      });
    }
  } catch (error) {
    console.error('[ADMIN_LOGIN_ERROR]', error.message);
    res.status(500).json({ message: 'Admin login failed: ' + error.message });
  }
};

// Verify admin credentials
const verifyAdminCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not an admin' });
    }

    res.json({
      message: 'Admin verified',
      isAdmin: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[VERIFY_ADMIN_ERROR]', error.message);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('tasks.taskId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('[GET_PROFILE_ERROR]', error.message);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[UPDATE_PROFILE_ERROR]', error.message);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  verifyAdminCredentials,
  getProfile,
  updateProfile,
  generateToken,
  generateRandomUsername,
  validateAdminPassword,
  logAdminAction,
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate random username
const generateRandomUsername = async () => {
  const animals = ['ghost', 'cyber', 'nexus', 'vortex', 'phantom', 'cipher', 'rogue', 'echo'];
  const numbers = ['silent', 'swift', 'dark', 'cold', 'wise', 'sharp', 'brave', 'quick'];
  let username;
  let exists = true;

  while (exists) {
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    username = `${animal}_${number}`;

    exists = await User.findOne({ username });
  }

  return username;
};

// Validate admin password securely
const validateAdminPassword = async (inputPassword) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('[SECURITY] Admin password not configured');
    return false;
  }
  return inputPassword === adminPassword;
};

// Log admin actions
const logAdminAction = async (adminId, action, targetUserId = null, details = null, req = null) => {
  try {
    await AdminLog.create({
      admin: adminId,
      action,
      targetUser: targetUserId,
      details,
      ipAddress: req ? req.ip : null,
      userAgent: req ? req.get('user-agent') : null,
    });
  } catch (error) {
    console.error('[ADMIN_LOG_ERROR]', error.message);
  }
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ username: username.toLowerCase() }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate random username if not provided or create new user with custom username
    const finalUsername = await generateRandomUsername();

    // Create new user
    user = new User({
      username: finalUsername,
      passwordHash: password,
      email: `${finalUsername}@anon.local`,
      rank: 'Newbie',
      points: 0,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[REGISTER_ERROR]', error.message || error);
    
    // Return specific error messages for debugging
    if (error.message.includes('buffering timed out')) {
      return res.status(503).json({ message: 'Database unavailable - please try again' });
    }
    if (error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({ message: 'Database connection failed' });
    }
    
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is suspended/banned
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ message: 'Account suspended or banned' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    // Validate admin password
    const isValid = await validateAdminPassword(password);
    if (!isValid) {
      console.log('[SECURITY] Failed admin login attempt from IP: ' + req.ip);
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    // Create or get admin user
    let adminUser = await User.findOne({ username: 'admin' });

    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        passwordHash: 'admin_panel',
        email: 'admin@anon.local',
        isAdmin: true,
        rank: 'Admin',
        status: 'active',
        points: 9999,
      });
      await adminUser.save();
    }

    // Log admin login
    await logAdminAction(adminUser._id, 'ADMIN_LOGIN', null, { ip: req.ip }, req);

    const token = generateToken(adminUser._id);

    res.json({
      message: 'Admin login successful',
      token,
      user: adminUser.getPublicProfile(),
    });
  } catch (error) {
    console.error('[ADMIN_LOGIN_ERROR]', error);
    res.status(500).json({ message: 'Admin login failed' });
  }
};

// Verify admin credentials
const verifyAdminCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not an admin' });
    }

    res.json({
      message: 'Admin verified',
      isAdmin: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[VERIFY_ADMIN_ERROR]', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('tasks.taskId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('[GET_PROFILE_ERROR]', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('[UPDATE_PROFILE_ERROR]', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  generateToken,
  generateRandomUsername,
  validateAdminPassword,
  logAdminAction,
  register,
  login,
  adminLogin,
  verifyAdminCredentials,
  getProfile,
  updateProfile,
};
