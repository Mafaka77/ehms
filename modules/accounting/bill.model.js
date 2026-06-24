const mongoose = require('mongoose')
const Counter = require('../common/counter.model')
const softDeletePlugin = require('../common/softDelete.plugin')

const billSchema = new mongoose.Schema({

  billNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },

  opdAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpdAppointment',
    default: null
  },

  dentalAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalAppointment',
    default: null
  },

  emergencyVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyVisit',
    default: null
  },

  labOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    default: null
  },

  radiologyOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyOrder',
    default: null
  },

  billType: {
    type: String,
    enum: [
      'OPD',
      'IPD',
      'LAB',
      'RADIOLOGY',
      'DENTAL',
      'DENTAL_CONSULTATION',
      'ADVANCE',
      'EMERGENCY',
      'EMERGENCY_CONSULTATION',
      'PHARMACY',
      'PACKAGE',
      'REFUND'
    ],
    required: true
  },

  grossAmount: {
    type: Number,
    default: 0
  },

  discountAmount: {
    type: Number,
    default: 0
  },

  netAmount: {
    type: Number,
    default: 0
  },

  paidAmount: {
    type: Number,
    default: 0
  },

  balanceAmount: {
    type: Number,
    default: 0
  },

  insuranceAmount: {
    type: Number,
    default: 0
  },

  patientPayableAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      'DRAFT',
      'PARTIALLY_PAID',
      'PAID',
      'CANCELLED',
      'REFUNDED'
    ],
    default: 'DRAFT'
  },

  insuranceType: {
    type: String,
    enum: [
      'NONE',
      'CASHLESS',
      'REIMBURSEMENT'
    ],
    default: 'NONE'
  },

  remarks: {
    type: String,
    default: null
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  generatedAt: {
    type: Date,
    default: Date.now
  }

},{
  timestamps: true
})

billSchema.pre('validate', async function() {
  if (!this.billNo) {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const prefix = `EH-BILL-${yy}${mm}${dd}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const sequenceStr = String(counter.seq).padStart(4, '0');
    this.billNo = `${prefix}-${sequenceStr}`;
  }
});

billSchema.plugin(softDeletePlugin)

module.exports = mongoose.model(
  'Bill',
  billSchema
)