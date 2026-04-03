// routes/courses.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/courses
// @desc    Get all courses for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course and its workspace
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, cover, folderName, videoCount, noteCount } = req.body;

    // 1. Create the Course
    const course = await Course.create({
      user: req.user._id,
      title, description, cover, folderName, videoCount, noteCount
    });

    // 2. Initialize a blank Workspace for this course
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

// @route   DELETE /api/courses/:id
// @desc    Delete course and its workspace
router.delete('/:id', protect, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await Workspace.findOneAndDelete({ course: req.params.id });
    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course (title, description, cover)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, cover } = req.body;
    
    // Find the course and make sure the logged-in user owns it
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update the course
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

module.exports = router;