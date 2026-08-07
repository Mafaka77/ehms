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

        // 1. Fetch OPD Appointments with their corresponding Bill Invoice & Discount cross-reference
        if ((filterType === 'ALL' || filterType === 'OPD') && OpdAppointment) {
            try {
                const appointments = await OpdAppointment.find({
                    doctorId: { $in: targetDoctorIds },
                    $or: [
                        { appointmentDate: { $gte: start, $lte: end } },
                        { createdAt: { $gte: start, $lte: end } }
                    ]
                })
                .populate('patientId', 'patientCode fullName mobileNo')
                .lean();

                const appointmentIds = appointments.map(a => a._id);
                const bills = await Bill.find({ opdAppointmentId: { $in: appointmentIds } })
                    .select('_id billNo billType status grossAmount discountAmount netAmount opdAppointmentId createdAt generatedAt')
                    .lean();

                const billIds = bills.map(b => b._id);
                const discounts = await Discount.find({ billId: { $in: billIds } })
                    .populate('appliedBy', 'fullName')
                    .populate('doctorId', 'fullName doctorCode')
                    .lean();

                appointments.forEach(app => {
                    const bill = bills.find(b => b.opdAppointmentId && b.opdAppointmentId.toString() === app._id.toString());
                    const billNo = bill ? bill.billNo : (app.appointmentId || 'OPD-BILL');
                    const discountRecord = bill ? discounts.find(d => d.billId && d.billId.toString() === bill._id.toString()) : null;

                    const grossAmount = bill ? bill.grossAmount : (app.consultationFee || 0);
                    const discountAmount = discountRecord ? discountRecord.discountAmount : (bill ? bill.discountAmount : 0);
                    const netAmount = bill ? bill.netAmount : (app.consultationFee || 0);

                    items.push({
                        id: `OPD_BILL_${app._id}`,
                        activityType: 'OPD Bill Invoice',
                        source: 'OPD',
                        code: billNo,
                        billNo: billNo,
                        billId: bill ? bill._id : null,
                        appointmentId: app.appointmentId,
                        date: (bill && (bill.createdAt || bill.generatedAt)) ? (bill.createdAt || bill.generatedAt) : (app.createdAt || app.appointmentDate),
                        patientCode: app.patientId?.patientCode || '—',
                        patientName: app.patientId?.fullName || '—',
                        patientMobile: app.patientId?.mobileNo || '—',
                        description: discountAmount > 0
                            ? `OPD Bill ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})`
                            : `OPD Bill Invoice (${billNo})`,
                        grossAmount,
                        discountAmount,
                        netAmount,
                        amount: netAmount,
                        status: bill ? bill.status : app.status,
                        discountRecord: discountRecord || null
                    });
                });
            } catch (e) {}
        }

        // 1.5 Fetch Emergency Visits with Consultation Fees & Bill/Discount cross-references
        if ((filterType === 'ALL' || filterType === 'EMERGENCY' || filterType === 'OPD') && EmergencyVisit) {
            try {
                const emergencyVisits = await EmergencyVisit.find({
                    doctorId: { $in: targetDoctorIds },
                    $or: [
                        { arrivalDateTime: { $gte: start, $lte: end } },
                        { createdAt: { $gte: start, $lte: end } }
                    ]
                })
                .populate('patientId', 'patientCode fullName mobileNo')
                .lean();

                const evIds = emergencyVisits.map(v => v._id);
                const evBills = await Bill.find({ emergencyVisitId: { $in: evIds } })
                    .select('_id billNo billType status grossAmount discountAmount netAmount emergencyVisitId createdAt generatedAt')
                    .lean();

                const evBillIds = evBills.map(b => b._id);
                const evDiscounts = await Discount.find({ billId: { $in: evBillIds } })
                    .populate('appliedBy', 'fullName')
                    .populate('doctorId', 'fullName doctorCode')
                    .lean();

                emergencyVisits.forEach(ev => {
                    const bill = evBills.find(b => b.emergencyVisitId && b.emergencyVisitId.toString() === ev._id.toString());
                    const billNo = bill ? bill.billNo : (ev.visitNo || 'EMG-BILL');
                    const discountRecord = bill ? evDiscounts.find(d => d.billId && d.billId.toString() === bill._id.toString()) : null;

                    const grossAmount = bill ? bill.grossAmount : (ev.consultationFee || 0);
                    const discountAmount = discountRecord ? discountRecord.discountAmount : (bill ? bill.discountAmount : 0);
                    const netAmount = bill ? bill.netAmount : (ev.consultationFee || 0);

                    items.push({
                        id: `EMG_BILL_${ev._id}`,
                        activityType: 'Emergency Consultation',
                        source: 'EMERGENCY',
                        code: billNo,
                        billNo: billNo,
                        billId: bill ? bill._id : null,
                        visitNo: ev.visitNo,
                        date: (bill && (bill.createdAt || bill.generatedAt)) ? (bill.createdAt || bill.generatedAt) : (ev.arrivalDateTime || ev.createdAt),
                        patientCode: ev.patientId?.patientCode || '—',
                        patientName: ev.patientId?.fullName || '—',
                        patientMobile: ev.patientId?.mobileNo || '—',
                        description: discountAmount > 0
                            ? `Emergency Consultation ${billNo} (${discountRecord?.discountType || 'Discount'}: -₹${discountAmount})`
                            : `Emergency Consultation Fee (${billNo})`,
                        grossAmount,
                        discountAmount,
                        netAmount,
                        amount: netAmount,
                        status: bill ? bill.status : (ev.paymentStatus || 'Unpaid'),
                        discountRecord: discountRecord || null
                    });
                });
            } catch (e) {}
        }

        // 2. Fetch Patient Charges
        if ((filterType === 'ALL' || filterType === 'IPD_CHARGE') && PatientCharge) {
            try {
                let docAdmissionIds = [];
                try {
                    const docAdms = await Admission.find({ consultantDoctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    docAdmissionIds = docAdms.map(a => a._id);
                } catch (e) {}

                const chargeFilter = {
                    createdAt: { $gte: start, $lte: end },
                    sourceType: { $ne: 'OPD' },
                    $or: [
                        { doctorId: { $in: targetDoctorIds } },
                        { admissionId: { $in: docAdmissionIds } }
                    ]
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

        // 4. Fetch General Bills with Discount records
        if ((filterType === 'ALL' || filterType === 'BILL') && Bill) {
            try {
                let opdIds = [];
                if (OpdAppointment) {
                    const docOpds = await OpdAppointment.find({ doctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    opdIds = docOpds.map(o => o._id);
                }

                let admissionIds = [];
                try {
                    const docAdms = await Admission.find({ consultantDoctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    admissionIds = docAdms.map(a => a._id);
                } catch (e) {}

                let chargeIds = [];
                if (PatientCharge) {
                    const docCharges = await PatientCharge.find({ doctorId: { $in: targetDoctorIds } }).select('_id').lean();
                    chargeIds = docCharges.map(c => c._id);
                }

                let billIdsFromItems = [];
                if (BillItem && chargeIds.length) {
                    const itemsWithCharge = await BillItem.find({ patientChargeId: { $in: chargeIds } }).select('billId').lean();
                    billIdsFromItems = itemsWithCharge.map(b => b.billId);
                }

                const billQuery = {
                    createdAt: { $gte: start, $lte: end },
                    billType: { $ne: 'OPD' },
                    $or: [
                        { opdAppointmentId: { $in: opdIds } },
                        { admissionId: { $in: admissionIds } },
                        { _id: { $in: billIdsFromItems } }
                    ]
                };

                const bills = await Bill.find(billQuery)
                    .populate('patientId', 'patientCode fullName mobileNo')
                    .lean();

                const generalBillIds = bills.map(b => b._id);
                const generalDiscounts = await Discount.find({ billId: { $in: generalBillIds } })
                    .populate('appliedBy', 'fullName')
                    .populate('doctorId', 'fullName doctorCode')
                    .lean();

                bills.forEach(b => {
                    const discountRecord = generalDiscounts.find(d => d.billId && d.billId.toString() === b._id.toString());
                    items.push({
                        id: `BILL_${b._id}`,
                        activityType: 'Bill Invoice Involved',
                        source: b.billType || 'BILL',
                        code: b.billNo || 'BILL',
                        billNo: b.billNo || 'BILL',
                        billId: b._id,
                        date: b.createdAt,
                        patientCode: b.patientId?.patientCode || '—',
                        patientName: b.patientId?.fullName || '—',
                        patientMobile: b.patientId?.mobileNo || '—',
                        description: `Bill Invoice ${b.billNo} (${b.billType || 'General'})`,
                        grossAmount: b.grossAmount || b.netAmount || 0,
                        discountAmount: discountRecord ? discountRecord.discountAmount : (b.discountAmount || 0),
                        netAmount: b.netAmount || 0,
                        amount: b.netAmount || 0,
                        status: b.status || 'DRAFT',
                        discountRecord: discountRecord || null
                    });
                });
            } catch (e) {}
        }

        // Filter out Pharmacy, Test/Diagnostic, Room/Bed/Ward, and Dental charges (Include only doctor activity OPD, IPD, EMERGENCY charges)
        const allowedSources = ['OPD', 'IPD', 'EMERGENCY'];
        const excludedKeywords = ['PHARMACY', 'LABORATORY', 'LAB', 'TEST', 'RADIOLOGY', 'ENDOSCOPY', 'ROOM', 'BED', 'WARD', 'NURSING', 'ACCOMMODATION', 'DENTAL'];

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
