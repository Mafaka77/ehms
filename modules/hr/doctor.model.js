const mongoose=require('mongoose')
const doctorSchema =
new mongoose.Schema({
  doctorCode: {
    type: String,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  gender: String,

  mobileNo: String,

  email: String,

  qualification: String,

  registrationNo: String,

  specializationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  },

  doctorType: {
    type: String,
    enum: [
      'PERMANENT',
      'CONSULTANT',
      'VISITING'
    ],
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
})

doctorSchema.pre('save', async function () {
  if (!this.doctorCode) {
    try {
      const lastDoctor = await mongoose.model('Doctor').findOne(
        { doctorCode: { $regex: /^EH-DOC-\d{4}$/ } }
      ).sort({ doctorCode: -1 })

      let nextNumber = 1
      if (lastDoctor && lastDoctor.doctorCode) {
        const lastNumStr = lastDoctor.doctorCode.substring(7)
        const lastNum = parseInt(lastNumStr, 10)
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1
        }
      }

      const formattedNum = String(nextNumber).padStart(4, '0')
      this.doctorCode = `EH-DOC-${formattedNum}`
    } catch (err) {
      throw err
    }
  }
})

module.exports=mongoose.model('Doctor',doctorSchema)
