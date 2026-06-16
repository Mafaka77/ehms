const mongoose = require('mongoose')

const medicineSchema =
new mongoose.Schema({

  medicineCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  medicineName: {
    type: String,
    required: true,
    trim: true
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineCategory',
    required: true
  },

  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },

  genericName: {
    type: String,
    default: null
  },

  brandName: {
    type: String,
    default: null
  },

  dosageForm: {
    type: String,
    enum: [
      'TABLET',
      'CAPSULE',
      'SYRUP',
      'INJECTION',
      'DROPS',
      'CREAM',
      'OINTMENT',
      'POWDER',
      'INHALER',
      'OTHER'
    ],
    default: 'TABLET'
  },

  strength: {
    type: String,
    default: null
  },

  unit: {
    type: String,
    enum: [
      'TAB',
      'CAP',
      'BOTTLE',
      'VIAL',
      'AMP',
      'TUBE',
      'PACK',
      'PCS'
    ],
    default: 'TAB'
  },

  reorderLevel: {
    type: Number,
    default: 10
  },

  manufacturer: {
    type: String,
    default: null
  },

  remarks: {
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
  'Medicine',
  medicineSchema
)