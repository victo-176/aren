const Message = require('../models/Message');
const User = require('../models/User');

// Get messages (most recent)
exports.getMessages = async (req, res) => {
  try {
    const { channel = 'general', limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({ channel })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ channel });

    res.json({
      messages: messages.reverse(),
      total,
      channel,
    });
  } catch (error) {
    console.error('[GET_MESSAGES_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send message (for testing, real messages go through WebSocket)
exports.sendMessage = async (req, res) => {
  try {
    const { content, channel = 'general' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const user = await User.findById(req.userId);
    const message = new Message({
      sender: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        rank: user.rank,
      },
      content,
      channel,
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('[SEND_MESSAGE_ERROR]', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Delete message (admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { deletedBy: req.userId },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted', data: message });
  } catch (error) {
    console.error('[DELETE_MESSAGE_ERROR]', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { query, channel = 'general' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const messages = await Message.find({
      channel,
      content: new RegExp(query, 'i'),
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('[SEARCH_MESSAGES_ERROR]', error);
    res.status(500).json({ error: 'Search failed' });
  }
};
