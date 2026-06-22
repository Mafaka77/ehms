const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({

  patientCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  fullName: String,

  gender: {
    type: String,
    enum: [
      'Male',
      'Female',
      'Other'
    ]
  },

  dateOfBirth: Date,

  age: Number,

  bloodGroup: {
    type: String,
    enum: [
      'A+',
      'A-',
      'B+',
      'B-',
      'AB+',
      'AB-',
      'O+',
      'O-'
    ]
  },

  mobileNo: {
    type: String,
    required: true
  },

  alternateMobileNo: String,

  email: String,
  address: String,
  allergies: [{
    type: String
  }],

  remarks: String,

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
})

patientSchema.pre('validate', async function() {
  if (!this.patientCode) {
    const lastPatient = await mongoose.model('Patient').findOne(
      { patientCode: { $regex: /^EH-PT-\d{6}$/ } }
    ).sort({ patientCode: -1 });

    let nextNumber = 1;
    if (lastPatient && lastPatient.patientCode) {
      // e.g. EH-PT-000001 -> Extract the last 6 digits
      const lastNumStr = lastPatient.patientCode.slice(-6);
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(6, '0');
    this.patientCode = `EH-PT-${paddedNumber}`;
  }
})

module.exports =
mongoose.model(
  'Patient',
  patientSchema
)
