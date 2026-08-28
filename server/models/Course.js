const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  folderName: { type: String, default: 'External' }, // Removed required: true
  videoCount: { type: Number, default: 0 },
  noteCount: { type: Number, default: 0 },
  
  // NEW FIELDS
  isExternal: { type: Boolean, default: false },
  externalUrl: { type: String, default: '' },
  
  customLinks: [{ label: String, url: String }],
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);