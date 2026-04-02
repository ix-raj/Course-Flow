const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: String,
  text: String,
  time: String
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
  
  weeklyPlan: {
    type: Map,
    of: {
      focus: { type: String, default: '' },
      subjects: [subjectSchema]
    }
  },
  
  completionLog: {
    type: Map,
    of: Boolean,
    default: {}
  },

  monthlyEvents: {
    type: Map,
    of: [{ id: String, title: String, time: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Productivity', productivitySchema);