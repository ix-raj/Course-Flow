const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  folderName: { type: String, required: true }, 
  videoCount: { type: Number, default: 0 },
  noteCount: { type: Number, default: 0 },
  // ADDED: For custom button links
  customLinks: [{
    label: String,
    url: String
  }],
  // ADDED: For library organization
  tags: [String] 
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);