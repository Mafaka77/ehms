const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const medicineIpdOrderItemSchema =
new mongoose.Schema({

  medicineIpdOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineIpdOrder',
    required: true
  },

  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  issuedQuantity: {
    type: Number,
    default: 0
  },

  returnedQuantity: {
    type: Number,
    default: 0
  },

  rate: {
    type: Number,
    default: 0
  },

  amount: {
    type: Number,
    default: 0
  },

  remarks: {
    type: String,
    default: null
  }

},{
  timestamps:true
})

medicineIpdOrderItemSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'MedicineIpdOrderItemSchema',
  medicineIpdOrderItemSchema
)