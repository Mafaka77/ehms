const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const billItemSchema = new mongoose.Schema({

  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true,
    index: true
  },

  patientChargeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientCharge',
    default: null
  },

  itemType: {
    type: String,
    enum: [
      'CONSULTATION',
      'ROOM',
      'LAB',
      'RADIOLOGY',
      'INVESTIGATION',
      'ENDOSCOPY',
      'CARDIAC',
      'NEURO',
      'PHARMACY',
      'PROCEDURE',
      'SURGERY',
      'OT',
      'ANESTHESIA',
      'DOCTOR_VISIT',
      'NURSING',
      'CONSUMABLE',
      'AMBULANCE',
      'BLOOD_BANK',
      'PACKAGE',
      'OTHER'
    ],
    required: true
  },

  sourceModule: {
    type: String,
    enum: [
      'LAB',
      'RADIOLOGY',
      'ENDOSCOPY',
      'PHARMACY',
      'ROOM',
      'PROCEDURE',
      'SURGERY_PACKAGE',
      'DOCTOR_VISIT',
      'CONSULTATION',
      'OTHER'
    ],
    default: 'OTHER',
    required: true
  },

  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  description: {
    type: String,
    required: true
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

  discountAmount: {
    type: Number,
    default: 0
  },

  netAmount: {
    type: Number,
    required: true
  }

}, {
  timestamps: true
})

billItemSchema.plugin(softDeletePlugin)

module.exports = mongoose.model(
  'BillItem',
  billItemSchema
)