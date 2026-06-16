
const mongoose=require('mongoose')
const doctorRemunerationRuleSchema =
new mongoose.Schema({

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },

  serviceType: {
    type: String,
    enum: [
      'OPD',
      'SURGERY',
      'PROCEDURE',
      'EMERGENCY',
      'IPD_ROUND'
    ],
    required: true
  },

  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  amount: {
    type: Number,
    required: true
  },

  effectiveFrom: Date,

  effectiveTo: Date,

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
})

const DoctorRemunerationRule=mongoose.model("DoctorRemunerationRule",doctorRemunerationRuleSchema)

module.exports = DoctorRemunerationRule;
