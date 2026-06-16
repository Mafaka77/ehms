const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const admissionDoctorSchema =
new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    index: true
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },

  assignmentType: {
    type: String,
    enum: [
      'PRIMARY_CONSULTANT',
      'CONSULTANT',
      'REFERRING_DOCTOR',
      'SURGEON',
      'ASSISTANT_SURGEON',
      'ANESTHETIST',
      'VISITING_DOCTOR'
    ],
    default: 'CONSULTANT'
  },

  fromDate: {
    type: Date,
    default: Date.now
  },

  toDate: {
    type: Date,
    default: null
  },

  consultationFee: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  remarks: {
    type: String,
    default: null
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

},{
  timestamps: true
})

admissionDoctorSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'AdmissionDoctor',
  admissionDoctorSchema
)