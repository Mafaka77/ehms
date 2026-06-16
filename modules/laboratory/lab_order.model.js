const mongoose = require('mongoose')
const Counter = require('../common/counter.model')
const softDeletePlugin = require('../common/softDelete.plugin')

const labOrderSchema =
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
    required: false
  },

  referral: {
    type: String,
    enum: ['Self', 'Doctor', 'Other', 'IPD'],
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

  status: {
    type: String,
    enum: [
      'ORDERED',
      'PARTIALLY_COLLECTED',
      'COLLECTED',
      'PROCESSING',
      'PARTIALLY_COMPLETED',
      'COMPLETED',
      'VERIFIED',
      'CANCELLED'
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

},{
  timestamps: true
})

labOrderSchema.pre('validate', async function() {
  if (!this.orderNo) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // YY
    const prefix = `EH-LAB-${day}${year}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const sequenceStr = String(counter.seq).padStart(4, '0');
    this.orderNo = `${prefix}-${sequenceStr}`;
  }
});

labOrderSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'LabOrder',
  labOrderSchema
)