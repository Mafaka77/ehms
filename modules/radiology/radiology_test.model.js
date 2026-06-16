const mongoose = require('mongoose')

const radiologyTestSchema =
new mongoose.Schema({

  radiologyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Radiology',
    required: true
  },

  code: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  preparation: {
    type: String,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps:true
})

module.exports =
mongoose.model(
  'RadiologyTest',
  radiologyTestSchema
)