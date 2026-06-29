const mongoose = require('mongoose')
const softDeletePlugin = require('./softDelete.plugin')

const patientChargeSchema = new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },

  emergencyVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyVisit',
    default: null
  },

  dentalAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalAppointment',
    default: null
  },

  sourceType: {
    type: String,
    enum: ['IPD', 'EMERGENCY', 'DENTAL', 'OPD', 'DAYCARE', 'RADIOLOGY', 'LAB', 'PHARMACY', 'OTHER'],
    default: 'OTHER'
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

  chargeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeMaster',
    default: null
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
  },

  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partial'],
    default: 'Unpaid'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

},{
  timestamps:true
})

patientChargeSchema.plugin(softDeletePlugin)
patientChargeSchema.index({ doctorId: 1 })
patientChargeSchema.index({ admissionId: 1 })
patientChargeSchema.index({ emergencyVisitId: 1 })
patientChargeSchema.index({ dentalAppointmentId: 1 })

module.exports = mongoose.model('PatientCharge', patientChargeSchema)
