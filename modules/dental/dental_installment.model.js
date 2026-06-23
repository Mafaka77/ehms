const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const dentalInstallmentSchema = new mongoose.Schema({
  dentalPatientChargesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientCharge',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalAppointment',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },
  paidDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'INSURANCE'],
    default: 'CASH'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  status: {
    type: String,
    enum: ['PAID', 'CANCELLED'],
    default: 'PAID'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
})

dentalInstallmentSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('DentalInstallment', dentalInstallmentSchema)
