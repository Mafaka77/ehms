const Patient = require('../patients/patient.model')
const Admission = require('../clinical/ipd/admission.model')
const Doctor = require('../hr/doctor.model')
const Employee = require('../hr/employee.model')

let Appointment, Bill, LabOrder, RadiologyOrder, EmergencyVisit, PharmacySale

try { Appointment = require('../clinical/opd/opd_appointment.model') } catch {}
try { Bill = require('../accounting/bill.model') } catch {}
try { LabOrder = require('../laboratory/lab_order.model') } catch {}
try { RadiologyOrder = require('../radiology/radiology_order.model') } catch {}
try { EmergencyVisit = require('../emergency/emergency.model') } catch {}
try { PharmacySale = require('../pharmacy/pharmacy_sale.model') } catch {}

const todayRange = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    return { start, end }
}

const monthRange = (offset = 0) => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999)
    return { start, end }
}

const safeCount = async (model, filter = {}) => {
    if (!model) return 0
    try { return await model.countDocuments(filter) } catch { return 0 }
}

const safeSum = async (model, pipeline) => {
    if (!model) return 0
    try {
        const result = await model.aggregate(pipeline)
        return result[0]?.total || 0
    } catch { return 0 }
}

exports.getAdminDashboardStats = async () => {
    const { start: todayStart, end: todayEnd } = todayRange()
    const { start: thisMonthStart, end: thisMonthEnd } = monthRange(0)
    const { start: lastMonthStart, end: lastMonthEnd } = monthRange(-1)

    const [
        totalPatients, newPatientsToday, newPatientsThisMonth, newPatientsLastMonth,
        todayAppointments, thisMonthAppointments, lastMonthAppointments,
        activeAdmissions, todayAdmissions, todayDischarges,
        totalDoctors, totalEmployees,
        todayRevenue, thisMonthRevenue, lastMonthRevenue,
        todayLabOrders, todayRadOrders, todayEmergencyVisits, todayPharmacySales
    ] = await Promise.all([
        safeCount(Patient, {}),
        safeCount(Patient, { createdAt: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(Patient, { createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd } }),
        safeCount(Patient, { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
        safeCount(Appointment, { appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(Appointment, { appointmentDate: { $gte: thisMonthStart, $lte: thisMonthEnd } }),
        safeCount(Appointment, { appointmentDate: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
        safeCount(Admission, { status: { $in: ['ADMITTED', 'Admitted'] } }),
        safeCount(Admission, { admissionDate: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(Admission, { status: { $in: ['DISCHARGED', 'Discharged'] }, updatedAt: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(Doctor, { isActive: true }),
        safeCount(Employee, { isActive: true }),
        safeSum(Bill, [
            { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        safeSum(Bill, [
            { $match: { createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd }, status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        safeSum(Bill, [
            { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ]),
        safeCount(LabOrder, { createdAt: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(RadiologyOrder, { createdAt: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(EmergencyVisit, { createdAt: { $gte: todayStart, $lte: todayEnd } }),
        safeCount(PharmacySale, { createdAt: { $gte: todayStart, $lte: todayEnd } })
    ])

    const pctGrowth = (current, last) =>
        last ? Math.round(((current - last) / Math.max(last, 1)) * 100) : null

    return {
        patients: {
            total: totalPatients,
            today: newPatientsToday,
            thisMonth: newPatientsThisMonth,
            growthPercent: pctGrowth(newPatientsThisMonth, newPatientsLastMonth)
        },
        appointments: {
            today: todayAppointments,
            thisMonth: thisMonthAppointments,
            growthPercent: pctGrowth(thisMonthAppointments, lastMonthAppointments)
        },
        ipd: {
            activeAdmissions,
            admittedToday: todayAdmissions,
            dischargedToday: todayDischarges
        },
        revenue: {
            today: todayRevenue,
            thisMonth: thisMonthRevenue,
            growthPercent: pctGrowth(thisMonthRevenue, lastMonthRevenue)
        },
        staff: { doctors: totalDoctors, employees: totalEmployees },
        modules: {
            labOrdersToday: todayLabOrders,
            radOrdersToday: todayRadOrders,
            emergencyToday: todayEmergencyVisits,
            pharmacySalesToday: todayPharmacySales
        }
    }
}

exports.getRecentActivity = async () => {
    const recentPatients = await Patient.find()
        .sort({ createdAt: -1 }).limit(5)
        .select('patientCode fullName gender age createdAt').lean()

    const recentAdmissions = await Admission.find()
        .sort({ createdAt: -1 }).limit(5)
        .populate('patientId', 'patientCode fullName')
        .populate('consultantDoctorId', 'fullName')
        .select('admissionNo patientId consultantDoctorId status admissionDate').lean()

    let recentAppointments = []
    if (Appointment) {
        recentAppointments = await Appointment.find()
            .sort({ createdAt: -1 }).limit(5)
            .populate('patientId', 'patientCode fullName')
            .populate('doctorId', 'fullName')
            .select('appointmentDate status patientId doctorId').lean()
    }

    let beds = []
    try {
        const Bed = require('../clinical/ipd/bed.model')
        const allBeds = await Bed.find({ isActive: true })
            .populate('wardId', 'name code wardType floor')
            .populate('nursingStationId', 'name code')
            .lean()

        const statusOrder = { AVAILABLE: 1, OCCUPIED: 2, RESERVED: 3, MAINTENANCE: 4 }
        beds = allBeds.sort((a, b) => {
            const orderA = statusOrder[a.status] || 99
            const orderB = statusOrder[b.status] || 99
            if (orderA !== orderB) return orderA - orderB
            return (a.bedNo || '').localeCompare(b.bedNo || '', undefined, { numeric: true, sensitivity: 'base' })
        })
    } catch (e) {
        console.error('Error fetching beds for dashboard:', e)
    }

    return { recentPatients, recentAdmissions, recentAppointments, beds }
}

exports.getMonthlyChartData = async () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
        const { start, end } = monthRange(-i)
        const label = start.toLocaleString('default', { month: 'short' })
        months.push({ label, start, end })
    }
    return Promise.all(months.map(async ({ label, start, end }) => {
        const [patients, appointments, admissions] = await Promise.all([
            safeCount(Patient, { createdAt: { $gte: start, $lte: end } }),
            safeCount(Appointment, { appointmentDate: { $gte: start, $lte: end } }),
            safeCount(Admission, { admissionDate: { $gte: start, $lte: end } })
        ])
        return { label, patients, appointments, admissions }
    }))
}
