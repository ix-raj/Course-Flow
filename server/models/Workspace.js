const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  masterNotes: { type: String, default: '' },
  notionUrl: { type: String, default: '' },
  courseGoals: [{ id: String, text: String, done: { type: Boolean, default: false } }],
  revisionList: [{ type: String }], 
  customLinks: [{ label: String, url: String }], 
  
  videoProgress: {
    type: Map,
    of: new mongoose.Schema({
      time: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      doubts: [{
        id: String,
        question: String,
        answer: String,
        resolved: { type: Boolean, default: false }
      }]
    }, { _id: false })
  }
}, { timestamps: true });

workspaceSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Workspace', workspaceSchema);