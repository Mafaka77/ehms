const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const pharmacySaleItemSchema =
new mongoose.Schema({

  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacySale',
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
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  amount: {
    type: Number,
    required: true
  }

},{
  timestamps: true
})

pharmacySaleItemSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'PharmacySaleItem',
  pharmacySaleItemSchema
)