const mongoose = require('mongoose')
const softDeletePlugin = require('../common/softDelete.plugin')

const endoscopyTestSchema =
new mongoose.Schema({

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EndoscopyCategory',
    required: true,
    index: true
  },

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


  duration: {
    type: Number,
    default: 30
  },

  preparation: {
    type: String,
    default: null
  },

  indications: {
    type: String,
    default: null
  },

  contraindications: {
    type: String,
    default: null
  },

  rate: {
    type: Number,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps:true
})

endoscopyTestSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'EndoscopyTest',
  endoscopyTestSchema
)