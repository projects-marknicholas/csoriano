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
    type: [String], // Array of strings for storing multiple specifications
    default: [] // Default to an empty array if no specifications provided
  },
  brands: {
    type: [String], // Array of strings for storing multiple brands
    default: [] // Default to an empty array if no brands provided
  },
  supplier: {
    type: String,
    default: "" // Default to an empty string if no supplier provided
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
