const mongoose = require('mongoose')

const wardSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  wardType: {
    type: String,
    enum: [
  'GENERAL',
  'CABIN',
  'HDU',
  'SUPER DELUXE',
  'ICU',
  'NICU',
  'PICU',
  'CCU',
  'EMERGENCY',
  'DELUXE',
  'OPERATION THEATER',
  'MINOR THEATER',
  'SPECIAL WARD',
  'AYUSH',
  'DIALYSIS',
  'CARDIAC WARD',
  'PALLIATIVE CARE WARD',
  'AYURVEDIC WARD',
  'ISOLATION WARD',
  'OPD',
  'PHYSIOTHERAPY',
    ],
    required: true
  },
  floor: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Ward', wardSchema)