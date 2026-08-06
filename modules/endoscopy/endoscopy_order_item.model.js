const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const endoscopyOrderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EndoscopyOrder',
    required: true
  },

  endoscopyTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EndoscopyTest',
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      'ORDERED',
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'REPORTED',
      'VERIFIED',
      'CANCELLED'
    ],
    default: 'ORDERED'
  },

  findings: {
    type: String,
    default: null
  },

  impression: {
    type: String,
    default: null
  },

  recommendation: {
    type: String,
    default: null
  },

  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },

  performedAt: {
    type: Date,
    default: null
  },

  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  reportedAt: {
    type: Date,
    default: null
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  verifiedAt: {
    type: Date,
    default: null
  },

  attachments: [{
    fileName: String,
    fileUrl: String
  }],

  remarks: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

endoscopyOrderItemSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('EndoscopyOrderItem', endoscopyOrderItemSchema)
