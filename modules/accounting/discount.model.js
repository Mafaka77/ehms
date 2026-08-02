const mongoose = require('mongoose')

const discountSchema = new mongoose.Schema({
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  discountType: {
    type: String,
    enum: ['Free Clinic','Doctor Discount'],
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null,
    index: true
  },
  remarks: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Discount', discountSchema)
