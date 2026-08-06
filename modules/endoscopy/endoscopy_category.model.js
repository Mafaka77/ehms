const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const endoscopyCategorySchema =
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

  displayOrder: {
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

endoscopyCategorySchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'EndoscopyCategory',
  endoscopyCategorySchema
)