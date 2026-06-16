const mongoose = require('mongoose');
const Counter = require('../../common/counter.model');

const opdAppointmentSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

opdAppointmentSchema.pre('validate', async function() {
    if (!this.appointmentId) {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const prefix = `EH-OPD-${dd}${yy}`;

        const counter = await Counter.findByIdAndUpdate(
            { _id: prefix },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const sequenceStr = String(counter.seq).padStart(4, '0');
        this.appointmentId = `${prefix}-${sequenceStr}`;
    }
});

module.exports = mongoose.model('OpdAppointment', opdAppointmentSchema);
