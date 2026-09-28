const mongoose = require('mongoose')
const softDeletePlugin = require('../../common/softDelete.plugin')

const deathSummarySchema = new mongoose.Schema({

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

  certifiedByDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  // Date and Time of Death
  deathDateTime: {
    type: Date,
    required: true
  },

  declaredDateTime: {
    type: Date,
    default: null
  },

  // Admission & Initial Clinical Context
  admissionDate: {
    type: Date,
    default: null
  },

  chiefComplaints: {
    type: String,
    default: null
  },

  vitalsOnAdmission: {
    temperature: {
      type: String,
      default: null
    },
    pulse: {
      type: String,
      default: null
    },
    respiration: {
      type: String,
      default: null
    },
    bp: {
      type: String,
      default: null
    },
    oxygenSaturation: {
      type: String,
      default: null
    }
  },

  clinicalFindings: {
    type: String,
    default: null
  },

  // Hospital Course & Clinical Details
  clinicalCourse: {
    type: String,
    default: null
  },

  investigations: {
    type: String,
    default: null
  },

  treatmentGiven: {
    type: String,
    default: null
  },

  // Cause of Death Details
  causeOfDeath: {
    immediateCause: {
      type: String,
      default: null
    },
    antecedentCause: {
      type: String,
      default: null
    },
    underlyingCause: {
      type: String,
      default: null
    },
    otherSignificantConditions: {
      type: String,
      default: null
    }
  },

  mannerOfDeath: {
    type: String,
    enum: [
      'NATURAL',
      'ACCIDENTAL',
      'SUICIDAL',
      'HOMICIDAL',
      'PENDING_INVESTIGATION',
      'OTHER'
    ],
    default: 'NATURAL'
  },

  // Resuscitation & Final Event Details
  resuscitationDetails: {
    cprGiven: {
      type: Boolean,
      default: false
    },
    cprNotes: {
      type: String,
      default: null
    }
  },

  postMortem: {
    type: String,
    enum: [
      'NOT_REQUIRED',
      'REQUESTED',
      'PERFORMED',
      'REFUSED',
      'MEDICO_LEGAL'
    ],
    default: 'NOT_REQUIRED'
  },

  // Handover Details
  bodyHandedOverTo: {
    name: {
      type: String,
      default: null
    },
    relationship: {
      type: String,
      default: null
    },
    contactNo: {
      type: String,
      default: null
    },
    idProof: {
      type: String,
      default: null
    },
    handedOverAt: {
      type: Date,
      default: null
    }
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

}, {
  timestamps: true
})

deathSummarySchema.plugin(softDeletePlugin)

module.exports = mongoose.model(
  'DeathSummary',
  deathSummarySchema
)
