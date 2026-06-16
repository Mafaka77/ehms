const mongoose = require('mongoose')

const medicineCategorySchema =
new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true
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
  'MedicineCategory',
  medicineCategorySchema
)