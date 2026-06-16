const mongoose = require('mongoose')

const medicineBatchSchema =
new mongoose.Schema({

  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
    index: true
  },

  batchNo: {
    type: String,
    required: true
  },

  expiryDate: {
    type: Date,
    required: true
  },

  purchaseRate: {
    type: Number,
    default: 0
  },

  saleRate: {
    type: Number,
    required: true
  },

  currentStock: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps: true
})

module.exports =
mongoose.model(
  'MedicineBatch',
  medicineBatchSchema
)