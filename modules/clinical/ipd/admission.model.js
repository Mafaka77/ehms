const mongoose = require('mongoose')
const Counter = require('../../common/counter.model')
const softDeletePlugin = require('../../common/softDelete.plugin')

const admissionSchema = new mongoose.Schema({

  admissionNo: {
    type: String,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  admissionType: {
    type: String,
    enum: [
      'NORMAL',
      'EMERGENCY',
      'TRANSFER'
    ],
    default: 'NORMAL'
  },

  consultantDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },

  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },

  diagnosis: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: [
      'ADMITTED',
      'DISCHARGED',
      'CANCELLED'
    ],
    default: 'ADMITTED'
  },

  remarks: {
    type: String,
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

},{
  timestamps:true
})

admissionSchema.pre('validate', async function() {
  if (!this.admissionNo) {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    const prefix = `EH-IPD-${dd}${yy}`

    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )

    const sequenceStr = String(counter.seq).padStart(4, '0')
    this.admissionNo = `${prefix}-${sequenceStr}`
  }
})

admissionSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('Admission', admissionSchema)