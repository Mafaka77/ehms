const mongoose = require('mongoose')

const chargePackageItemSchema = new mongoose.Schema({
  chargeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeMaster',
    required: true
  },

  itemName: {
    type: String,
    required: true
  },

  categoryCode: {
    type: String
  },

  defaultAmount: {
    type: Number,
    required: true
  },

  isMandatory: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ChargePackageItem', chargePackageItemSchema);