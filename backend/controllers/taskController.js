const Task = require('../models/Task');
const User = require('../models/User');
const { logAdminAction } = require('./authController');

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, pointsReward = 10, priority = 'medium', dueDate } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      pointsReward,
      priority,
      dueDate,
      createdBy: req.userId,
    });

    await task.save();

    await logAdminAction(req.userId, 'assign-task', assignedTo, { taskId: task._id }, req);

    res.status(201).json(task);
  } catch (error) {
    console.error('[CREATE_TASK_ERROR]', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).populate('assignedTo', 'username avatar rank');

    res.json(tasks);
  } catch (error) {
    console.error('[GET_TASKS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get user tasks
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.userId });
    res.json(tasks);
  } catch (error) {
    console.error('[GET_USER_TASKS_ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assignedTo.toString() !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();

      // Award points
      const user = await User.findById(task.assignedTo);
      user.points += task.pointsReward;
      
      // Calculate level (every 100 points = 1 level)
      user.level = Math.floor(user.points / 100) + 1;
      
      // Update rank based on level
      if (user.level >= 50) user.rank = 'Legend';
      else if (user.level >= 20) user.rank = 'Elite';
      else if (user.level >= 10) user.rank = 'Hacker';

      await user.save();
    }

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('[UPDATE_TASK_ERROR]', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('[DELETE_TASK_ERROR]', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
