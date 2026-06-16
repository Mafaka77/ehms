const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const admissionNoteSchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    index: true
  },
  noteType: {
    type: String,
    enum: ['PROGRESS_NOTE', 'CLINICAL_NOTE', 'DISCHARGE_SUMMARY', 'OTHER'],
    default: 'CLINICAL_NOTE'
  },
  note: {
    type: String,
    required: true
  },
  attachments: [{
    fileName: String,
    fileSize: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

admissionNoteSchema.plugin(softDeletePlugin)

module.exports = mongoose.model('AdmissionNote', admissionNoteSchema)
