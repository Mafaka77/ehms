const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const pharmacyIndentItemSchema =
new mongoose.Schema({

  indentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyIndent',
    required: true
  },

  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineBatch',
    default: null
  },

  quantity: {
    type: Number,
    required: true
  },

  issuedQuantity: {
    type: Number,
    default: 0
  },

  remarks: {
    type: String,
    default: null
  }

},{
  timestamps: true
})

pharmacyIndentItemSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'PharmacyIndentItem',
  pharmacyIndentItemSchema
)