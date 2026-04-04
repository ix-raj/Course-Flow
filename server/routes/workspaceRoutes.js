// server/routes/workspaceRoutes.js
const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/workspace
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ user: req.user._id }).lean();
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// @route   PUT /api/workspace/:courseId/video
// @desc    Sync ALL video-specific data (Time, Completion, Notes, Doubts, Tasks)
router.put('/:courseId/video', protect, async (req, res) => {
  try {
    const { fileName, time, completed, doubts, notes, tasks } = req.body;
    
    const workspace = await Workspace.findOne({ user: req.user._id, course: req.params.courseId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Get existing data for this file or initialize defaults
    const currentData = workspace.videoProgress.get(fileName) || { 
      time: 0, 
      completed: false, 
      doubts: [], 
      notes: [], 
      tasks: [] 
    };
    
    // Update fields only if they are provided in the request
    if (time !== undefined) currentData.time = time;
    if (completed !== undefined) currentData.completed = completed;
    if (doubts !== undefined) currentData.doubts = doubts;
    if (notes !== undefined) currentData.notes = notes;
    if (tasks !== undefined) currentData.tasks = tasks;

    workspace.videoProgress.set(fileName, currentData);
    await workspace.save();

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync video progress' });
  }
});

// @route   PUT /api/workspace/:courseId/goals
// @desc    Update the Course-Wide Goals (not specific to one video)
router.put('/:courseId/goals', protect, async (req, res) => {
  try {
    const { courseGoals } = req.body;
    const workspace = await Workspace.findOne({ user: req.user._id, course: req.params.courseId });
    
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    workspace.courseGoals = courseGoals;
    await workspace.save();

    res.json(workspace.courseGoals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course goals' });
  }
});

// @route   PUT /api/workspace/:courseId/meta
// @desc    Update course-level workspace metadata
router.put('/:courseId/meta', protect, async (req, res) => {
  try {
    const { courseNotes, notionUrl, revisionList } = req.body;
    const workspace = await Workspace.findOne({ user: req.user._id, course: req.params.courseId });

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const nextMeta = {
      courseNotes: courseNotes !== undefined ? courseNotes : workspace.courseMeta?.courseNotes || '',
      notionUrl: notionUrl !== undefined ? notionUrl : workspace.courseMeta?.notionUrl || '',
      revisionList: revisionList !== undefined ? revisionList : workspace.courseMeta?.revisionList || []
    };

    workspace.courseMeta = nextMeta;
    await workspace.save();

    res.json(workspace.courseMeta);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course metadata' });
  }
});

module.exports = router;
