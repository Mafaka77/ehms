const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const dischargeSummarySchema =
new mongoose.Schema({

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },

  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },

  dischargeDate: {
    type: Date,
    required: true
  },

  dischargeType: {
    type: String,
    enum: [
      'NORMAL',
      'LAMA',
      'DAMA',
      'REFERRED',
      'EXPIRED'
    ],
    default: 'NORMAL'
  },

  finalDiagnosis: {
    type: String,
    default: null
  },

  chiefComplaints: {
    type: String,
    default: null
  },
  vitalsOnAdmission:{
    temperature:{
      type: String,
      default: null
    },
    pulse:{
      type: String,
      default: null
    },
    respiration:{
      type: String,
      default: null
    },
    bp:{
      type: String,
      default: null
    },
    oxygenSaturation:{
      type: String,
      default: null
    }
  },

  clinicalFindings: {
    type: String,
    default: null
  },

  conditionAtDischarge: {
    type: String,
    default: null
  },
  clinicalCourse:{
    type:String,
    default:null
  },
  dischargeAdvice: {
    type: String,
    default: null
  },


  followUpAdvice: {
    type: String,
    default: null
  },


  remarks: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: [
      'DRAFT',
      'FINAL'
    ],
    default: 'DRAFT'
  }

},{
  timestamps:true
})

dischargeSummarySchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'DischargeSummary',
  dischargeSummarySchema
)