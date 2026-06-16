const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const radiologyOrderItemSchema =
new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyOrder',
    required: true
  },

  radiologyTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyTest',
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

},{
  timestamps: true
})

radiologyOrderItemSchema.plugin(softDeletePlugin)

module.exports = mongoose.model(
  'RadiologyOrderItem',
  radiologyOrderItemSchema
)