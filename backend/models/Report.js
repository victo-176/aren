const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'scam', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    messageId: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['open', 'under-review', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolvedBy: mongoose.Schema.Types.ObjectId,
    resolution: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
