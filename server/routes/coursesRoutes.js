// server/routes/coursesRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/courses
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/courses
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, cover, folderName, videoCount, noteCount } = req.body;

    const course = await Course.create({
      user: req.user._id,
      title, description, cover, folderName, videoCount, noteCount
    });

    await Workspace.create({
      user: req.user._id,
      course: course._id,
      videoProgress: {}
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course details (New functional route)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, cover } = req.body;
    
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Security check: Verify ownership
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, cover } },
      { new: true }
    );

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// @route   DELETE /api/courses/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Course.findByIdAndDelete(req.params.id);
    await Workspace.findOneAndDelete({ course: req.params.id });
    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

module.exports = router;