const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const ipdPatientFileSchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  savedFileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

ipdPatientFileSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('IpdPatientFile', ipdPatientFileSchema)
