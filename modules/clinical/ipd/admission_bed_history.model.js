const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const admissionBedHistorySchema =
new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    index: true
  },

  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true
  },



  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },

  fromDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  toDate: {
    type: Date,
    default: null
  },

  dailyRate: {
    type: Number,
    required: true
  },

  totalDays: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  transferReason: {
    type: String,
    default: null
  },

  isCurrent: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

},{
  timestamps: true
})

admissionBedHistorySchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'AdmissionBedHistory',
  admissionBedHistorySchema
)