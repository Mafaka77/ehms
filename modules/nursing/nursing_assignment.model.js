const mongoose = require('mongoose')

const nursingAssignmentSchema =
new mongoose.Schema({

  nursingStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NursingStation',
    required: true,
    index: true
  },

  // refs User (not Employee) — nurses are identified by their login account
  nurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  assignmentType: {
    type: String,
    enum: [
        'INCHARGE',
      'STAFF_NURSE',
      'SENIOR_NURSE',
      'FLOATING_NURSE'
    ],
    default: 'STAFF_NURSE'
  },

  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  endDate: {
    type: Date,
    default: null
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

// Prevent duplicate active assignments for the same nurse at the same station
nursingAssignmentSchema.index(
  { nursingStationId: 1, nurseId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
)

module.exports =
mongoose.model(
  'NursingAssignment',
  nursingAssignmentSchema
)