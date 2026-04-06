const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      id: mongoose.Schema.Types.ObjectId,
      username: String,
      avatar: String,
      rank: String,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    channel: {
      type: String,
      default: 'general',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isCommand: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete old messages (keep last 10,000)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('Message', messageSchema);
