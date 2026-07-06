const mongoose = require('mongoose')

const labTestParameterSchema = new mongoose.Schema({

  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true,
    index: true
  },

  // Group/Section
  section: {
    type: String,
    default: null
    // HEMATOLOGY
    // PHYSICAL
    // CHEMICAL
    // MICROSCOPIC
    // DIFFERENTIAL
  },

  // Parameter
  code: {
    type: String,
    default: null
  },

  name: {
    type: String,
    required: true
  },

  // How result will be entered
  resultType: {
    type: String,
    enum: [
      'NUMBER',
      'TEXT',
      'OPTION',
      'BOOLEAN'
    ],
    default: 'NUMBER'
  },

  // Used when resultType = OPTION
  options: [{
    type: String
  }],

  unit: {
    type: String,
    default: null
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  // Normal ranges
  normalRangeMale: {
    type: String,
    default: null
  },

  normalRangeFemale: {
    type: String,
    default: null
  },

  normalRangeChild: {
    type: String,
    default: null
  },

  referenceIntervals: [{
    label: String,
    range: String
  }],

  isRequired: {
    type: Boolean,
    default: true
  }

},{
  timestamps:true
})

module.exports = mongoose.model(
  'LabTestParameter',
  labTestParameterSchema
)