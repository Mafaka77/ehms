const mongoose = require('mongoose')

const surgerySchema =
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
    unique: true,
    trim: true
  },

  specializationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization',
    required: true
  },

  category: {
    type: String,
    enum: [
      'MINOR',
      'MAJOR'
    ],
    default: 'MAJOR'
  },

  standardCharge: {
    type: Number,
    default: 0
  },

  estimatedDurationMinutes: {
    type: Number,
    default: 60
  },

  description: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
})

module.exports =
mongoose.model(
  'Surgery',
  surgerySchema
)