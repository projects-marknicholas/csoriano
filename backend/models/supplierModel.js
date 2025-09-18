const mongoose = require('mongoose');

const schema = mongoose.Schema;

const supplierSchema = new schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);