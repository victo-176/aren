const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9_]{3,20}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    rank: {
      type: String,
      enum: ['Newbie', 'Hacker', 'Elite', 'Legend', 'Admin'],
      default: 'Newbie',
    },
    points: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    tasks: [
      {
        taskId: mongoose.Schema.Types.ObjectId,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],
    achievements: [String],
    onlineStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Method to get user profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    avatar: this.avatar,
    rank: this.rank,
    points: this.points,
    level: this.level,
    onlineStatus: this.onlineStatus,
  };
};

module.exports = mongoose.model('User', userSchema);
