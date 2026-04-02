// routes/workspace.js
const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/workspace
// @desc    Get all workspaces (progress) for the user
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ user: req.user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/workspace/:courseId/video
// @desc    Update progress or completion for a specific video
router.put('/:courseId/video', protect, async (req, res) => {
  try {
    const { fileName, time, completed } = req.body;
    
    const workspace = await Workspace.findOne({ user: req.user._id, course: req.params.courseId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Update the Map dynamically
    const currentData = workspace.videoProgress.get(fileName) || { time: 0, completed: false, doubts: [] };
    
    if (time !== undefined) currentData.time = time;
    if (completed !== undefined) currentData.completed = completed;

    workspace.videoProgress.set(fileName, currentData);
    await workspace.save();

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

module.exports = router;