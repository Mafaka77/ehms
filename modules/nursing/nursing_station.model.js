const mongoose = require('mongoose')
const Counter = require('../common/counter.model')

const nursingStationSchema =
new mongoose.Schema({

  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    default: null
  },

  inchargeNurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  location: {
    type: String,
    default: null
  },

  contactNo: {
    type: String,
    default: null
  },

  description: {
    type: String,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

nursingStationSchema.virtual('assignedBeds', {
  ref: 'Bed',
  localField: '_id',
  foreignField: 'nursingStationId'
})

nursingStationSchema.pre('save', async function () {
  if (!this.code) {
    const counter = await Counter.findByIdAndUpdate(
      'nursingStationCode',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.code = `NS-${String(counter.seq).padStart(3, '0')}`
  }
})

module.exports =
mongoose.model(
  'NursingStation',
  nursingStationSchema
)