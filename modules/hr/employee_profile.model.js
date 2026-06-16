const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema({
    emergencyContact: String,
    emergencyContactName: String,
    emergencyContactRelationship: String,
    emergencyContactPhone: String,
    currentAddress: String,
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }
}, { timestamps: true })

module.exports = mongoose.model("EmployeeProfile", employeeProfileSchema);