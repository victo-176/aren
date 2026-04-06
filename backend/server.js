require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { authenticateToken, adminOnly } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

// Initialize Express and Socket.io
const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = socketIo(server, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(apiLimiter);

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Socket.io connection handling
const userSockets = new Map(); // Map to store user connections
const typingUsers = new Map(); // Track who's typing

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id;
      socket.username = user.username;
      socket.userRank = user.rank;
      socket.userAvatar = user.avatar;
      next();
    });
  } catch (error) {
    next(new Error('Socket authentication failed'));
  }
});

io.on('connection', async (socket) => {
  console.log(`[SOCKET] User connected: ${socket.username} (${socket.id})`);

  // Store user socket
  userSockets.set(socket.userId, socket.id);

  // Update user online status
  await User.findByIdAndUpdate(socket.userId, { onlineStatus: true });

  // Notify others user is online
  io.emit('user-online', {
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date(),
  });

  // Join general channel
  socket.join('general');

  // Handle message send
  socket.on('send-message', async (data) => {
    try {
      const { content, channel = 'general' } = data;

      if (!content || content.trim().length === 0) return;

      const user = await User.findById(socket.userId);

      const message = new Message({
        sender: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          rank: user.rank,
        },
        content: content.trim(),
        channel,
      });

      await message.save();

      io.to(channel).emit('new-message', {
        id: message._id,
        sender: message.sender,
        content: message.content,
        channel,
        createdAt: message.createdAt,
      });

      // Clear typing indicator
      typingUsers.delete(socket.userId);
      io.to(channel).emit('user-stopped-typing', {
        userId: socket.userId,
        username: socket.username,
      });
    } catch (error) {
      console.error('[MESSAGE_ERROR]', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('user-typing', (data) => {
    const { channel = 'general' } = data;

    typingUsers.set(socket.userId, {
      username: socket.username,
      channel,
      timestamp: Date.now(),
    });

    io.to(channel).emit('user-typing', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  // Handle stop typing
  socket.on('user-stopped-typing', (data) => {
    const { channel = 'general' } = data;

    typingUsers.delete(socket.userId);
    io.to(channel).emit('user-stopped-typing', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  // Join channel
  socket.on('join-channel', (data) => {
    const { channel } = data;
    socket.join(channel);

    io.to(channel).emit('user-joined', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date(),
    });
  });

  // Leave channel
  socket.on('leave-channel', (data) => {
    const { channel } = data;
    socket.leave(channel);

    io.to(channel).emit('user-left', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date(),
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`[SOCKET] User disconnected: ${socket.username}`);

    // Update user offline status
    await User.findByIdAndUpdate(socket.userId, { onlineStatus: false });

    // Remove from typing users
    typingUsers.delete(socket.userId);

    // Remove from user sockets map
    userSockets.delete(socket.userId);

    // Notify others
    io.emit('user-offline', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date(),
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[SOCKET_ERROR] ${socket.username}: ${error}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[SERVER] Shutting down gracefully...');
  io.close();
  server.close(() => {
    console.log('[SERVER] Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
