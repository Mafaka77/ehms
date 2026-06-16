const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const patientChargeSchema =
new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  chargeCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeCategory',
    required: true
  },

  description: {
    type: String,
    required: true
  },

  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  quantity: {
    type: Number,
    default: 1
  },

  rate: {
    type: Number,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    default: null
  },

  isBilled: {
    type: Boolean,
    default: false
  }

},{
  timestamps:true
})

patientChargeSchema.plugin(softDeletePlugin)
patientChargeSchema.index({ doctorId: 1 })

module.exports = mongoose.model('IpdPatientCharge', patientChargeSchema)