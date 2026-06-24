const mongoose = require('mongoose');
const EmergencyVisit = require('./emergency.model');
const Doctor = require('../hr/doctor.model');
const STATUS_CODES = require('../../utils/statuscode');

exports.getEmergencyDoctors = async () => {
    try {
        const doctors = await Doctor.find({ isActive: true }).populate('specializationId', 'name');
        return doctors.map(doc => ({
            _id: doc._id,
            fullName: doc.fullName,
            specializationId: doc.specializationId
        }));
    } catch (error) {
        throw error;
    }
}

exports.getEmergencyVisits = async (query) => {
    try {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (query.priority) {
            filter.priority = query.priority;
        }
        if (query.doctorId) {
            filter.doctorId = query.doctorId;
        }
        if (query.paymentStatus) {
            filter.paymentStatus = query.paymentStatus;
        }
        if (query.search) {
            let searchStr = query.search;
            if (!searchStr.toUpperCase().startsWith('EH-ER-')) {
                searchStr = 'EH-ER-' + searchStr;
            }
            filter.visitNo = { $regex: searchStr, $options: 'i' };
        }
        if (query.date) {
            const startOfDay = new Date(query.date);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(query.date);
            endOfDay.setUTCHours(23, 59, 59, 999);
            filter.arrivalDateTime = { $gte: startOfDay, $lte: endOfDay };
        }

        const visits = await EmergencyVisit.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo gender age')
            .populate({
                path: 'doctorId',
                select: 'fullName',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ arrivalDateTime: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await EmergencyVisit.countDocuments(filter);

        // Fetch corresponding Bill records for these visits
        const Bill = mongoose.model('Bill');
        const visitIds = visits.map(v => v._id);
        const bills = await Bill.find({ emergencyVisitId: { $in: visitIds } });

        const visitsObj = visits.map(v => {
            const vObj = v.toObject();
            const bill = bills.find(b => b.emergencyVisitId && b.emergencyVisitId.toString() === v._id.toString());
            vObj.billId = bill ? bill._id : null;
            vObj.bill = bill || null;
            return vObj;
        });

        return {
            visits: visitsObj,
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

exports.createEmergencyVisit = async (data) => {
    try {
        const visitData = {
            patientId: data.patientId,
            doctorId: data.doctorId || null,
            arrivalDateTime: data.arrivalDateTime || new Date(),
            chiefComplaint: data.chiefComplaint || '',
            priority: data.priority || 'MEDIUM',
            notes: data.notes || '',
            consultationFee: data.consultationFee !== undefined ? data.consultationFee : 250,
            paymentStatus: data.paymentStatus || 'Unpaid'
        };

        const visit = await EmergencyVisit.create(visitData);
        
        const populatedVisit = await EmergencyVisit.findById(visit._id)
            .populate('patientId', 'fullName patientCode mobileNo age gender')
            .populate({
                path: 'doctorId',
                select: 'fullName',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            });

        return populatedVisit;
    } catch (error) {
        throw error;
    }
}

exports.deleteEmergencyVisit = async (id) => {
    try {
        const visit = await EmergencyVisit.findByIdAndDelete(id);
        if (!visit) {
            const error = new Error('Emergency visit not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        return visit;
    } catch (error) {
        throw error;
    }
}

exports.dischargeEmergencyVisit = async (id) => {
    try {
        const visit = await EmergencyVisit.findById(id);
        if (!visit) {
            const error = new Error('Emergency visit not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        visit.visitStatus = 'DISCHARGED';
        visit.dischargeDateTime = new Date();
        await visit.save();
        return visit;
    } catch (error) {
        throw error;
    }
}

exports.getEmergencyVisitById = async (id) => {
    try {
        const visit = await EmergencyVisit.findById(id)
            .populate('patientId', 'fullName patientCode mobileNo gender age')
            .populate({
                path: 'doctorId',
                select: 'fullName',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            });
        if (!visit) {
            const error = new Error('Emergency visit not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const Bill = mongoose.model('Bill');
        const consultationBill = await Bill.findOne({ emergencyVisitId: visit._id, billType: 'EMERGENCY_CONSULTATION' });
        const dischargeBill = await Bill.findOne({ emergencyVisitId: visit._id, billType: 'EMERGENCY' });

        const visitObj = visit.toObject();
        visitObj.consultationBillId = consultationBill ? consultationBill._id : null;
        visitObj.consultationBill = consultationBill || null;
        
        visitObj.dischargeBillId = dischargeBill ? dischargeBill._id : null;
        visitObj.dischargeBill = dischargeBill || null;

        // Keep legacy billId for backward compatibility in table listings
        visitObj.billId = visitObj.consultationBillId; 

        return visitObj;
    } catch (error) {
        throw error;
    }
}

exports.getEmergencyVisitsReport = async (query) => {
    try {
        const filter = {};
        
        if (query.startDate || query.endDate) {
            filter.arrivalDateTime = {};
            if (query.startDate) {
                const start = new Date(query.startDate);
                start.setUTCHours(0, 0, 0, 0);
                filter.arrivalDateTime.$gte = start;
            }
            if (query.endDate) {
                const end = new Date(query.endDate);
                end.setUTCHours(23, 59, 59, 999);
                filter.arrivalDateTime.$lte = end;
            }
        }
        
        if (query.doctorId) {
            filter.doctorId = query.doctorId;
        }
        if (query.priority) {
            filter.priority = query.priority;
        }

        const visits = await EmergencyVisit.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo age gender')
            .populate({
                path: 'doctorId',
                select: 'fullName',
                populate: {
                    path: 'specializationId',
                    select: 'name'
                }
            })
            .sort({ arrivalDateTime: 1 });

        return visits;
    } catch (error) {
        throw error;
    }
}

exports.getEmergencyCharges = async (visitId) => {
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');
        const charges = await PatientCharge.find({ emergencyVisitId: visitId })
            .populate('chargeCategoryId')
            .sort({ createdAt: -1 });
        
        const chargesWithAddons = await Promise.all(charges.map(async (charge) => {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id }).populate('doctorId');
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

exports.createEmergencyCharge = async (visitId, data) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const EmergencyVisit = require('./emergency.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');

        const visit = await EmergencyVisit.findById(visitId).session(session);
        if (!visit) {
            const error = new Error('Emergency visit record not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const rate = Number(data.rate);
        const quantity = Number(data.quantity || 1);
        const amount = rate * quantity;
        const chargeDate = data.chargeDate ? new Date(data.chargeDate) : new Date();

        const [charge] = await PatientCharge.create([{
            emergencyVisitId: visitId,
            sourceType: 'EMERGENCY',
            patientId: visit.patientId,
            chargeCategoryId: data.chargeCategoryId,
            chargeMasterId: data.chargeMasterId || null,
            description: data.description,
            quantity,
            rate,
            amount,
            isBilled: false,
            doctorId: data.doctorId || null,
            createdAt: chargeDate
        }], { session });

        let addonRecords = [];
        if (data.addons && Array.isArray(data.addons) && data.addons.length > 0) {
            addonRecords = data.addons.map(addon => ({
                patientChargeId: charge._id,
                itemName: addon.itemName,
                amount: Number(addon.amount || 0),
                packageItemId: addon.packageItemId || null,
                chargeCategoryId: data.chargeCategoryId,
                chargeMasterId: data.chargeMasterId || null,
                isCustom: !!addon.isCustom,
                doctorId: addon.doctorId || null,
                createdAt: chargeDate
            }));
        } else if (data.doctorId) {
            addonRecords = [{
                patientChargeId: charge._id,
                itemName: data.description,
                amount: amount,
                packageItemId: null,
                chargeCategoryId: data.chargeCategoryId,
                chargeMasterId: data.chargeMasterId || null,
                isCustom: true,
                doctorId: data.doctorId,
                createdAt: chargeDate
            }];
        }

        if (addonRecords.length > 0) {
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

exports.deleteEmergencyCharge = async (chargeId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const PatientCharge = require('../common/patient_charge.model');
        const PatientChargeAddon = require('../common/patient_charge_addon.model');

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
exports.updateEmergencyCharge = async (chargeId, updateData) => {
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

exports.updateDischargeSummary = async (visitId, summary) => {
    try {
        const visit = await EmergencyVisit.findById(visitId);
        if (!visit) {
            const error = new Error('Emergency visit not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        visit.dischargeSummary = summary;
        await visit.save();
        return visit;
    } catch (error) {
        throw error;
    }
}
