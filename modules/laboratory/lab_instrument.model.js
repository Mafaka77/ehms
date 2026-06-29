const mongoose = require('mongoose')

const labInstrumentSchema = new mongoose.Schema({

  code: {
    type: String,
    default: null
  },

  name: {
    type: String,
    required: true
  },

  manufacturer: {
    type: String,
    default: null
  },

  model: {
    type: String,
    default: null
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabCategory'
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
})

module.exports = mongoose.model('LabInstrument', labInstrumentSchema)