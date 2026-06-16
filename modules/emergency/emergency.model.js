const mongoose = require('mongoose')
const Counter = require('../common/counter.model')

const emergencyVisitSchema = new mongoose.Schema({

  visitNo: {
    type: String,
    unique: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },

  arrivalDateTime: {
    type: Date,
    default: Date.now
  },

  chiefComplaint: {
    type: String,
    required: false
  },

  priority: {
    type: String,
    enum: [
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL'
    ],
    default: 'MEDIUM'
  },

  notes: String,

  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },

  consultationFee: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  }

},{
  timestamps:true
})

emergencyVisitSchema.pre('validate', async function() {
    if (!this.visitNo) {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const prefix = `EH-ER-${dd}${yy}`;

        const counter = await Counter.findByIdAndUpdate(
            { _id: prefix },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const sequenceStr = String(counter.seq).padStart(4, '0');
        this.visitNo = `${prefix}-${sequenceStr}`;
    }
});

module.exports = mongoose.model('EmergencyVisit', emergencyVisitSchema)