const mongoose = require('mongoose')
const labTestParameterSchema =
new mongoose.Schema({

  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest'
  },

  name: String,

  unit: String,

  normalRangeMale: String,

  normalRangeFemale: String,

  normalRangeChild: String,

  displayOrder: Number,

  referenceIntervals: [{
    label: {
      type: String,
      required: true
    },
    range: {
      type: String,
      required: true
    }
  }]

}, { timestamps: true })

module.exports = mongoose.model('LabTestParameter', labTestParameterSchema)

