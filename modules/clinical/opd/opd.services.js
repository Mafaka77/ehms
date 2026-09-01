const mongoose = require('mongoose');
const { DateTime } = require('luxon');
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
        const limit = parseInt(query.limit) === 0 ? 0 : (parseInt(query.limit) || 10);
        const skip = (page - 1) * (limit || 1);

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
            const searchRegex = new RegExp(query.search.trim(), 'i');
            const Patient = mongoose.model('Patient');
            const matchingPatients = await Patient.find({
                $or: [
                    { fullName: searchRegex },
                    { patientCode: searchRegex },
                    { mobileNo: searchRegex }
                ]
            }).select('_id');
            const patientIds = matchingPatients.map(p => p._id);

            filter.$or = [
                { appointmentId: searchRegex },
                { patientId: { $in: patientIds } }
            ];
        }
        if (query.date) {
            const startOfDay = new Date(query.date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(query.date);
            endOfDay.setUTCHours(23, 59, 59, 999);
            filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }
        if (query.startDate || query.endDate) {
            filter.appointmentDate = filter.appointmentDate || {};
            if (query.startDate) {
                const sStr = String(query.startDate).trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(sStr)) {
                    const [y, m, d] = sStr.split('-').map(Number);
                    filter.appointmentDate.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
                } else {
                    filter.appointmentDate.$gte = new Date(query.startDate);
                }
            }
            if (query.endDate) {
                const eStr = String(query.endDate).trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
                    const [y, m, d] = eStr.split('-').map(Number);
                    filter.appointmentDate.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
                } else {
                    const end = new Date(query.endDate);
                    end.setHours(23, 59, 59, 999);
                    filter.appointmentDate.$lte = end;
                }
            }
        }

        let queryExec = OpdAppointment.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo gender age dateOfBirth address')
            .populate({
                path: 'doctorId',
                select: 'fullName qualification',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ appointmentDate: -1, createdAt: -1 });

        if (limit > 0) {
            queryExec = queryExec.skip(skip).limit(limit);
        }

        const appointments = await queryExec;
        const total = await OpdAppointment.countDocuments(filter);

        // Fetch corresponding Bill records for these appointments
        const Bill = mongoose.model('Bill');
        const Payment = mongoose.model('Payment');
        const appointmentIds = appointments.map(a => a._id);
        const bills = await Bill.find({ opdAppointmentId: { $in: appointmentIds } }).lean();
        const billIds = bills.map(b => b._id);
        const payments = await Payment.find({ billId: { $in: billIds } }).lean();

        const appointmentsObj = appointments.map(appt => {
            const apptObj = appt.toObject();
            const bill = bills.find(b => b.opdAppointmentId && b.opdAppointmentId.toString() === appt._id.toString());
            if (bill) {
                bill.payments = payments.filter(p => p.billId && p.billId.toString() === bill._id.toString());
                apptObj.billId = bill._id;
                apptObj.bill = bill;
            } else {
                apptObj.billId = null;
                apptObj.bill = null;
            }
            return apptObj;
        });

        return {
            appointments: appointmentsObj,
            pagination: {
                total,
                page,
                limit: limit > 0 ? limit : total,
                pages: limit > 0 ? Math.ceil(total / limit) : 1
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

        let appointmentDateUTC = new Date();
        if (data.appointmentDate) {
            const dt = typeof data.appointmentDate === 'string'
                ? DateTime.fromISO(data.appointmentDate, { zone: 'Asia/Kolkata' })
                : DateTime.fromJSDate(new Date(data.appointmentDate));
            appointmentDateUTC = dt.isValid ? dt.toUTC().toJSDate() : new Date(data.appointmentDate);
        }

        const appointmentData = {
            patientId: data.patientId,
            doctorId: data.doctorId,
            appointmentDate: appointmentDateUTC,
            consultationFee: consultationFee,
            notes: data.notes,
            paymentStatus: data.paymentStatus
        };

        const appointment = await OpdAppointment.create(appointmentData);
        
        // Populate patient and doctor details so the frontend has them immediately for the OPD Card
        const populatedAppointment = await OpdAppointment.findById(appointment._id)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth address')
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

exports.updateAppointment = async (id, data) => {
    try {

        const appointment = await OpdAppointment.findById(id);
        if (!appointment) {
            const error = new Error('Appointment not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        if (data.doctorId) appointment.doctorId = data.doctorId;
        if (data.appointmentDate) {
            const dt = typeof data.appointmentDate === 'string'
                ? DateTime.fromISO(data.appointmentDate, { zone: 'Asia/Kolkata' })
                : DateTime.fromJSDate(new Date(data.appointmentDate));
            appointment.appointmentDate = dt.isValid ? dt.toUTC().toJSDate() : new Date(data.appointmentDate);
        }
        if (data.consultationFee !== undefined) appointment.consultationFee = data.consultationFee;
        if (data.notes !== undefined) appointment.notes = data.notes;
        if (data.status) appointment.status = data.status;

        await appointment.save();

        if (data.patientName && appointment.patientId) {
            await mongoose.model('Patient').findByIdAndUpdate(appointment.patientId, {
                fullName: data.patientName
            });
        }

        const populatedAppointment = await OpdAppointment.findById(appointment._id)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth address')
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

exports.getAppointmentById = async (id) => {
    try {
        const appointment = await OpdAppointment.findById(id)
            .populate('patientId', 'fullName patientCode mobileNo gender age dateOfBirth address')
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
        const consultationBill = await Bill.findOne({ opdAppointmentId: appointment._id, billType: { $in: ['OPD_CONSULTATION', 'OPD'] } });
        const chargesBill = await Bill.findOne({ opdAppointmentId: appointment._id, billType: 'OPD_CHARGES' });

        const apptObj = appointment.toObject();
        apptObj.consultationBillId = consultationBill ? consultationBill._id : null;
        apptObj.consultationBill = consultationBill || null;
        
        apptObj.chargesBillId = chargesBill ? chargesBill._id : null;
        apptObj.chargesBill = chargesBill || null;

        apptObj.billId = apptObj.consultationBillId;
        apptObj.bill = consultationBill || null;

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
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth address')
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

exports.getOpdCharges = async (appointmentId) => {
    try {
        const PatientCharge = require('../../common/patient_charge.model');
        const PatientChargeAddon = require('../../common/patient_charge_addon.model');
        const charges = await PatientCharge.find({ opdAppointmentId: appointmentId })
            .populate('chargeCategoryId')
            .populate('doctorId', 'fullName doctorCode specializationId')
            .sort({ createdAt: -1 });
        
        const chargesWithAddons = await Promise.all(charges.map(async (charge) => {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id })
                .populate('doctorId', 'fullName doctorCode specializationId');
            return {
                ...charge.toObject(),
                addons
            };
        }));
        return chargesWithAddons;
    } catch (error) {
        throw error;
    }
}

exports.createOpdCharge = async (appointmentId, data, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../../common/patient_charge.model');
        const PatientChargeAddon = require('../../common/patient_charge_addon.model');

        const appointment = await OpdAppointment.findById(appointmentId).session(session);
        if (!appointment) {
            const error = new Error('OPD appointment record not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const rate = Number(data.rate);
        const quantity = Number(data.quantity || 1);
        const amount = rate * quantity;
        const chargeDate = data.chargeDate ? new Date(data.chargeDate) : new Date();

        const [charge] = await PatientCharge.create([{
            opdAppointmentId: appointmentId,
            sourceType: 'OPD',
            patientId: appointment.patientId,
            chargeCategoryId: data.chargeCategoryId,
            chargeMasterId: data.chargeMasterId || null,
            description: data.description,
            quantity,
            rate,
            amount,
            isBilled: false,
            doctorId: data.doctorId || null,
            createdBy: userId || null,
            updatedBy: userId || null,
        }], { session });

        if (data.addons && Array.isArray(data.addons) && data.addons.length > 0) {
            const addonRecords = data.addons.map(addon => ({
                patientChargeId: charge._id,
                itemName: addon.itemName,
                amount: Number(addon.amount || 0),
                packageItemId: addon.packageItemId || null,
                chargeCategoryId: addon.chargeCategoryId || data.chargeCategoryId,
                chargeMasterId: data.chargeMasterId || null,
                isCustom: !!addon.isCustom,
                doctorId: addon.doctorId || null,
                createdBy: userId || null,
                updatedBy: userId || null,
            }));
            await PatientChargeAddon.insertMany(addonRecords, { session });
        }

        await session.commitTransaction();
        session.endSession();
        return charge;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.deleteOpdCharge = async (chargeId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../../common/patient_charge.model');
        const PatientChargeAddon = require('../../common/patient_charge_addon.model');

        const charge = await PatientCharge.findById(chargeId).session(session);
        if (!charge) {
            const error = new Error('Charge record not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        if (charge.isBilled) {
            const error = new Error('Cannot delete a charge that is already billed');
            error.status = STATUS_CODES.BAD_REQUEST;
            throw error;
        }

        await PatientChargeAddon.deleteMany({ patientChargeId: chargeId }).session(session);
        await charge.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();
        return charge;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.updateOpdCharge = async (chargeId, updateData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../../common/patient_charge.model');
        const charge = await PatientCharge.findById(chargeId).session(session);
        if (!charge) {
            const error = new Error('Charge record not found');
            error.status = 404;
            throw error;
        }

        if (charge.isBilled) {
            const error = new Error('Cannot update a charge that is already billed');
            error.status = 400;
            throw error;
        }

        const rate = updateData.rate !== undefined ? Number(updateData.rate) : charge.rate;
        const quantity = updateData.quantity !== undefined ? Number(updateData.quantity) : charge.quantity;
        const amount = rate * quantity;

        charge.chargeCategoryId = updateData.chargeCategoryId || charge.chargeCategoryId;
        charge.chargeMasterId = updateData.chargeMasterId || charge.chargeMasterId;
        charge.description = updateData.description || charge.description;
        charge.rate = rate;
        charge.quantity = quantity;
        charge.amount = amount;
        charge.doctorId = updateData.doctorId !== undefined ? updateData.doctorId : charge.doctorId;
        if (updateData.chargeDate) charge.createdAt = new Date(updateData.chargeDate);
        charge.updatedBy = userId || null;

        await charge.save({ session });

        await session.commitTransaction();
        session.endSession();
        return charge;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.syncAppointmentDates = async () => {
    try {
        const OpdAppointment = require('./opd_appointment.model');
        const appointments = await OpdAppointment.find({});
        let count = 0;
        for (let app of appointments) {
            if (app.createdAt) {
                app.appointmentDate = app.createdAt;
                await app.save();
                count++;
            }
        }
        return count;
    } catch (error) {
        throw error;
    }
};