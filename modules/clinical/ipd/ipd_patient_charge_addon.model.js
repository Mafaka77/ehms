const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const patientChargeAddonSchema = new mongoose.Schema({
  patientChargeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdPatientCharge',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  packageItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargePackageItem',
    default: null
  },
  chargeCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeCategory',
    required: true
  },
  chargeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargeMaster',
    default: null
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

patientChargeAddonSchema.index({ patientChargeId: 1 })
patientChargeAddonSchema.index({ doctorId: 1 })

patientChargeAddonSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('IpdPatientChargeAddon', patientChargeAddonSchema)

