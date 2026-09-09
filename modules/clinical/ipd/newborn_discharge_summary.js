const mongoose = require('mongoose');
const softDeletePlugin = require('../../common/softDelete.plugin');

const newbornDischargeSummarySchema = new mongoose.Schema({
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

  // ── 1. Birth & Delivery Details ──
  deliveryType: {
    type: String,
    enum: ['NVD', 'LSCS'],
    default: null
  },

  deliveryDateTime: {
    type: Date,
    default: null
  },

  babyStatusAtBirth: {
    type: String,
    enum: ['LIVE', 'STILLBORN'],
    default: 'LIVE'
  },

  sex: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    default: null
  },

  birthWeightKg: {
    type: Number,
    default: null
  },

  babyCried: {
    type: String,
    enum: ['CRIED_IMMEDIATELY', 'DID_NOT_CRY'],
    default: null
  },

  apgar1Min: {
    type: Number,
    default: null
  },

  apgar5Min: {
    type: Number,
    default: null
  },

  dcc: {
    type: String,
    enum: ['DONE', 'NOT_DONE'],
    default: null
  },

  resuscitationRequired: {
    type: Boolean,
    default: false
  },

  resuscitationDetails: {
    type: String,
    default: null
  },

  congenitalAnomalyPresent: {
    type: Boolean,
    default: false
  },

  congenitalAnomalyDetails: {
    type: String,
    default: null
  },

  liquorStatus: {
    type: String,
    enum: ['CLEAR', 'MECONIUM_STAINED'],
    default: null
  },

  birthDoseVaccines: {
    hepB: {
      given: {
        type: Boolean,
        default: false
      },
      date: {
        type: Date,
        default: null
      }
    },
    bcg: {
      given: {
        type: Boolean,
        default: false
      },
      date: {
        type: Date,
        default: null
      }
    },
    opv: {
      given: {
        type: Boolean,
        default: false
      },
      date: {
        type: Date,
        default: null
      }
    }
  },

  // ── 2. Fever & Sepsis ──
  developedFever: {
    type: Boolean,
    default: false
  },

  feverDate: {
    type: Date,
    default: null
  },

  sepsisScreen: {
    type: String,
    enum: ['NEGATIVE', 'POSITIVE', 'NOT_DONE'],
    default: null
  },

  antibiotics: {
    given: {
      type: Boolean,
      default: false
    },
    route: {
      type: String,
      enum: ['ORAL', 'IV'],
      default: null
    },
    days: {
      type: Number,
      default: null
    },
    details: {
      type: String,
      default: null
    }
  },

  // ── 3. Icterus (Jaundice) ──
  developedIcterus: {
    type: Boolean,
    default: false
  },

  icterusTcbTsb: {
    type: String,
    default: null
  },

  phototherapy: {
    given: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: null
    }
  },

  exchangeTransfusion: {
    given: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: null
    }
  },

  // ── 4. Feeding & Hydration ──
  feedingProblem: {
    type: Boolean,
    default: false
  },

  feedingProblemDueTo: {
    type: String,
    default: null
  },

  dehydration: {
    type: Boolean,
    default: false
  },

  dehydrationCorrectedWith: {
    type: String,
    default: null
  },

  feedingType: {
    type: String,
    enum: ['EXCLUSIVE_BREASTFEEDING', 'MIX_FEEDING'],
    default: 'EXCLUSIVE_BREASTFEEDING'
  },

  // ── 5. Other Significant Events ──
  otherSignificantEvents: {
    type: String,
    default: null
  },

  // ── 6. Discharge Status & Condition ──
  dischargeType: {
    type: String,
    enum: [
      'WITH_MEDICAL_ADVICE',
      'ON_REQUEST',
      'NORMAL',
      'LAMA',
      'DAMA',
      'REFERRED',
      'EXPIRED'
    ],
    default: 'WITH_MEDICAL_ADVICE'
  },

  conditionAtDischarge: {
    isActive: {
      type: Boolean,
      default: true
    },
    feedsWell: {
      type: Boolean,
      default: true
    },
    noFever: {
      type: Boolean,
      default: true
    },
    icterus: {
      type: String,
      default: null
    },
    tcbTsbValue: {
      type: String,
      default: null
    },
    weightKg: {
      type: Number,
      default: null
    },
    lengthCm: {
      type: Number,
      default: null
    },
    headCircumferenceCm: {
      type: Number,
      default: null
    }
  },

  // ── 7. Advice ──
  advice: [
    {
      type: String
    }
  ],

  // ── 8. Follow-up / Review ──
  followUp: {
    reviewDate: {
      type: Date,
      default: null
    },
    reviewTime: {
      type: String,
      default: null
    },
    reviewLocation: {
      type: String,
      default: 'Paediatric OPD or SOS'
    }
  },

  remarks: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ['DRAFT', 'FINAL'],
    default: 'DRAFT'
  }
}, {
  timestamps: true
});

newbornDischargeSummarySchema.plugin(softDeletePlugin);

module.exports = mongoose.model(
  'NewbornDischargeSummary',
  newbornDischargeSummarySchema
);