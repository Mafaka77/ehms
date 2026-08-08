const mongoose = require('mongoose');
const Doctor = require('./doctor.model');
const DoctorRenumerationRule = require('./doctor_renumeration_rule.model');
const Admission = require('../clinical/ipd/admission.model');
const PatientCharge = require('../common/patient_charge.model');
const PatientChargeAddon = require('../common/patient_charge_addon.model');
const Bill = require('../accounting/bill.model');
const BillItem = require('../accounting/bill_item.model');
const Discount = require('../accounting/discount.model');
const User = require('../auth/user.model');
const Patient = require('../patients/patient.model');
const STATUS_CODES = require('../../utils/statuscode');

let OpdAppointment;
try {
    OpdAppointment = require('../clinical/opd/opd_appointment.model');
} catch (e) {}

let EmergencyVisit;
try {
    EmergencyVisit = require('../emergency/emergency.model');
} catch (e) {}

let DentalAppointment;
try {
    DentalAppointment = require('../dental/dental_appointment.model');
} catch (e) {}

let RadiologyOrder;
try {
    RadiologyOrder = require('../radiology/radiology_order.model');
} catch (e) {}

const todayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getDateRangeFromQuery = (query) => {
    const range = query.range || 'this_month';
    const now = new Date();

    let start = new Date();
    let end = new Date();

    if (range === 'all' || range === 'ALL') {
        start = new Date(0);
        end = new Date('2099-12-31T23:59:59.999Z');
    } else if (range === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === 'custom' && query.startDate && query.endDate) {
        start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
};

exports.getDoctorActivityList = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = query.search || '';
        const doctorType = query.doctorType || '';
        const specializationId = query.specializationId || '';

        const filter = {};

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { doctorCode: { $regex: search, $options: 'i' } },
                { mobileNo: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (doctorType) filter.doctorType = doctorType;
        if (specializationId) filter.specializationId = specializationId;

        const total = await Doctor.countDocuments(filter);
        const doctors = await Doctor.find(filter)
            .populate('specializationId', 'name code')
            .populate({
                path: 'employeeId',
                select: 'departmentId designationId',
                populate: [
                    { path: 'departmentId', select: 'name code' },
                    { path: 'designationId', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const { start: todayStart, end: todayEnd } = todayRange();

        const enrichedDoctors = await Promise.all(doctors.map(async (doc) => {
            const docId = doc._id;

            let activeIpdCount = 0;
            try {
                activeIpdCount = await Admission.countDocuments({
                    consultantDoctorId: docId,
                    status: 'Admitted'
                });
            } catch (e) {}

            let opdTodayCount = 0;
            let opdTotalCount = 0;
            if (OpdAppointment) {
                try {
                    opdTodayCount = await OpdAppointment.countDocuments({
                        doctorId: docId,
                        appointmentDate: { $gte: todayStart, $lte: todayEnd }
                    });
                    opdTotalCount = await OpdAppointment.countDocuments({ doctorId: docId });
                } catch (e) {}
            }

            let rulesCount = 0;
            try {
                rulesCount = await DoctorRenumerationRule.countDocuments({ doctorId: docId });
            } catch (e) {}

            return {
                ...doc,
                activeIpdCount,
                opdTodayCount,
                opdTotalCount,
                rulesCount
            };
        }));

        return {
            doctors: enrichedDoctors,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1
            }
        };
    } catch (error) {
        throw error;
    }
};

exports.getDoctorActivityById = async (doctorId) => {
    try {
        const doctor = await Doctor.findById(doctorId)
            .populate('specializationId', 'name code')
            .populate({
                path: 'employeeId',
                select: 'fullName employeeCode mobileNo email departmentId designationId',
                populate: [
                    { path: 'departmentId', select: 'name code' },
                    { path: 'designationId', select: 'name' }
                ]
            })
            .lean();

        if (!doctor) {
            const error = new Error('Doctor not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const { start: todayStart, end: todayEnd } = todayRange();

        let activeAdmissions = [];
        try {
            activeAdmissions = await Admission.find({
                consultantDoctorId: doctorId,
                status: 'Admitted'
            })
            .populate('patientId', 'patientCode fullName gender age mobileNo')
            .populate('wardId', 'name code')
            .sort({ admissionDate: -1 })
            .lean();
        } catch (e) {}

        let recentAppointments = [];
        if (OpdAppointment) {
            try {
                const appts = await OpdAppointment.find({ doctorId })
                    .populate('patientId', 'patientCode fullName gender age mobileNo')
                    .sort({ appointmentDate: -1 })
                    .limit(20)
                    .lean();

                const apptIds = appts.map(a => a._id);
                const bills = await Bill.find({ opdAppointmentId: { $in: apptIds } })
                    .select('_id billNo status grossAmount discountAmount netAmount opdAppointmentId createdAt')
                    .lean();

                const billIds = bills.map(b => b._id);
                const discounts = await Discount.find({ billId: { $in: billIds } })
                    .populate('appliedBy', 'fullName')
                    .populate('doctorId', 'fullName doctorCode')
                    .lean();

                recentAppointments = appts.map(a => {
                    const bill = bills.find(b => b.opdAppointmentId && b.opdAppointmentId.toString() === a._id.toString());
                    const discountRecord = bill ? discounts.find(d => d.billId && d.billId.toString() === bill._id.toString()) : null;

                    const grossAmount = bill ? bill.grossAmount : (a.consultationFee || 0);
                    const discountAmount = discountRecord ? discountRecord.discountAmount : (bill ? bill.discountAmount : 0);
                    const netAmount = bill ? bill.netAmount : (a.consultationFee || 0);

                    return {
                        ...a,
                        billId: bill ? bill._id : null,
                        billNo: bill ? bill.billNo : 'N/A',
                        billStatus: bill ? bill.status : a.status,
                        grossAmount,
                        discountAmount,
                        netAmount,
                        billAmount: netAmount,
                        discountRecord: discountRecord || null
                    };
                });
            } catch (e) {}
        }

        let opdTodayCount = 0;
        let opdTotalCount = 0;
        if (OpdAppointment) {
            try {
                opdTodayCount = await OpdAppointment.countDocuments({
                    doctorId,
                    appointmentDate: { $gte: todayStart, $lte: todayEnd }
                });
                opdTotalCount = await OpdAppointment.countDocuments({ doctorId });
            } catch (e) {}
        }

        return {
            doctor,
            metrics: {
                activeIpdCount: activeAdmissions.length,
                opdTodayCount,
                opdTotalCount
            },
            activeAdmissions,
            recentAppointments
        };
    } catch (error) {
        throw error;
    }
};

exports.getDoctorActivityLogs = async (doctorId, query = {}) => {
    try {
        const { start, end } = getDateRangeFromQuery(query);
        const filterType = query.type || 'ALL'; // ALL, OPD, IPD_CHARGE, ADDON, BILL

        let doctorDoc = null;
        if (mongoose.Types.ObjectId.isValid(doctorId)) {
            doctorDoc = await Doctor.findById(doctorId).lean();
        }
        if (!doctorDoc) {
            doctorDoc = await Doctor.findOne({ employeeId: doctorId }).lean();
        }

        const targetDoctorIds = [];
        if (mongoose.Types.ObjectId.isValid(doctorId)) {
            targetDoctorIds.push(new mongoose.Types.ObjectId(doctorId));
            targetDoctorIds.push(doctorId.toString());
        } else {
            targetDoctorIds.push(doctorId);
        }

        if (doctorDoc) {
            if (doctorDoc._id) {
                targetDoctorIds.push(doctorDoc._id);
                targetDoctorIds.push(new mongoose.Types.ObjectId(doctorDoc._id));
            }
            if (doctorDoc.employeeId) {
                targetDoctorIds.push(doctorDoc.employeeId);
                if (mongoose.Types.ObjectId.isValid(doctorDoc.employeeId)) {
                    targetDoctorIds.push(new mongoose.Types.ObjectId(doctorDoc.employeeId));
                }
            }
        }

        let items = [];

        // 1. Fetch Consultation Bills (OPD, Emergency, Dental, Radiology)
        if ((filterType === 'ALL' || filterType === 'OPD' || filterType === 'EMERGENCY' || filterType === 'BILL') && Bill) {
            try {
                let opdIds = [];
                if (OpdAppointment) {
                    const docOpds = await OpdAppointment.find({ doctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    opdIds = docOpds.map(o => o._id);
                }

                let emergencyIds = [];
                if (EmergencyVisit) {
                    const docEmergencies = await EmergencyVisit.find({ doctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    emergencyIds = docEmergencies.map(e => e._id);
                }

                let dentalIds = [];
                if (DentalAppointment) {
                    const docDentals = await DentalAppointment.find({ doctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    dentalIds = docDentals.map(d => d._id);
                }

                let radiologyIds = [];
                if (RadiologyOrder) {
                    const docRadios = await RadiologyOrder.find({ performedById: { $in: targetDoctorIds } }).select('_id').lean();
                    radiologyIds = docRadios.map(r => r._id);
                }

                const billQuery = {
                    createdAt: { $gte: start, $lte: end },
                    billType: { $in: ['OPD_CONSULTATION', 'RADIOLOGY', 'DENTAL_CONSULTATION', 'EMERGENCY_CONSULTATION'] },
                    $or: [
                        { opdAppointmentId: { $in: opdIds } },
                        { emergencyVisitId: { $in: emergencyIds } },
                        { dentalAppointmentId: { $in: dentalIds } },
                        { radiologyOrderId: { $in: radiologyIds } }
                    ]
                };

                const bills = await Bill.find(billQuery)
                    .populate('patientId', 'patientCode fullName mobileNo')
                    .lean();

                const billIds = bills.map(b => b._id);
                const discounts = await Discount.find({ billId: { $in: billIds } })
                    .populate('appliedBy', 'fullName')
                    .populate('doctorId', 'fullName doctorCode')
                    .lean();

                bills.forEach(bill => {
                    const discountRecord = discounts.find(d => d.billId && d.billId.toString() === bill._id.toString());
                    const billNo = bill.billNo;
                    const discountAmount = discountRecord ? discountRecord.discountAmount : (bill.discountAmount || 0);
                    
                    let actType = 'Bill Invoice';
                    let desc = `Bill Invoice (${billNo})`;
                    
                    if (bill.billType === 'OPD_CONSULTATION') {
                        actType = 'OPD Bill Invoice';
                        desc = discountAmount > 0 ? `OPD Consultation ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})` : `OPD Consultation (${billNo})`;
                    } else if (bill.billType === 'EMERGENCY_CONSULTATION') {
                        actType = 'Emergency Consultation';
                        desc = discountAmount > 0 ? `Emergency Consultation ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})` : `Emergency Consultation (${billNo})`;
                    } else if (bill.billType === 'DENTAL_CONSULTATION') {
                        actType = 'Dental Consultation';
                        desc = discountAmount > 0 ? `Dental Consultation ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})` : `Dental Consultation (${billNo})`;
                    } else if (bill.billType === 'RADIOLOGY') {
                        actType = 'Radiology Invoice';
                        desc = discountAmount > 0 ? `Radiology Invoice ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})` : `Radiology Invoice (${billNo})`;
                    }

                    items.push({
                        id: `CONS_BILL_${bill._id}`,
                        activityType: actType,
                        source: bill.billType === 'OPD_CONSULTATION' ? 'OPD' : (bill.billType === 'EMERGENCY_CONSULTATION' ? 'EMERGENCY' : bill.billType),
                        code: billNo,
                        billNo: billNo,
                        billId: bill._id,
                        appointmentId: bill.opdAppointmentId || bill.emergencyVisitId || bill.dentalAppointmentId || bill.radiologyOrderId,
                        date: bill.createdAt || bill.generatedAt,
                        patientCode: bill.patientId?.patientCode || '—',
                        patientName: bill.patientId?.fullName || '—',
                        patientMobile: bill.patientId?.mobileNo || '—',
                        description: desc,
                        grossAmount: bill.grossAmount || 0,
                        discountAmount: discountAmount,
                        netAmount: bill.netAmount || 0,
                        amount: bill.netAmount || 0,
                        status: bill.status || 'Active',
                        discountRecord: discountRecord || null
                    });
                });
            } catch (e) {}
        }

        // Step 1.5 Removed

        // 2. Fetch Patient Charges
        if ((filterType === 'ALL' || filterType === 'IPD_CHARGE') && PatientCharge) {
            try {
                const chargeFilter = {
                    createdAt: { $gte: start, $lte: end },
                    doctorId: { $in: targetDoctorIds }
                };

                const charges = await PatientCharge.find(chargeFilter)
                .populate('patientId', 'patientCode fullName mobileNo')
                .populate('chargeCategoryId', 'name')
                .lean();

                charges.forEach(ch => {
                    items.push({
                        id: `CH_${ch._id}`,
                        activityType: 'IPD Charge Involved',
                        source: ch.sourceType || 'IPD',
                        code: ch.sourceType || 'IPD',
                        billNo: '—',
                        billId: null,
                        date: ch.createdAt,
                        patientCode: ch.patientId?.patientCode || '—',
                        patientName: ch.patientId?.fullName || '—',
                        patientMobile: ch.patientId?.mobileNo || '—',
                        description: `${ch.chargeCategoryId?.name ? ch.chargeCategoryId.name + ' - ' : ''}${ch.description || 'Doctor Charge'}`,
                        grossAmount: ch.amount || 0,
                        discountAmount: 0,
                        netAmount: ch.amount || 0,
                        amount: ch.amount || 0,
                        status: ch.paymentStatus || 'Unpaid',
                        discountRecord: null
                    });
                });
            } catch (e) {}
        }

        // 3. Fetch Patient Charge Addons
        if ((filterType === 'ALL' || filterType === 'IPD_CHARGE' || filterType === 'ADDON') && PatientChargeAddon) {
            try {
                const addons = await PatientChargeAddon.find({
                    doctorId: { $in: targetDoctorIds },
                    createdAt: { $gte: start, $lte: end }
                })
                .populate({
                    path: 'patientChargeId',
                    select: 'sourceType patientId',
                    populate: { path: 'patientId', select: 'patientCode fullName mobileNo' }
                })
                .populate('chargeCategoryId', 'name')
                .lean();

                addons.forEach(add => {
                    const parentCharge = add.patientChargeId;
                    const patient = parentCharge?.patientId;
                    const addonSource = parentCharge?.sourceType || 'IPD';

                    items.push({
                        id: `ADD_${add._id}`,
                        activityType: 'Charge Addon',
                        source: addonSource,
                        code: addonSource,
                        billNo: '—',
                        billId: null,
                        date: add.createdAt,
                        patientCode: patient?.patientCode || '—',
                        patientName: patient?.fullName || '—',
                        patientMobile: patient?.mobileNo || '—',
                        description: `Addon: ${add.itemName}${add.chargeCategoryId?.name ? ' (' + add.chargeCategoryId.name + ')' : ''}`,
                        grossAmount: add.amount || 0,
                        discountAmount: 0,
                        netAmount: add.amount || 0,
                        amount: add.amount || 0,
                        status: 'Active',
                        discountRecord: null
                    });
                });
            } catch (e) {}
        }

        // Step 4 Removed

        // Filter out Pharmacy, Test/Diagnostic, Room/Bed/Ward, and Dental charges (Include only doctor activity OPD, IPD, EMERGENCY charges)
        const allowedSources = ['OPD', 'IPD', 'EMERGENCY', 'RADIOLOGY', 'DENTAL_CONSULTATION', 'ENDOSCOPY'];
        const excludedKeywords = ['PHARMACY', 'LABORATORY', 'LAB', 'TEST', 'ROOM', 'BED', 'WARD', 'NURSING', 'ACCOMMODATION'];

        items = items.filter(item => {
            const src = (item.source || '').toUpperCase().trim();
            const desc = (item.description || '').toUpperCase();

            for (const kw of excludedKeywords) {
                if (src.includes(kw) || desc.includes(kw)) return false;
            }

            if (allowedSources.includes(src) || src === 'BILL' || src === 'ADDON') return true;

            return allowedSources.some(s => src.includes(s));
        });

        // Sort items descending by date
        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        const opdItems = items.filter(i => i.activityType === 'OPD Bill Invoice');
        const ipdItems = items.filter(i => i.activityType === 'IPD Charge Involved');
        const addonItems = items.filter(i => i.activityType === 'Charge Addon');
        const billItemsList = items.filter(i => i.activityType === 'Bill Invoice Involved');

        const opdCount = opdItems.length;
        const opdTotalAmount = opdItems.reduce((sum, i) => sum + (i.amount || 0), 0);

        const ipdChargeCount = ipdItems.length + addonItems.length;
        const ipdChargeTotalAmount = ipdItems.reduce((sum, i) => sum + (i.amount || 0), 0) + addonItems.reduce((sum, i) => sum + (i.amount || 0), 0);

        const billCount = billItemsList.length;
        const billTotalAmount = billItemsList.reduce((sum, i) => sum + (i.amount || 0), 0);

        const totalActivityCount = items.length;
        const grandTotalAmount = opdTotalAmount + ipdChargeTotalAmount;

        return {
            dateRange: { start, end },
            summary: {
                totalActivityCount,
                opdCount,
                opdTotalAmount,
                ipdChargeCount,
                ipdChargeTotalAmount,
                addonCount: addonItems.length,
                billCount,
                billTotalAmount,
                grandTotalAmount
            },
            items
        };
    } catch (error) {
        throw error;
    }
};
