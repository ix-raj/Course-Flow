// server/models/Productivity.js
const mongoose = require('mongoose');

const routineItemSchema = new mongoose.Schema({
  id: String,
  title: String,
  subtitle: String,
  duration: Number,
  iconName: String,
  iconColor: String, 
  linkedCourseId: { type: String, default: null },
  customLink: {
    label: { type: String, default: '' },
    url: { type: String, default: '' }
  }
}, { _id: false });

const productivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Replaces the old 'weeklyPlan' map
  weeklyRoutine: {
    type: Map,
    of: [routineItemSchema],
    default: {}
  },
  
  // Retains historical task completion (e.g., "2026-08-28_taskId": true)
  completionLog: {
    type: Map,
    of: Boolean,
    default: {}
  },
  
  // Retains calendar events
  monthlyEvents: {
    type: Map,
    of: [{ id: String, title: String, time: String, date: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Productivity', productivitySchema);