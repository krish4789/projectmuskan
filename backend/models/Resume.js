const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  parsedText: String,
  score: Number,
  wordCount: Number,
  detectedSections: [String],
  missingSections: [String],
  suggestions: [String],
  feedback: String,
  atsScore: Number,
  atsFeedback: String,
  categories: { type: mongoose.Schema.Types.Mixed },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
