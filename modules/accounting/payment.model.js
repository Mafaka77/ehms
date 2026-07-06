const mongoose = require('mongoose')

const paymentSchema =
new mongoose.Schema({

  paymentNo: {
    type: String,
    required: true,
    unique: true
  },

  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  paymentMode: {
    type: String,
    enum: [
      'CASH',
      'UPI',
      'CARD',
      'BANK_TRANSFER',
      'CHEQUE',
      'INSURANCE',
      'ADVANCE_DEPOSIT'
    ],
    required: true
  },

  transactionNo: {
    type: String,
    default: null
  },

  remarks: {
    type: String,
    default: null
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: [
      'SUCCESS',
      'REFUNDED',
      'CANCELLED'
    ],
    default: 'SUCCESS'
  }

},{
  timestamps:true
})

module.exports =
mongoose.model(
  'Payment',
  paymentSchema
)