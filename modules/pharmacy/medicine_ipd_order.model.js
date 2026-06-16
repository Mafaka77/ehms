const mongoose = require('mongoose')
const Counter = require('../common/counter.model')
const softDeletePlugin = require('../common/softDelete.plugin')

const medicineIpdOrderSchema =
new mongoose.Schema({

  requestNo: {
    type: String,
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

  nursingStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NursingStation',
    required: true
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  priority: {
    type: String,
    enum: [
      'NORMAL',
      'URGENT',
      'CRITICAL',
      'STAT'
    ],
    default: 'NORMAL'
  },

  status: {
    type: String,
    enum: [
      'PENDING',
      'APPROVED',
      'PARTIALLY_ISSUED',
      'ISSUED',
      'CANCELLED'
    ],
    default: 'PENDING'
  },

  remarks: {
    type: String,
    default: null
  }

},{
  timestamps:true
})

medicineIpdOrderSchema.pre('validate', async function() {
  if (!this.requestNo) {
    const prefix = 'RX-IPD'
    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.requestNo = `${prefix}-${String(counter.seq).padStart(5, '0')}`
  }
})

medicineIpdOrderSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'MedicineIpdOrder',
  medicineIpdOrderSchema
)