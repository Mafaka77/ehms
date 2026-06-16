const mongoose = require('mongoose')
const Counter = require('../common/counter.model')
const softDeletePlugin = require('../common/softDelete.plugin')

const pharmacySaleSchema =
new mongoose.Schema({

  saleNo: {
    type: String,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },

  customerName: {
    type: String,
    default: null
  },

  customerPhone: {
    type: String,
    default: null
  },

  opdVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OpdVisit',
    default: null
  },

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  remarks: {
    type: String,
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

},{
  timestamps: true
})

pharmacySaleSchema.pre('validate', async function() {

  if (!this.saleNo) {

    const prefix = 'EH-PHARM'

    const counter =
      await Counter.findByIdAndUpdate(
        { _id: prefix },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )

    this.saleNo =
      `${prefix}-${String(counter.seq).padStart(5,'0')}`
  }

})

pharmacySaleSchema.plugin(softDeletePlugin)

module.exports =
mongoose.model(
  'PharmacySale',
  pharmacySaleSchema
)