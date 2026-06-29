const mongoose = require('mongoose')
const Counter = require('../../common/counter.model')

const admissionAdvanceSchema = new mongoose.Schema({

  receiptNo: {
    type: String,
    required: true,
    unique: true
  },

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

  amount: {
    type: Number,
    required: true
  },

  paymentMode: {
    type: String,
    enum: [
      'CASH',
      'CARD',
      'UPI',
      'BANK_TRANSFER',
      'CHEQUE'
    ],
    required: true
  },

  referenceNo: String,

  remarks: String,

  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isAdjusted: {
    type: Boolean,
    default: false
  }

},{
  timestamps:true
})

admissionAdvanceSchema.pre('validate', async function() {
  if (!this.receiptNo) {
    const d = new Date()
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const prefix = `EH-ADV-${yy}${mm}${dd}`

    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )

    const sequenceStr = String(counter.seq).padStart(4, '0')
    this.receiptNo = `${prefix}-${sequenceStr}`
  }
})

module.exports = mongoose.model(
  'AdmissionAdvance',
  admissionAdvanceSchema
)