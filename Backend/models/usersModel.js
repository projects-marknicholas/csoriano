const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  Username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  Firstname: {
    type: String,
    required: true,
    trim: true
  },
  Lastname: {
    type: String,
    required: true,
    trim: true
  },
  Address: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user'], 
    required: true,
    default: 'user'
  },
  forgotPassword: { 
    type: Boolean, 
    default: false 
  }
}, {timestamps: true})

// Create a compound index to ensure Firstname + Lastname combination is unique
userSchema.index({ Firstname: 1, Lastname: 1 }, { unique: true })

module.exports = mongoose.model('User', userSchema)