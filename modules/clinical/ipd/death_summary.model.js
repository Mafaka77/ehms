const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const deathSummarySchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  deathDateTime: {
    type: Date,
    required: true
  },

  details: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

deathSummarySchema.plugin(softDeletePlugin)

module.exports = mongoose.model(
  'DeathSummary',
  deathSummarySchema
)
