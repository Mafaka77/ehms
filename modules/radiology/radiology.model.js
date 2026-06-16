const mongoose = require('mongoose')

const radiologySchema =
new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  name: {
    type: String,
    required: true,
    unique: true
  },

  description: {
    type: String,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps:true
})

module.exports =
mongoose.model(
  'Radiology',
  radiologySchema
)