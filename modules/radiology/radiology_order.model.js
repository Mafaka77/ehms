const mongoose = require('mongoose')
const Counter = require('../common/counter.model')
const softDeletePlugin = require('../common/softDelete.plugin')

const radiologyOrderSchema =
new mongoose.Schema({

  orderNo: {
    type: String,
    required: true,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  // Source

  opdAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpdAppointment',
    default: null
  },

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

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  referral: {
    type: String,
    enum: [
      'Self',
      'Doctor',
      'Other',
      'IPD'
    ],
    default: 'Doctor'
  },

  orderDate: {
    type: Date,
    default: Date.now
  },

  priority: {
    type: String,
    enum: [
      'ROUTINE',
      'URGENT',
      'STAT'
    ],
    default: 'ROUTINE'
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    default: null
  },

  paymentStatus: {
    type: String,
    enum: [
      'UNPAID',
      'PARTIAL',
      'PAID',
      'CREDIT',
      'CASHLESS',
      'CANCELLED',
      'IPD'
    ],
    default: 'UNPAID'
  },

  status: {
    type: String,
    enum: [
      'ORDERED',
      'SCHEDULED',
      'IN_PROGRESS',
      'PARTIALLY_COMPLETED',
      'COMPLETED',
      'VERIFIED',
      'CANCELLED',
      'IPD'
    ],
    default: 'ORDERED'
  },

  clinicalNotes: {
    type: String,
    default: null
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
  timestamps: true
})

radiologyOrderSchema.pre(
  'validate',
  async function() {

    if (!this.orderNo) {

      const d = new Date()

      const yy =
        String(
          d.getFullYear()
        ).slice(-2)

      const mm =
        String(
          d.getMonth() + 1
        ).padStart(2,'0')

      const dd =
        String(
          d.getDate()
        ).padStart(2,'0')

      const prefix =
        `EH-RAD-${yy}${mm}${dd}`

      const counter =
        await Counter.findByIdAndUpdate(
          { _id: prefix },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        )

      const seq =
        String(counter.seq)
        .padStart(4,'0')

      this.orderNo =
        `${prefix}-${seq}`
    }

  }
)

radiologyOrderSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'RadiologyOrder',
  radiologyOrderSchema
)