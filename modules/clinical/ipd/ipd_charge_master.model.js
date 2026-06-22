const mongoose = require('mongoose')

const chargeMasterSchema =
new mongoose.Schema({

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeCategory',
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

  description: {
    type: String,
    default: null
  },

  billingUnit: {
    type: String,
    enum: [
      'DAY',
      'HOUR',
      'VISIT',
      'SESSION',
      'UNIT',
      'ITEM',
      'TEST',
      'PROCEDURE'
    ],
    default: 'ITEM'
  },

  standardRate: {
    type: Number,
    required: true,
    min: 0
  },

  minimumRate: {
    type: Number,
    default: null
  },

  maximumRate: {
    type: Number,
    default: null
  },

  isVariableRate: {
    type: Boolean,
    default: false
  },

  requiresApproval: {
    type: Boolean,
    default: false
  },

  isPackage: {
    type: Boolean,
    default: false
  },

  packageDurationType: {
    type: String,
    enum: [
      'DAILY',
      'HOURLY',
      'FIXED'
    ],
    default: null
  },

  applicableTo: {
    type: [String],
    enum: [
      'OPD',
      'IPD',
      'EMERGENCY',
      'DAYCARE',
      'DENTAL'
    ],
    default: ['IPD']
  },

  isActive: {
    type: Boolean,
    default: true
  },

  remarks: {
    type: String,
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

},{
  timestamps: true
})

module.exports =
mongoose.model(
  'ChargeMaster',
  chargeMasterSchema
)