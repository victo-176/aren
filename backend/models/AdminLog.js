const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'user-suspend',
        'user-ban',
        'user-unban',
        'assign-task',
        'modify-points',
        'change-rank',
        'delete-message',
        'reset-username',
        'view-logs',
      ],
      required: true,
    },
    targetUser: mongoose.Schema.Types.ObjectId,
    targetMessage: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminLog', adminLogSchema);
