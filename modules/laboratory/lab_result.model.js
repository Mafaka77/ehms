const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const labResultSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    required: true,
    index: true
  },

  orderItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrderItem',
    required: true,
    index: true
  },

  parameterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTestParameter',
    required: true
  },

  measuredValue: {
    type: String,
    required: true
  },

  isOutOfRange: {
    type: Boolean,
    default: false
  },

  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  enteredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

labResultSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('LabResult', labResultSchema)
