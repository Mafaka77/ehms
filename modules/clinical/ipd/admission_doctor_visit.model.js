const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const doctorVisitSchema =
new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    index: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },

  chargeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeMaster',
    default: null
  },

  visitType: {
    type: String,
    enum: [
      'CONSULTANT',
      'SPECIALIST',
      'EMERGENCY',
      'FOLLOWUP',
      'NIGHT'
    ],
    default: 'CONSULTANT'
  },

  visitDate: {
    type: Date,
    default: Date.now
  },

  notes: {
    type: String,
    default: null
  },

  rate: {
    type: Number,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  isBilled: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

},{
  timestamps:true
})

doctorVisitSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'DoctorVisit',
  doctorVisitSchema
)