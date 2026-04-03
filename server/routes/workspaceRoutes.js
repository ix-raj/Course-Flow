// server/routes/workspaceRoutes.js
const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/workspace
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ user: req.user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/workspace/:courseId/video
router.put('/:courseId/video', protect, async (req, res) => {
  try {
    const { fileName, time, completed, doubts } = req.body;
    
    const workspace = await Workspace.findOne({ user: req.user._id, course: req.params.courseId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Ensure we handle Map updates correctly
    const currentData = workspace.videoProgress.get(fileName) || { time: 0, completed: false, doubts: [] };
    
    if (time !== undefined) currentData.time = time;
    if (completed !== undefined) currentData.completed = completed;
    if (doubts !== undefined) currentData.doubts = doubts;

    workspace.videoProgress.set(fileName, currentData);
    await workspace.save();

    res.json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update workspace progress' });
  }
});

module.exports = router;