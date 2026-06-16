const mongoose = require('mongoose')

const bedSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true
  },
  nursingStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NursingStation',
    default: null
  },
  floor: {
    type: String,
    default: null
  },
  bedNo: {
    type: String,
    required: true
  },
  bedType: {
    type: String,
    enum: [
      'GENERAL',
      'ICU',
      'VENTILATOR',
      'DELUXE',
      'SEMI_PRIVATE',
      'PRIVATE'
    ],
    default: 'GENERAL'
  },
  dailyRate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'AVAILABLE',
      'OCCUPIED',
      'MAINTENANCE',
      'RESERVED'
    ],
    default: 'AVAILABLE'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Bed', bedSchema)