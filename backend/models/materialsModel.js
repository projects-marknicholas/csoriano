const mongoose = require('mongoose');

const schema = mongoose.Schema;

const materialSchema = new schema({
  description: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  specifications: {
    type: String,
    required: true
  },
  supplier: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
