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
        const bill = await Bill.findOne({ emergencyVisitId: visit._id });

        const visitObj = visit.toObject();
        visitObj.billId = bill ? bill._id : null;
        visitObj.bill = bill || null;

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
