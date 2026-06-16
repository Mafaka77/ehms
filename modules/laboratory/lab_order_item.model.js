const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const labOrderItemSchema =
new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    required: true,
    index: true
  },

  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true
  },

  // Billing Snapshot

  testName: {
    type: String,
    required: true
  },

  rate: {
    type: Number,
    required: true,
    default: 0
  },

  quantity: {
    type: Number,
    default: 1
  },

  amount: {
    type: Number,
    required: true
  },

  // Sample

  sampleNumber: {
    type: String,
    default: null
  },

  sampleCollectedAt: {
    type: Date,
    default: null
  },

  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },

  // Processing

  processedAt: {
    type: Date,
    default: null
  },

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },

  // Verification

  verifiedAt: {
    type: Date,
    default: null
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  // Status

  status: {
    type: String,
    enum: [
      'ORDERED',
      'COLLECTED',
      'PROCESSING',
      'COMPLETED',
      'VERIFIED',
      'CANCELLED'
    ],
    default: 'ORDERED'
  },

  remarks: {
    type: String,
    default: null
  }

}, {
  timestamps: true
})

labOrderItemSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'LabOrderItem',
  labOrderItemSchema
)