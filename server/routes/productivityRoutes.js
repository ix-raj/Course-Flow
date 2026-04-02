// routes/productivity.js
const express = require('express');
const router = express.Router();
const Productivity = require('../models/Productivity');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/productivity
// @desc    Get or Create user's productivity planner
router.get('/', protect, async (req, res) => {
  try {
    let prod = await Productivity.findOne({ user: req.user._id });
    
    // If user opens Goals for the first time, generate their doc
    if (!prod) {
      prod = await Productivity.create({ user: req.user._id, weeklyPlan: {}, completionLog: {}, monthlyEvents: {} });
    }
    
    res.json(prod);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/productivity
// @desc    Update the entire productivity document (easy sync)
router.put('/', protect, async (req, res) => {
  try {
    const updatedProd = await Productivity.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updatedProd);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update productivity' });
  }
});

module.exports = router;