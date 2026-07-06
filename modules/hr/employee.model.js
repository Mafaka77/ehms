const mongoose = require('mongoose');
const Counter = require('../common/counter.model');
const employeeSchema = new mongoose.Schema({

  employeeCode: {
    type: String,
    unique: true
  },

  fullName: {
    type: String,
    required: true
  },
  mobile:{
    type: Number,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  designationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation'
  },

  joiningDate: Date,

  employmentType: {
    type: String,
    enum: [
      'Permanent',
      'Contract',
      'Temporary'
    ]
  },
  basicSalary: {
    type: Number,
    required: true
  },
  bankDetails: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String
  },
  address:{
    type:String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePhoto: {
    type: String,
    required: false
  }

}, {
  timestamps: true
})

employeeSchema.pre('save', async function () {
  if (!this.employeeCode) {
    try {
      const currentYear = new Date().getFullYear().toString();
      const counterId = `employeeCode_${currentYear}`;
      
      const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const formattedNum = String(counter.seq).padStart(4, '0');
      this.employeeCode = `EH-EMP-${currentYear}-${formattedNum}`;
    } catch (err) {
      throw err;
    }
  }
})

module.exports=mongoose.model("Employee",employeeSchema);
