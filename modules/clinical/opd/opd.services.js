const mongoose = require('mongoose');
const OpdAppointment = require('./opd_appointment.model');
const Doctor = require('../../hr/doctor.model');
const DoctorRemunerationRule = require('../../hr/doctor_renumeration_rule.model');
const STATUS_CODES = require('../../../utils/statuscode');

exports.getOpdDoctors = async () => {
    try {
        const rules = await DoctorRemunerationRule.find({
            serviceType: 'OPD',
            isActive: true
        }).populate({
            path: 'doctorId',
            populate: {
                path: 'specializationId',
                select: 'name'
            }
        });

        // Format to return just the doctor info + the fee
        const opdDoctors = rules
            .filter(rule => rule.doctorId && rule.doctorId.isActive) // Ensure doctor is active
            .map(rule => ({
                _id: rule.doctorId._id,
                fullName: rule.doctorId.fullName,
                specializationId: rule.doctorId.specializationId,
                opdFee: rule.amount
            }));

        return opdDoctors;
    } catch (error) {
        throw error;
    }
}

exports.getAppointments = async (query) => {
    try {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (query.status) {
            filter.status = query.status;
        }
        if (query.doctorId) {
            filter.doctorId = query.doctorId;
        }
        if (query.paymentStatus) {
            filter.paymentStatus = query.paymentStatus;
        }
        if (query.search) {
            let searchStr = query.search;
            if (!searchStr.toUpperCase().startsWith('EH-OPD-')) {
                searchStr = 'EH-OPD-' + searchStr;
            }
            filter.appointmentId = { $regex: searchStr, $options: 'i' };
        }
        if (query.date) {
            // Match any time on that specific date
            const startOfDay = new Date(query.date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(query.date);
            endOfDay.setUTCHours(23, 59, 59, 999);
            filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const appointments = await OpdAppointment.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo gender age dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName qualification',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ appointmentDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await OpdAppointment.countDocuments(filter);

        // Fetch corresponding Bill records for these appointments
        const Bill = mongoose.model('Bill');
        const appointmentIds = appointments.map(a => a._id);
        const bills = await Bill.find({ opdAppointmentId: { $in: appointmentIds } });

        const appointmentsObj = appointments.map(appt => {
            const apptObj = appt.toObject();
            const bill = bills.find(b => b.opdAppointmentId && b.opdAppointmentId.toString() === appt._id.toString());
            apptObj.billId = bill ? bill._id : null;
            apptObj.bill = bill || null;
            return apptObj;
        });

        return {
            appointments: appointmentsObj,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw error;
    }
}

exports.createAppointment = async (data) => {
    try {
        let consultationFee = data.consultationFee;

        // If no explicit fee passed, try to fetch from Doctor profile
        if (consultationFee === undefined && data.doctorId) {
            const doctor = await Doctor.findById(data.doctorId);
            if (doctor) {
                consultationFee = doctor.consultationFee || 0;
            }
        }

        const appointmentData = {
            patientId: data.patientId,
            doctorId: data.doctorId,
            appointmentDate: data.appointmentDate,
            consultationFee: consultationFee,
            notes: data.notes,
            paymentStatus: data.paymentStatus
        };

        const appointment = await OpdAppointment.create(appointmentData);
        
        // Populate patient and doctor details so the frontend has them immediately for the OPD Card
        const populatedAppointment = await OpdAppointment.findById(appointment._id)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName qualification',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            });

        return populatedAppointment;
    } catch (error) {
        throw error;
    }
}

exports.deleteAppointment = async (id) => {
    try {
        const appointment = await OpdAppointment.findByIdAndDelete(id);
        if (!appointment) {
            const error = new Error('Appointment not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        return appointment;
    } catch (error) {
        throw error;
    }
}

exports.getAppointmentById = async (id) => {
    try {
        const appointment = await OpdAppointment.findById(id)
            .populate('patientId', 'fullName patientCode mobileNo gender age dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName qualification',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            });
        if (!appointment) {
            const error = new Error('Appointment not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const Bill = mongoose.model('Bill');
        const bill = await Bill.findOne({ opdAppointmentId: appointment._id });

        const apptObj = appointment.toObject();
        apptObj.billId = bill ? bill._id : null;
        apptObj.bill = bill || null;

        return apptObj;
    } catch (error) {
        throw error;
    }
}

exports.getAppointmentsReport = async (query) => {
    try {
        const filter = {};
        
        // Date range filter
        if (query.startDate || query.endDate) {
            filter.appointmentDate = {};
            if (query.startDate) {
                const start = new Date(query.startDate);
                start.setUTCHours(0, 0, 0, 0);
                filter.appointmentDate.$gte = start;
            }
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setUTCHours(23, 59, 59, 999);
                filter.appointmentDate.$lte = end;
            }
        }
        
        if (query.doctorId) {
            filter.doctorId = query.doctorId;
        }

        // Fetch appointments
        const appointments = await OpdAppointment.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName qualification',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ appointmentDate: 1 });

        const Bill = mongoose.model('Bill');
        const BillItem = mongoose.model('BillItem');
        const Payment = mongoose.model('Payment');

        const reportData = [];

        for (const appt of appointments) {
            // Find bill
            const bill = await Bill.findOne({ opdAppointmentId: appt._id });
            let billItems = [];
            let payments = [];

            if (bill) {
                billItems = await BillItem.find({ billId: bill._id });
                payments = await Payment.find({ billId: bill._id }).populate('receivedBy', 'fullName');
            }

            reportData.push({
                appointment: appt,
                bill: bill,
                billItems: billItems,
                payments: payments
            });
        }

        return reportData;
    } catch (error) {
        throw error;
    }
}