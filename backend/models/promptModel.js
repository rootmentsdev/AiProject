const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  promptText: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'DSR_ANALYSIS'
  },
  version: {
    type: String,
    default: '1.0'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
promptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;

