const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  // ADDED: Course-wide goals (not specific to one video)
  courseGoals: [{ 
    id: String, 
    text: String, 
    done: { type: Boolean, default: false } 
  }],

  courseMeta: {
    courseNotes: { type: String, default: '' },
    notionUrl: { type: String, default: '' },
    revisionList: [{ type: String }]
  },
  
  videoProgress: {
    type: Map,
    of: new mongoose.Schema({
      time: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      // EXPANDED: Support for all video-specific sub-data
      notes: [String],
      tasks: [{ 
        id: String, 
        text: String, 
        done: { type: Boolean, default: false } 
      }],
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
