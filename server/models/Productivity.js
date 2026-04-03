// server/models/Productivity.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: String,
  text: String,
  time: String,
  done: { type: Boolean, default: false } // Added 'done' state for weekly tasks
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  id: String,
  name: String,
  courses: [String], 
  tasks: [taskSchema],
  actionUrls: { type: Map, of: { label: String, url: String } }
}, { _id: false });

const productivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Weekly structure (Monday, Tuesday, etc.)
  weeklyPlan: {
    type: Map,
    of: new mongoose.Schema({
      focus: { type: String, default: '' },
      subjects: [subjectSchema]
    }, { _id: false })
  },
  
  // Track daily completion (e.g., "2026-04-03": true)
  completionLog: {
    type: Map,
    of: Boolean,
    default: {}
  },

  // Calendar events
  monthlyEvents: {
    type: Map,
    of: [{ id: String, title: String, time: String, date: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Productivity', productivitySchema);