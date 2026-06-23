const mongoose = require('mongoose');
const Counter = require('../common/counter.model');
    
const dentalAppointmentSchema = new mongoose.Schema({
    appointmentId: {
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
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Booked', 'Cancelled'],
        default: 'Draft'
    },
    consultationFee: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    treatmentStatus: {
        type: String,
        enum: ['ONGOING', 'COMPLETED', 'CANCELLED'],
        default: 'ONGOING'
    }
}, {
    timestamps: true
});

dentalAppointmentSchema.pre('validate', async function() {
    if (!this.appointmentId) {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const prefix = `EH-DENT-${dd}${yy}`;

        const counter = await Counter.findByIdAndUpdate(
            { _id: prefix },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const sequenceStr = String(counter.seq).padStart(4, '0');
        this.appointmentId = `${prefix}-${sequenceStr}`;
    }
});

module.exports = mongoose.model('DentalAppointment', dentalAppointmentSchema);
