const mongoose = require('mongoose')
const labTestSchema = new mongoose.Schema({

  code:{
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabCategory'
  },

  sampleTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SampleType'
  },

  reportType: {
    type: String,
    enum: [
      'PARAMETER',
      'TEXT'
    ],
    default: 'PARAMETER'
  },

  rate: {
    type: Number,
    default: 0
  },

  turnaroundTimeHours: Number,

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true })

module.exports = mongoose.model('LabTest', labTestSchema)
