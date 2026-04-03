// server/routes/productivityRoutes.js
const express = require('express');
const router = express.Router();
const Productivity = require('../models/Productivity');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/productivity
// @desc    Get or Create user's productivity planner
router.get('/', protect, async (req, res) => {
  try {
    let prod = await Productivity.findOne({ user: req.user._id });
    
    if (!prod) {
      prod = await Productivity.create({ 
        user: req.user._id, 
        weeklyPlan: {}, 
        completionLog: {}, 
        monthlyEvents: {} 
      });
    }
    
    res.json(prod);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/productivity
// @desc    Update specific sections of the planner (Weekly Plan, Events, or Log)
router.put('/', protect, async (req, res) => {
  try {
    const { weeklyPlan, completionLog, monthlyEvents } = req.body;
    
    const updateData = {};
    if (weeklyPlan) updateData.weeklyPlan = weeklyPlan;
    if (completionLog) updateData.completionLog = completionLog;
    if (monthlyEvents) updateData.monthlyEvents = monthlyEvents;

    const updatedProd = await Productivity.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json(updatedProd);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update productivity data' });
  }
});

module.exports = router;