const mongoose = require('mongoose');

const schema = mongoose.Schema;

const brandSchema = new schema({
  name: {
    type: String,
    required: true,
    unique: true, // no duplicate brands
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);