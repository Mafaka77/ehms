const mongoose = require('mongoose')
const labCategorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: false,
  },

  name: {
    type: String,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true })

module.exports=mongoose.model('LabCategory',labCategorySchema)
