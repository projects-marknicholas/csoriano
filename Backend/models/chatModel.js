const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  file: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', chatSchema);