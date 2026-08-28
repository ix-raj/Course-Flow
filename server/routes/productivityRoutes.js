// server/routes/productivityRoutes.js
const express = require('express');
const router = express.Router();
const Productivity = require('../models/Productivity');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/productivity
router.get('/', protect, async (req, res) => {
  try {
    let prod = await Productivity.findOne({ user: req.user._id });
    if (!prod) {
      prod = await Productivity.create({ 
        user: req.user._id,
        weeklyRoutine: {},
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
router.put('/', protect, async (req, res) => {
  try {
    const { weeklyRoutine, completionLog, monthlyEvents } = req.body;
    
    const updateData = {};
    if (weeklyRoutine) updateData.weeklyRoutine = weeklyRoutine;
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