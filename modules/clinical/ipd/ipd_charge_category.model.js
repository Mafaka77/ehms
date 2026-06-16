const mongoose = require('mongoose')

const chargeCategorySchema =
new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: null
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
  'ChargeCategory',
  chargeCategorySchema
)