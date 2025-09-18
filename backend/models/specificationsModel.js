// models/Specification.js
const mongoose = require('mongoose');

const schema = mongoose.Schema;

const specificationSchema = new schema({
  name: {
    type: String,
    required: true,
    unique: true, // no duplicate specifications
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Specification', specificationSchema);