const mongoose = require('mongoose');
const DentalAppointment = require('./dental_appointment.model');
const Doctor = require('../hr/doctor.model');
const DoctorRemunerationRule = require('../hr/doctor_renumeration_rule.model');
const STATUS_CODES = require('../../utils/statuscode');

exports.getDentalDoctors = async () => {
    try {
        // Find remuneration rules for DENTAL, or alternatively we can fetch doctors by specialization
        // For mirroring OPD exactly, we fetch where serviceType is DENTAL
        const rules = await DoctorRemunerationRule.find({
            serviceType: 'DENTAL',
            isActive: true
        }).populate({
            path: 'doctorId',
            populate: {
                path: 'specializationId',
                select: 'name'
            }
        });

        const dentalDoctors = rules
            .filter(rule => rule.doctorId && rule.doctorId.isActive)
            .map(rule => ({
                _id: rule.doctorId._id,
                fullName: rule.doctorId.fullName,
                specializationId: rule.doctorId.specializationId,
                consultationFee: rule.amount
            }));

        return dentalDoctors;
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
            const Patient = mongoose.model('Patient');
            const matchingPatients = await Patient.find({
                $or: [
                    { fullName: { $regex: query.search, $options: 'i' } },
                    { patientCode: { $regex: query.search, $options: 'i' } },
                    { mobileNo: { $regex: query.search, $options: 'i' } }
                ]
            }).select('_id');
            const patientIds = matchingPatients.map(p => p._id);

            let searchStr = query.search;
            let regexSearchStr = searchStr;
            if (!searchStr.toUpperCase().startsWith('EH-DENT-')) {
                regexSearchStr = 'EH-DENT-' + searchStr;
            }

            filter.$or = [
                { appointmentId: { $regex: regexSearchStr, $options: 'i' } },
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

        const appointments = await DentalAppointment.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo gender dateOfBirth age')
            .populate({
                path: 'doctorId',
                select: 'fullName',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ appointmentDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await DentalAppointment.countDocuments(filter);

        // Fetch corresponding Bill records for these appointments
        const Bill = mongoose.model('Bill');
        const appointmentIds = appointments.map(a => a._id);
        const bills = await Bill.find({ dentalAppointmentId: { $in: appointmentIds }, billType: 'DENTAL_CONSULTATION' }); 

        const appointmentsObj = appointments.map(appt => {
            const apptObj = appt.toObject();
            const bill = bills.find(b => b.dentalAppointmentId && b.dentalAppointmentId.toString() === appt._id.toString());
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

        // If no explicit fee passed, fetch from Doctor profile
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

        const appointment = await DentalAppointment.create(appointmentData);
        
        const populatedAppointment = await DentalAppointment.findById(appointment._id)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName',
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

exports.updateAppointmentStatus = async (id, status) => {
    try {
        const appointment = await DentalAppointment.findByIdAndUpdate(
            id,
            { treatmentStatus: status },
            { new: true }
        );
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

exports.deleteAppointment = async (id) => {
    try {
        const appointment = await DentalAppointment.findByIdAndDelete(id);
        if (!appointment) {
            const error = new Error('Appointment not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        // Cascade delete related records
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const DentalInstallment = require('./dental_installment.model');
        const Bill = require('../accounting/bill.model');
        const BillItem = require('../accounting/bill_item.model');
        const Payment = require('../accounting/payment.model');
        const Discount = require('../accounting/discount.model');

        // Delete Dental Charges and their Addons
        const charges = await PatientCharge.find({ dentalAppointmentId: id });
        const chargeIds = charges.map(c => c._id);
        if (chargeIds.length > 0) {
            await PatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } });
            await PatientCharge.deleteMany({ dentalAppointmentId: id });
        }

        // Delete Installments
        await DentalInstallment.deleteMany({ appointmentId: id });

        // Delete associated Bills and their dependencies (Items, Payments, Discounts)
        const bills = await Bill.find({ dentalAppointmentId: id });
        const billIds = bills.map(b => b._id);
        if (billIds.length > 0) {
            await BillItem.deleteMany({ billId: { $in: billIds } });
            await Payment.deleteMany({ billId: { $in: billIds } });
            await Discount.deleteMany({ billId: { $in: billIds } });
            await Bill.deleteMany({ dentalAppointmentId: id });
        }

        return appointment;
    } catch (error) {
        throw error;
    }
}

exports.getAppointmentById = async (id) => {
    try {
        const appointment = await DentalAppointment.findById(id)
            .populate('patientId', 'fullName patientCode mobileNo gender age dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName',
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
        const bill = await Bill.findOne({ dentalAppointmentId: appointment._id, billType: 'DENTAL_CONSULTATION' });

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

        const appointments = await DentalAppointment.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo age gender dateOfBirth')
            .populate({
                path: 'doctorId',
                select: 'fullName',
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
            const bill = await Bill.findOne({ dentalAppointmentId: appt._id });
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

exports.addPatientCharge = async (appointmentId, data, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const appointment = await DentalAppointment.findById(appointmentId).session(session);
        if (!appointment) {
            const error = new Error('Dental Appointment not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const rate = Number(data.rate);
        const quantity = Number(data.quantity || 1);
        const amount = rate * quantity;
        const chargeDate = data.chargeDate ? new Date(data.chargeDate) : new Date();

        const [charge] = await PatientCharge.create([{
            dentalAppointmentId: appointmentId,
            sourceType: 'DENTAL',
            patientId: appointment.patientId,
            chargeCategoryId: data.chargeCategoryId,
            chargeMasterId: data.chargeMasterId || null,
            description: data.description,
            quantity: quantity,
            rate: rate,
            amount: amount,
            isBilled: false,
            doctorId: data.doctorId || appointment.doctorId || null,
            createdBy: userId || null,
            updatedBy: userId || null,
            createdAt: chargeDate
        }], { session });

        // Create addons as separate PatientChargeAddon records (amounts stored independently)
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
                createdAt: chargeDate
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
};

exports.getPatientCharges = async (appointmentId) => {
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const charges = await PatientCharge.find({ dentalAppointmentId: appointmentId })
            .populate('chargeCategoryId', 'name type isOt')
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 });
        
        const chargesWithAddons = await Promise.all(charges.map(async (charge) => {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id })
                .populate('doctorId', 'fullName name specializationId');
            return {
                ...charge.toObject(),
                addons
            };
        }));
        return chargesWithAddons;
    } catch (error) {
        throw error;
    }
};

exports.deletePatientCharge = async (appointmentId, chargeId) => {
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const charge = await PatientCharge.findOne({ _id: chargeId, dentalAppointmentId: appointmentId });
        if (!charge) {
            const error = new Error('Patient charge not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        if (charge.isBilled) {
            const error = new Error('Cannot delete a billed charge');
            error.status = STATUS_CODES.BAD_REQUEST;
            throw error;
        }

        await PatientChargeAddon.deleteMany({ patientChargeId: chargeId });
        await PatientCharge.findByIdAndDelete(chargeId);
        return charge;
    } catch (error) {
        throw error;
    }
};

exports.addInstallment = async (appointmentId, chargeId, data, userId) => {
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const DentalInstallment = require('./dental_installment.model');
        const STATUS_CODES = require('../../utils/statuscode');

        const charge = await PatientCharge.findOne({ _id: chargeId, dentalAppointmentId: appointmentId });
        if (!charge) {
            const error = new Error('Patient charge not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        // Calculate current balance (base charge + addon amounts)
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const installments = await DentalInstallment.find({ dentalPatientChargesId: chargeId, status: 'PAID' });
        const addons = await PatientChargeAddon.find({ patientChargeId: chargeId });
        const addonsTotal = addons.reduce((sum, a) => sum + (a.amount || 0), 0);
        let paidAmount = 0;
        installments.forEach(i => paidAmount += i.amount);
        let balance = (charge.amount + addonsTotal) - paidAmount;

        if (data.amount > balance) {
            const error = new Error('Installment amount exceeds remaining balance');
            error.status = STATUS_CODES.BAD_REQUEST;
            throw error;
        }

        // If the charge is not billed yet, we need to generate a bill for the appointment
        // This will include all current unbilled charges.
        let targetBillId = charge.billId;
        const billService = require('../accounting/bill.services');
        const Bill = require('../accounting/bill.model');

        if (!charge.isBilled) {
            try {
                const newBill = await billService.generateBillFromDentalAppointment(appointmentId, userId, 0, null, null, null, chargeId);
                // Refresh the charge to get the assigned billId
                const updatedCharge = await PatientCharge.findById(chargeId);
                targetBillId = updatedCharge.billId;
            } catch (err) {
                // If it fails (e.g., no unbilled charges somehow), try fetching existing bill
                const existingBill = await Bill.findOne({ dentalAppointmentId: appointmentId }).sort({ createdAt: -1 });
                if (existingBill) targetBillId = existingBill._id;
                else throw err;
            }
        }

        if (!targetBillId) {
            const error = new Error('Unable to find or generate bill for this charge');
            error.status = STATUS_CODES.INTERNAL_SERVER_ERROR;
            throw error;
        }

        // Sync bill amounts to include addon totals (handles bills created before addon fix)
        const existingBill = await Bill.findById(targetBillId);
        if (existingBill) {
            const chargeTotal = charge.amount + addonsTotal;
            const currentBillChargeAmount = existingBill.grossAmount || 0;
            if (chargeTotal > currentBillChargeAmount && currentBillChargeAmount === charge.amount) {
                const diff = addonsTotal;
                existingBill.grossAmount += diff;
                existingBill.netAmount += diff;
                existingBill.balanceAmount += diff;
                await existingBill.save();
            }
        }

        // Process payment through the central billing module
        const paymentData = {
            amount: data.amount,
            paymentMode: data.paymentMode || 'CASH',
            remarks: `Installment for procedure: ${charge.description}`
        };
        const payment = await billService.processBillPayment(targetBillId, paymentData, userId);

        const newBalance = balance - data.amount;

        const installment = await DentalInstallment.create({
            dentalPatientChargesId: chargeId,
            appointmentId: appointmentId,
            amount: data.amount,
            balance: newBalance,
            paymentMode: data.paymentMode || 'CASH',
            paymentId: payment._id,
            createdBy: userId
        });

        const chargeTotal = charge.amount + addonsTotal;
        if (newBalance <= 0) {
            charge.paymentStatus = 'Paid';
        } else if (newBalance < chargeTotal) {
            charge.paymentStatus = 'Partial';
        } else {
            charge.paymentStatus = 'Unpaid';
        }
        await charge.save();

        return installment;
    } catch (error) {
        throw error;
    }
};

exports.getInstallments = async (appointmentId) => {
    try {
        const DentalInstallment = require('./dental_installment.model');
        const installments = await DentalInstallment.find({ appointmentId: appointmentId })
            .populate('dentalPatientChargesId', 'description amount')
            .populate('paymentId')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });
        return installments;
    } catch (error) {
        throw error;
    }
};

exports.updatePatientCharge = async (chargeId, updateData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../common/patient_charge.model');
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

        if (updateData.rate !== undefined) charge.rate = Number(updateData.rate);
        if (updateData.quantity !== undefined) charge.quantity = Number(updateData.quantity);
        charge.amount = charge.rate * charge.quantity;
        if (userId) charge.updatedBy = userId;

        await charge.save({ session });
        await session.commitTransaction();
        session.endSession();
        return charge;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
