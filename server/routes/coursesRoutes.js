// server/routes/coursesRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/authMiddleware');

const normalizeCourse = (course) => {
  if (!course) return course;

  const externalUrl = typeof course.externalUrl === 'string' ? course.externalUrl.trim() : '';
  const courseType = course.courseType === 'external' || course.isExternal || externalUrl
    ? 'external'
    : 'local';

  return {
    ...course,
    id: course.id || String(course._id),
    courseType,
    isExternal: courseType === 'external',
    externalUrl: courseType === 'external' ? externalUrl : '',
    folderName: courseType === 'external'
      ? (course.folderName || 'External')
      : (course.folderName || ''),
    customLinks: Array.isArray(course.customLinks) ? course.customLinks : [],
    tags: Array.isArray(course.tags) ? course.tags : []
  };
};

// @route   GET /api/courses
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(courses.map(normalizeCourse));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/courses
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description = '',
      cover = '',
      folderName = '',
      videoCount = 0,
      noteCount = 0,
      isExternal,
      courseType,
      externalUrl = '',
      customLinks = [],
      tags = []
    } = req.body;

    const resolvedCourseType = courseType === 'external' || isExternal ? 'external' : 'local';
    const resolvedExternalUrl = resolvedCourseType === 'external' ? String(externalUrl).trim() : '';

    if (resolvedCourseType === 'external' && !resolvedExternalUrl) {
      return res.status(400).json({ message: 'External courses require a URL' });
    }
    
    const course = await Course.create({
      user: req.user._id,
      title,
      description,
      cover,
      folderName: resolvedCourseType === 'external' ? (folderName || 'External') : folderName,
      videoCount,
      noteCount,
      courseType: resolvedCourseType,
      isExternal: resolvedCourseType === 'external',
      externalUrl: resolvedExternalUrl,
      customLinks,
      tags
    });

    await Workspace.create({
      user: req.user._id,
      course: course._id,
      videoProgress: {}
    });
    
    res.status(201).json(normalizeCourse(course.toObject()));
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' });
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


// @route   PUT /api/courses/:id
// @desc    Update course metadata (Name, Cover, Description, Links)
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, cover, customLinks, tags, courseType, isExternal, externalUrl, folderName } = req.body;
    
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Authorization Check
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const nextCourseType = courseType === 'external' || isExternal === true
      ? 'external'
      : courseType === 'local' || isExternal === false
        ? 'local'
        : course.courseType || (course.isExternal ? 'external' : 'local');
    const nextExternalUrl = nextCourseType === 'external'
      ? (externalUrl !== undefined ? String(externalUrl).trim() : (course.externalUrl || '').trim())
      : '';

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (cover !== undefined) updates.cover = cover;
    if (customLinks !== undefined) updates.customLinks = customLinks;
    if (tags !== undefined) updates.tags = tags;
    if (courseType !== undefined || isExternal !== undefined) {
      updates.courseType = nextCourseType;
      updates.isExternal = nextCourseType === 'external';
    }
    if (externalUrl !== undefined || nextCourseType === 'external') {
      updates.externalUrl = nextExternalUrl;
    }
    if (folderName !== undefined) {
      updates.folderName = nextCourseType === 'external'
        ? (folderName || 'External')
        : folderName;
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    res.json(normalizeCourse(course.toObject()));
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});


module.exports = router;
