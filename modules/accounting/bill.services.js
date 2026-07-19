const mongoose = require('mongoose')
const Bill = require('./bill.model')
const BillItem = require('./bill_item.model')
const Payment = require('./payment.model')
const LabOrder = require('../laboratory/lab_order.model')
const LabOrderItem = require('../laboratory/lab_order_item.model')
const RadiologyOrder = require('../radiology/radiology_order.model')
const RadiologyOrderItem = require('../radiology/radiology_order_item.model')
const OpdAppointment = require('../clinical/opd/opd_appointment.model')
const DentalAppointment = require('../dental/dental_appointment.model')
const Counter = require('../common/counter.model')
const Discount = require('./discount.model')
const Employee = require('../hr/employee.model')
const STATUS_CODES = require('../../utils/statuscode')

// ---------------------------------------------------------------------------
// Helper: resolve employee for discount
// ---------------------------------------------------------------------------
async function resolveDiscountEmployee(patientId, employeeId, session) {
    if (employeeId) return employeeId

    const patient = await mongoose.model('Patient').findById(patientId).session(session)
    if (!patient) return null

    const mobileStr = patient.mobileNo ? String(patient.mobileNo).replace(/\D/g, '') : ''
    const phoneNum = Number(mobileStr)
    const query = []
    if (mobileStr && !isNaN(phoneNum)) query.push({ mobile: phoneNum })
    if (patient.email) query.push({ email: patient.email })
    if (query.length === 0) return null

    const emp = await Employee.findOne({ $or: query, isActive: true }).session(session)
    return emp ? emp._id : null
}

// ---------------------------------------------------------------------------
// generateBillFromLabOrder
// ---------------------------------------------------------------------------
exports.generateBillFromLabOrder = async (labOrderId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch lab order
        const order = await LabOrder.findById(labOrderId).session(session)
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (order.billId) {
            const existingBill = await Bill.findById(order.billId).session(session)
            if (existingBill) {
                await session.abortTransaction()
                session.endSession()
                return existingBill
            }
        }

        // 2. Fetch order items
        const orderItems = await LabOrderItem.find({ orderId: labOrderId }).session(session)
        if (orderItems.length === 0) {
            const error = new Error('Lab order has no items')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // 3. Calculate amounts
        const grossAmount = order.totalAmount
        const netAmount = grossAmount - discountAmount

        // 4. Create Bill
        const [bill] = await Bill.create([{
            patientId: order.patientId,
            admissionId: order.admissionId || null,
            labOrderId: order._id,
            billType: 'LAB',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 5. Create BillItems
        for (const item of orderItems) {
            const itemDiscount = grossAmount > 0 ? Number((discountAmount * (item.amount / grossAmount)).toFixed(2)) : 0
            const itemNetAmount = item.amount - itemDiscount
            await BillItem.create([{
                billId: bill._id,
                itemType: 'LAB',
                sourceModule: 'LAB',
                description: item.testName,
                referenceId: item._id,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
                discountAmount: itemDiscount,
                netAmount: itemNetAmount
            }], { session })
        }

        // 6. Update LabOrder references
        order.billId = bill._id
        order.paymentStatus = 'UNPAID'
        await order.save({ session })

        // 7. Create Discount record if discount is applied
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(order.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: order.patientId,
                employeeId: resolvedEmployeeId,
                discountType: discountType || 'CUSTOM',
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromRadiologyOrder
// ---------------------------------------------------------------------------
exports.generateBillFromRadiologyOrder = async (radiologyOrderId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch radiology order
        const order = await RadiologyOrder.findById(radiologyOrderId).session(session)
        if (!order) {
            const error = new Error('Radiology order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (order.billId) {
            const existingBill = await Bill.findById(order.billId).session(session)
            if (existingBill) {
                await session.abortTransaction()
                session.endSession()
                return existingBill
            }
        }

        // 2. Fetch order items
        const orderItems = await RadiologyOrderItem.find({ orderId: radiologyOrderId })
            .populate('radiologyTestId', 'name')
            .session(session)
        if (orderItems.length === 0) {
            const error = new Error('Radiology order has no items')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // 3. Calculate amounts
        const grossAmount = order.totalAmount
        const netAmount = grossAmount - discountAmount

        // 4. Create Bill
        const [bill] = await Bill.create([{
            patientId: order.patientId,
            admissionId: order.admissionId || null,
            radiologyOrderId: order._id,
            billType: 'RADIOLOGY',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 5. Create BillItems
        for (const item of orderItems) {
            const itemDiscount = grossAmount > 0 ? Number((discountAmount * (item.amount / grossAmount)).toFixed(2)) : 0
            const itemNetAmount = item.amount - itemDiscount
            await BillItem.create([{
                billId: bill._id,
                itemType: 'RADIOLOGY',
                sourceModule: 'RADIOLOGY',
                description: item.radiologyTestId?.name || 'Radiology Test',
                referenceId: item._id,
                quantity: item.quantity || 1,
                rate: item.rate,
                amount: item.amount,
                discountAmount: itemDiscount,
                netAmount: itemNetAmount
            }], { session })
        }

        // 6. Update RadiologyOrder references
        order.billId = bill._id
        order.paymentStatus = 'UNPAID'
        await order.save({ session })

        // 7. Create Discount record if discount is applied
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(order.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: order.patientId,
                employeeId: resolvedEmployeeId,
                discountType: discountType || 'CUSTOM',
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromOpdAppointment
// ---------------------------------------------------------------------------
exports.generateBillFromOpdAppointment = async (opdAppointmentId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch OPD appointment
        const appointment = await OpdAppointment.findById(opdAppointmentId)
            .populate({ path: 'doctorId', select: 'fullName' })
            .session(session)
        if (!appointment) {
            const error = new Error('OPD appointment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Check if bill already generated
        const existingBill = await Bill.findOne({ opdAppointmentId }).session(session)
        if (existingBill) {
            await session.abortTransaction()
            session.endSession()
            return existingBill
        }

        // 2. Calculate amounts
        const grossAmount = appointment.consultationFee || 0
        const netAmount = grossAmount - discountAmount

        // 3. Create Bill
        const [bill] = await Bill.create([{
            patientId: appointment.patientId,
            opdAppointmentId: appointment._id,
            billType: 'OPD',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 4. Create BillItem
        const doctorName = appointment.doctorId ? ` - Dr. ${appointment.doctorId.fullName}` : ''
        await BillItem.create([{
            billId: bill._id,
            itemType: 'CONSULTATION',
            sourceModule: 'CONSULTATION',
            description: `OPD Consultation Fee${doctorName}`,
            referenceId: appointment._id,
            quantity: 1,
            rate: grossAmount,
            amount: grossAmount,
            discountAmount: discountAmount,
            netAmount: netAmount
        }], { session })

        // 5. Update OPD Appointment reference
        appointment.paymentStatus = 'Unpaid'
        await appointment.save({ session })

        // 6. Create Discount record if discount is applied
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(appointment.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: appointment.patientId,
                employeeId: resolvedEmployeeId,
                discountType: discountType || 'CUSTOM',
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromEmergencyVisit
// ---------------------------------------------------------------------------
exports.generateBillFromEmergencyVisit = async (emergencyVisitId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch Emergency visit
        const visit = await mongoose.model('EmergencyVisit').findById(emergencyVisitId)
            .populate({ path: 'doctorId', select: 'fullName' })
            .session(session)
        if (!visit) {
            const error = new Error('Emergency visit not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Check if bill already generated
        const existingBill = await Bill.findOne({ emergencyVisitId, billType: 'EMERGENCY_CONSULTATION' }).session(session)
        if (existingBill) {
            await session.abortTransaction()
            session.endSession()
            return existingBill
        }

        // 2. Calculate amounts
        const grossAmount = visit.consultationFee || 0
        const netAmount = grossAmount - discountAmount

        // 3. Create Bill
        const [bill] = await Bill.create([{
            patientId: visit.patientId,
            emergencyVisitId: visit._id,
            billType: 'EMERGENCY_CONSULTATION',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 4. Create BillItem for Consultation Fee
        const doctorName = visit.doctorId ? ` - Dr. ${visit.doctorId.fullName}` : ''
        await BillItem.create([{
            billId: bill._id,
            itemType: 'CONSULTATION',
            sourceModule: 'CONSULTATION',
            description: `Emergency Consultation Fee${doctorName}`,
            referenceId: visit._id,
            quantity: 1,
            rate: grossAmount,
            amount: grossAmount,
            discountAmount: discountAmount,
            netAmount: netAmount
        }], { session })

        // 5. Update Emergency Visit reference
        visit.paymentStatus = 'Unpaid'
        await visit.save({ session })

        // 6. Create Discount record if discount is applied
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(visit.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: visit.patientId,
                employeeId: resolvedEmployeeId,
                discountType: discountType || 'CUSTOM',
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromEmergencyCharges
// ---------------------------------------------------------------------------
exports.generateBillFromEmergencyCharges = async (emergencyVisitId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch Emergency visit
        const visit = await mongoose.model('EmergencyVisit').findById(emergencyVisitId)
            .populate({ path: 'doctorId', select: 'fullName' })
            .session(session)
        if (!visit) {
            const error = new Error('Emergency visit not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Check if charges bill already generated
        const existingBill = await Bill.findOne({ emergencyVisitId, billType: 'EMERGENCY' }).session(session)
        if (existingBill) {
            await session.abortTransaction()
            session.endSession()
            return existingBill
        }

        // 2. Fetch unbilled PatientCharges
        const PatientCharge = require('../common/patient_charge.model')
        const unbilledCharges = await PatientCharge.find({ emergencyVisitId: visit._id, isBilled: false }).populate('chargeCategoryId').session(session)

        if (unbilledCharges.length === 0) {
            const error = new Error('No unbilled charges found for this visit')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const PatientChargeAddon = require('../common/patient_charge_addon.model')

        let totalChargesAmount = 0
        for (const charge of unbilledCharges) {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id }).session(session)
            const addonsTotal = addons.reduce((sum, a) => sum + (a.amount || 0), 0)
            charge._addonsTotal = addonsTotal
            totalChargesAmount += charge.amount + addonsTotal
        }

        // 3. Calculate amounts
        const grossAmount = totalChargesAmount
        const netAmount = grossAmount - discountAmount

        // 4. Create Bill
        const [bill] = await Bill.create([{
            patientId: visit.patientId,
            emergencyVisitId: visit._id,
            billType: 'EMERGENCY',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 5. Create BillItems for PatientCharges
        for (const charge of unbilledCharges) {
            const chargeTotal = charge.amount + (charge._addonsTotal || 0)
            await BillItem.create([{
                billId: bill._id,
                itemType: charge.chargeCategoryId?.type === 'PROCEDURE' ? 'PROCEDURE' : 
                           charge.chargeCategoryId?.type === 'INVESTIGATION' ? 'INVESTIGATION' : 'OTHER',
                sourceModule: 'OTHER',
                description: charge.description,
                referenceId: charge._id,
                quantity: charge.quantity,
                rate: charge.rate,
                amount: chargeTotal,
                discountAmount: 0,
                netAmount: chargeTotal
            }], { session })

            charge.isBilled = true
            charge.billId = bill._id
            await charge.save({ session })
        }

        // 6. Create Discount record if discount is applied
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(visit.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: visit.patientId,
                employeeId: resolvedEmployeeId,
                discountType: discountType || 'CUSTOM',
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromDentalConsultation
// ---------------------------------------------------------------------------
exports.generateBillFromDentalConsultation = async (dentalAppointmentId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const appointment = await DentalAppointment.findById(dentalAppointmentId)
            .populate({ path: 'doctorId', select: 'fullName' })
            .session(session)
        if (!appointment) {
            const error = new Error('Dental appointment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const existingBill = await Bill.findOne({ dentalAppointmentId, billType: 'DENTAL_CONSULTATION' }).session(session)
        if (existingBill) {
            await session.abortTransaction()
            session.endSession()
            return existingBill
        }

        const grossAmount = appointment.consultationFee || 0
        const netAmount = grossAmount - discountAmount

        const [bill] = await Bill.create([{
            patientId: appointment.patientId,
            dentalAppointmentId: appointment._id,
            billType: 'DENTAL_CONSULTATION',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        await BillItem.create([{
            billId: bill._id,
            itemType: 'CONSULTATION',
            sourceModule: 'CONSULTATION',
            description: `Dental Consultation Fee - Dr. ${appointment.doctorId?.fullName || 'N/A'}`,
            quantity: 1,
            rate: grossAmount,
            amount: grossAmount,
            discountAmount: discountAmount,
            netAmount: netAmount
        }], { session })

        if (discountAmount > 0) {
            await Discount.create([{
                billId: bill._id,
                discountType,
                employeeId,
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromDentalAppointment

exports.generateBillFromDentalAppointment = async (dentalAppointmentId, userId, discountAmount = 0, discountType = 'CUSTOM', discountRemarks = null, employeeId = null, specificChargeId = null) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Fetch Dental appointment
        const appointment = await DentalAppointment.findById(dentalAppointmentId)
            .populate({ path: 'doctorId', select: 'fullName' })
            .session(session)
        if (!appointment) {
            const error = new Error('Dental appointment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // 2. Fetch unbilled PatientCharges
        const PatientCharge = require('../common/patient_charge.model')
        const query = { dentalAppointmentId, isBilled: false };
        if (specificChargeId) {
            query._id = specificChargeId;
        }

        const PatientChargeAddon = require('../common/patient_charge_addon.model')
        const unbilledCharges = await PatientCharge.find(query).populate('chargeCategoryId').session(session)

        let totalChargesAmount = 0
        for (const charge of unbilledCharges) {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id }).session(session)
            const addonsTotal = addons.reduce((sum, a) => sum + (a.amount || 0), 0)
            charge._addons = addons
            charge._addonsTotal = addonsTotal
            totalChargesAmount += charge.amount + addonsTotal
        }

        // 3. We only bill the dental procedures here. Consultation fee is handled separately.
        const grossAmount = totalChargesAmount
        
        if (grossAmount === 0 && unbilledCharges.length === 0) {
            const error = new Error('No unbilled charges found for this appointment')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const netAmount = grossAmount - discountAmount

        // 4. Create Bill
        const [bill] = await Bill.create([{
            patientId: appointment.patientId,
            dentalAppointmentId: appointment._id,
            billType: 'DENTAL',
            grossAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // 5. Consultation fee is no longer included in this bill.

        // 6. Create BillItems for unbilled charges
        for (const charge of unbilledCharges) {
            await BillItem.create([{
                billId: bill._id,
                itemType: 'PROCEDURE',
                sourceModule: 'OTHER',
                description: charge.description,
                referenceId: charge._id,
                quantity: charge.quantity,
                rate: charge.rate,
                amount: charge.amount + (charge._addonsTotal || 0),
                discountAmount: 0,
                netAmount: charge.amount + (charge._addonsTotal || 0)
            }], { session })
            
            // Mark as billed
            charge.isBilled = true
            charge.billId = bill._id
            await charge.save({ session })
        }

        // Handle total discount proportionally on items if needed (skipping for simplicity, just putting it on bill model)

        // 7. Update Dental Appointment reference
        if (appointment.paymentStatus !== 'Paid') {
            appointment.paymentStatus = 'Unpaid'
            await appointment.save({ session })
        }

        // 8. Handle Discount Model
        if (discountAmount > 0) {
            const resolvedEmployeeId = await resolveDiscountEmployee(appointment.patientId, employeeId, session)
            await Discount.create([{
                billId: bill._id,
                patientId: appointment.patientId,
                discountType,
                originalAmount: grossAmount,
                discountAmount,
                netAmount,
                appliedBy: userId,
                remarks: discountRemarks || 'Discount applied during bill generation'
            }], { session })
        }

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}


// ---------------------------------------------------------------------------
// processBillPayment
// ---------------------------------------------------------------------------
exports.processBillPayment = async (billId, paymentData, userId) => {
    const { amount, paymentMode, transactionNo, remarks } = paymentData

    // Pre-transaction validations (read-only)
    const bill = await Bill.findById(billId)
    if (!bill) {
        const error = new Error('Bill not found')
        error.status = STATUS_CODES.NOT_FOUND
        throw error
    }
    if (bill.status === 'PAID') {
        const error = new Error('Bill is already paid')
        error.status = STATUS_CODES.BAD_REQUEST
        throw error
    }
    if (amount <= 0) {
        const error = new Error('Payment amount must be greater than zero')
        error.status = STATUS_CODES.BAD_REQUEST
        throw error
    }
    if (amount > bill.balanceAmount) {
        const error = new Error('Payment amount exceeds balance amount')
        error.status = STATUS_CODES.BAD_REQUEST
        throw error
    }

    // Generate sequential payment number (counter update is outside session
    // since findByIdAndUpdate with upsert doesn't participate well in transactions)
    const d = new Date()
    const yy = String(d.getFullYear()).slice(-2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const prefix = `EH-PAY-${yy}${mm}${dd}`

    const counter = await Counter.findByIdAndUpdate(
        { _id: prefix },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    )
    const seqStr = String(counter.seq).padStart(4, '0')
    const paymentNo = `${prefix}-${seqStr}`

    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // Re-fetch bill inside transaction for consistent state
        const txBill = await Bill.findById(billId).session(session)

        // Create Payment record
        const [payment] = await Payment.create([{
            paymentNo,
            billId: txBill._id,
            patientId: txBill.patientId,
            amount,
            paymentMode,
            transactionNo,
            remarks,
            receivedBy: userId,
            status: 'SUCCESS'
        }], { session })

        // Update Bill financial numbers and status
        txBill.paidAmount += amount
        txBill.balanceAmount = txBill.netAmount - txBill.paidAmount
        txBill.status = txBill.balanceAmount === 0 ? 'PAID' : 'PARTIALLY_PAID'
        await txBill.save({ session })

        // Consume Advance Deposit if applicable
        if (paymentMode === 'ADVANCE_DEPOSIT' && txBill.billType === 'IPD') {
            const AdmissionAdvance = require('../clinical/ipd/admission_advance.model')
            const admission = await mongoose.model('Admission').findById(txBill.admissionId).session(session)
            if (admission) {
                const advance = new AdmissionAdvance({
                    admissionId: admission._id,
                    patientId: admission.patientId,
                    amount: -amount,
                    paymentMode: 'CASH', // Since ADVANCE_DEPOSIT isn't in the schema enum, we can use CASH and add a clear remark
                    referenceNo: txBill.billNo,
                    remarks: `Deposit consumed for Bill No. ${txBill.billNo}`,
                    receivedBy: userId
                })
                await advance.save({ session })
            }
        }

        // Sync LabOrder
        if (txBill.billType === 'LAB' && txBill.labOrderId) {
            const order = await LabOrder.findById(txBill.labOrderId).session(session)
            if (order) {
                order.paymentStatus = txBill.status === 'PAID' ? 'PAID' : 'PARTIAL'
                await order.save({ session })

                // If fully PAID and linked to an admission, record as IPD patient charge
                if (order.paymentStatus === 'PAID' && order.admissionId) {
                    const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')
                    const PatientCharge = require('../common/patient_charge.model')
                    const PatientChargeAddon = require('../common/patient_charge_addon.model')

                    const labCategory = await ChargeCategory.findOne({ code: 'LAB' }).session(session)
                    const orderItems = await LabOrderItem.find({ orderId: order._id }).session(session)

                    for (const item of orderItems) {
                        const existingCharge = await PatientCharge.findOne({
                            admissionId: order.admissionId,
                            sourceId: item._id
                        }).session(session)

                        if (!existingCharge) {
                            const [charge] = await PatientCharge.create([{
                                admissionId: order.admissionId,
                                sourceType: 'LAB',
                                patientId: order.patientId,
                                doctorId: null,
                                chargeCategoryId: labCategory?._id,
                                description: item.testName,
                                sourceId: item._id,
                                quantity: item.quantity || 1,
                                rate: item.rate,
                                amount: item.amount,
                                billId: txBill._id,
                                isBilled: true,
                                createdBy: userId || null,
                                updatedBy: userId || null
                            }], { session })
                        }
                    }
                }
            }
        }

        // Sync RadiologyOrder
        if (txBill.billType === 'RADIOLOGY' && txBill.radiologyOrderId) {
            const order = await RadiologyOrder.findById(txBill.radiologyOrderId).session(session)
            if (order) {
                order.paymentStatus = txBill.status === 'PAID' ? 'PAID' : 'PARTIAL'
                await order.save({ session })

                // If fully PAID and linked to an admission, record as IPD patient charge
                if (order.paymentStatus === 'PAID' && order.admissionId) {
                    const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')
                    const PatientCharge = require('../common/patient_charge.model')
                    const PatientChargeAddon = require('../common/patient_charge_addon.model')

                    const radCategory = await ChargeCategory.findOne({ code: 'RADIOLOGY' }).session(session)
                    const orderItems = await RadiologyOrderItem.find({ orderId: order._id })
                        .populate('radiologyTestId', 'name')
                        .session(session)

                    for (const item of orderItems) {
                        const existingCharge = await PatientCharge.findOne({
                            admissionId: order.admissionId,
                            sourceId: item._id
                        }).session(session)

                        if (!existingCharge) {
                            const testName = item.radiologyTestId?.name || 'Radiology Test'
                            const [charge] = await PatientCharge.create([{
                                admissionId: order.admissionId,
                                sourceType: 'RADIOLOGY',
                                patientId: order.patientId,
                                doctorId: null,
                                chargeCategoryId: radCategory?._id,
                                description: testName,
                                sourceId: item._id,
                                quantity: 1,
                                rate: item.rate,
                                amount: item.amount,
                                billId: txBill._id,
                                isBilled: true,
                                createdBy: userId || null,
                                updatedBy: userId || null
                            }], { session })
                        }
                    }
                }
            }
        }

        // Sync OpdAppointment
        if (txBill.billType === 'OPD' && txBill.opdAppointmentId) {
            const appointment = await OpdAppointment.findById(txBill.opdAppointmentId).session(session)
            if (appointment) {
                appointment.paymentStatus = txBill.status === 'PAID' ? 'Paid' : 'Unpaid'
                if (txBill.status === 'PAID') {
                    appointment.status = 'Booked'
                } else {
                    appointment.status = 'Draft'
                }
                await appointment.save({ session })
            }
        }

        // Sync DentalAppointment (Only for Consultation Bills)
        if (txBill.billType === 'DENTAL_CONSULTATION' && txBill.dentalAppointmentId) {
            const DentalAppointment = require('../dental/dental_appointment.model')
            const appointment = await DentalAppointment.findById(txBill.dentalAppointmentId).session(session)
            if (appointment) {
                appointment.paymentStatus = txBill.status === 'PAID' ? 'Paid' : 'Unpaid'
                if (txBill.status === 'PAID') {
                    appointment.status = 'Booked'
                } else {
                    appointment.status = 'Draft'
                }
                await appointment.save({ session })
            }
        }

        // Sync EmergencyVisit
        if (txBill.emergencyVisitId && (txBill.billType === 'EMERGENCY' || txBill.billType === 'EMERGENCY_CONSULTATION')) {
            const visit = await mongoose.model('EmergencyVisit').findById(txBill.emergencyVisitId).session(session)
            if (visit) {
                if (txBill.billType === 'EMERGENCY_CONSULTATION') {
                    if (txBill.status === 'PAID') visit.paymentStatus = 'Partially Paid'
                    else if (visit.paymentStatus === 'Partially Paid') visit.paymentStatus = 'Unpaid'
                } else if (txBill.billType === 'EMERGENCY') {
                    if (txBill.status === 'PAID') visit.paymentStatus = 'Paid'
                    else if (visit.paymentStatus === 'Paid') visit.paymentStatus = 'Partially Paid'
                }
                await visit.save({ session })
            }
        }

        await session.commitTransaction()
        session.endSession()
        return { bill: txBill, payment }
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// getBillById (read-only, no transaction needed)
// ---------------------------------------------------------------------------
exports.getBillById = async (billId) => {
    const bill = await Bill.findById(billId).populate('patientId').populate('generatedBy', 'fullName email')
    if (!bill) {
        const error = new Error('Bill not found')
        error.status = STATUS_CODES.NOT_FOUND
        throw error
    }
    const items = await BillItem.find({ billId })
    const payments = await Payment.find({ billId }).populate('receivedBy', 'fullName')
    return {
        ...bill.toObject(),
        items,
        payments
    }
}

// ---------------------------------------------------------------------------
// cancelBill
// ---------------------------------------------------------------------------
exports.cancelBill = async (billId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const bill = await Bill.findById(billId).session(session)
        if (!bill) {
            const error = new Error('Bill not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Validate that no active/successful payments have been made
        const payments = await Payment.find({ billId, status: 'SUCCESS' }).session(session)
        if (payments.length > 0) {
            const error = new Error('Cannot cancel bill as active payments have already been processed')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Revert associated laboratory order status
        if (bill.billType === 'LAB' && bill.labOrderId) {
            const order = await LabOrder.findById(bill.labOrderId).session(session)
            if (order) {
                order.billId = null
                order.paymentStatus = 'UNPAID'
                await order.save({ session })
            }
        }

        // Revert associated radiology order status
        if (bill.billType === 'RADIOLOGY' && bill.radiologyOrderId) {
            const order = await RadiologyOrder.findById(bill.radiologyOrderId).session(session)
            if (order) {
                order.billId = null
                order.paymentStatus = 'UNPAID'
                await order.save({ session })
            }
        }

        // Revert associated OPD appointment status
        if (bill.billType === 'OPD' && bill.opdAppointmentId) {
            const appointment = await OpdAppointment.findById(bill.opdAppointmentId).session(session)
            if (appointment) {
                appointment.paymentStatus = 'Unpaid'
                appointment.status = 'Draft'
                await appointment.save({ session })
            }
        }

        // Revert associated Dental appointment status (Only for Consultation Bills)
        if (bill.billType === 'DENTAL_CONSULTATION' && bill.dentalAppointmentId) {
            const DentalAppointment = require('../dental/dental_appointment.model')
            const appointment = await DentalAppointment.findById(bill.dentalAppointmentId).session(session)
            if (appointment) {
                appointment.paymentStatus = 'Unpaid'
                appointment.status = 'Draft'
                await appointment.save({ session })
            }
        }

        // Revert associated Emergency visit status
        if (bill.emergencyVisitId && (bill.billType === 'EMERGENCY' || bill.billType === 'EMERGENCY_CONSULTATION')) {
            const visit = await mongoose.model('EmergencyVisit').findById(bill.emergencyVisitId).session(session)
            if (visit) {
                if (bill.billType === 'EMERGENCY') {
                    visit.paymentStatus = 'Partially Paid' // Fallback to Partially Paid since Consultation might be paid
                } else if (bill.billType === 'EMERGENCY_CONSULTATION') {
                    visit.paymentStatus = 'Unpaid'
                }
                await visit.save({ session })
            }
        }

        // Revert associated IPD PatientCharges status
        const PatientChargeModel = require('../common/patient_charge.model')
        await PatientChargeModel.updateMany(
            { billId: bill._id },
            { $set: { isBilled: false, billId: null } },
            { session }
        )

        // Delete bill items, discounts, and the bill
        await BillItem.deleteMany({ billId }).session(session)
        await Discount.deleteMany({ billId }).session(session)
        await Bill.findByIdAndDelete(billId).session(session)

        await session.commitTransaction()
        session.endSession()
        return true
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// cancelPayment
// ---------------------------------------------------------------------------
exports.cancelPayment = async (paymentId, userId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const payment = await Payment.findById(paymentId).session(session)
        if (!payment) {
            const error = new Error('Payment record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (payment.status === 'CANCELLED' || payment.status === 'REFUNDED') {
            const error = new Error('Payment has already been cancelled or refunded')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Cancel the payment
        payment.status = 'CANCELLED'
        await payment.save({ session })

        // Update associated Bill
        const bill = await Bill.findById(payment.billId).session(session)
        if (bill) {
            bill.paidAmount = Math.max(0, bill.paidAmount - payment.amount)
            bill.balanceAmount = bill.netAmount - bill.paidAmount
            bill.status = bill.paidAmount === 0 ? 'DRAFT' : 'PARTIALLY_PAID'
            await bill.save({ session })

            // Sync LabOrder
            if (bill.billType === 'LAB' && bill.labOrderId) {
                const order = await LabOrder.findById(bill.labOrderId).session(session)
                if (order) {
                    order.paymentStatus = bill.paidAmount === 0 ? 'UNPAID' : 'PARTIAL'
                    await order.save({ session })

                    // If order payment status is no longer PAID, remove IPD charges
                    if (order.admissionId) {
                        const PatientCharge = require('../common/patient_charge.model')
                        const PatientChargeAddon = require('../common/patient_charge_addon.model')

                        const charges = await PatientCharge.find({
                            admissionId: order.admissionId,
                            billId: bill._id
                        }).session(session)

                        const chargeIds = charges.map(c => c._id)

                        await PatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session)
                        await PatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session)
                    }
                }
            }

            // Sync RadiologyOrder
            if (bill.billType === 'RADIOLOGY' && bill.radiologyOrderId) {
                const order = await RadiologyOrder.findById(bill.radiologyOrderId).session(session)
                if (order) {
                    order.paymentStatus = bill.paidAmount === 0 ? 'UNPAID' : 'PARTIAL'
                    await order.save({ session })

                    // If order payment status is no longer PAID, remove IPD charges
                    if (order.admissionId) {
                        const PatientCharge = require('../common/patient_charge.model')
                        const PatientChargeAddon = require('../common/patient_charge_addon.model')

                        const charges = await PatientCharge.find({
                            admissionId: order.admissionId,
                            billId: bill._id
                        }).session(session)

                        const chargeIds = charges.map(c => c._id)

                        await PatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session)
                        await PatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session)
                    }
                }
            }

            // Sync OpdAppointment
            if (bill.billType === 'OPD' && bill.opdAppointmentId) {
                const appointment = await OpdAppointment.findById(bill.opdAppointmentId).session(session)
                if (appointment) {
                    appointment.paymentStatus = bill.status === 'PAID' ? 'Paid' : 'Unpaid'
                    appointment.status = bill.status === 'PAID' ? 'Booked' : 'Draft'
                    await appointment.save({ session })
                }
            }

            // Sync DentalAppointment (Only for Consultation Bills)
            if (bill.billType === 'DENTAL_CONSULTATION' && bill.dentalAppointmentId) {
                const DentalAppointment = require('../dental/dental_appointment.model')
                const appointment = await DentalAppointment.findById(bill.dentalAppointmentId).session(session)
                if (appointment) {
                    appointment.paymentStatus = bill.status === 'PAID' ? 'Paid' : 'Unpaid'
                    appointment.status = bill.status === 'PAID' ? 'Booked' : 'Draft'
                    await appointment.save({ session })
                }
            }

            // Sync EmergencyVisit
            if (bill.emergencyVisitId && (bill.billType === 'EMERGENCY' || bill.billType === 'EMERGENCY_CONSULTATION')) {
                const visit = await mongoose.model('EmergencyVisit').findById(bill.emergencyVisitId).session(session)
                if (visit) {
                    if (bill.billType === 'EMERGENCY_CONSULTATION') {
                        visit.paymentStatus = bill.status === 'PAID' ? 'Partially Paid' : 'Unpaid'
                    } else if (bill.billType === 'EMERGENCY') {
                        visit.paymentStatus = bill.status === 'PAID' ? 'Paid' : 'Partially Paid'
                    }
                    await visit.save({ session })
                }
            }
        }

        await session.commitTransaction()
        session.endSession()
        return payment
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// generateBillFromIpdCharges

exports.generateBillFromIpdCharges = async (admissionId, chargeIds, userId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const Admission = require('../clinical/ipd/admission.model')
        const admission = await Admission.findById(admissionId).session(session)
        if (!admission) {
            const error = new Error('Admission not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const PatientCharge = require('../common/patient_charge.model')
        const PatientChargeAddon = require('../common/patient_charge_addon.model')
        
        // Fetch the specific charges that are unbilled
        const query = { _id: { $in: chargeIds }, admissionId, isBilled: false }
        const unbilledCharges = await PatientCharge.find(query).populate('chargeCategoryId').session(session)

        if (unbilledCharges.length === 0) {
            const error = new Error('No unbilled charges found for the provided selection')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        let totalGrossAmount = 0
        const billItemsData = []

        for (const charge of unbilledCharges) {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id }).session(session)
            const addonsTotal = addons.reduce((sum, a) => sum + (a.amount || 0), 0)
            
            const itemAmount = charge.amount + addonsTotal
            totalGrossAmount += itemAmount

            billItemsData.push({
                itemType: 'OTHER', // Can be refined based on sourceType later
                sourceModule: 'OTHER',
                referenceId: charge._id,
                description: charge.description || 'IPD Charge',
                quantity: charge.quantity || 1,
                rate: charge.rate,
                amount: itemAmount,
                discountAmount: 0,
                netAmount: itemAmount,
                patientChargeId: charge._id
            })
        }

        // Create the Bill
        const [bill] = await Bill.create([{
            patientId: admission.patientId,
            admissionId: admission._id,
            billType: 'IPD',
            grossAmount: totalGrossAmount,
            discountAmount: 0,
            netAmount: totalGrossAmount,
            paidAmount: 0,
            balanceAmount: totalGrossAmount,
            status: 'DRAFT',
            generatedBy: userId,
            generatedAt: new Date()
        }], { session })

        // Assign billId to the bill items
        billItemsData.forEach(item => {
            item.billId = bill._id
        })

        await BillItem.insertMany(billItemsData, { session })

        // Update PatientCharges to marked as billed
        const unbilledChargeIds = unbilledCharges.map(c => c._id)
        await PatientCharge.updateMany(
            { _id: { $in: unbilledChargeIds } },
            { $set: { isBilled: true, billId: bill._id } },
            { session }
        )

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}

// ---------------------------------------------------------------------------
// updateIpdBill
// ---------------------------------------------------------------------------
exports.updateIpdBill = async (billId, { chargeIds = [], discountAmount = 0 }, userId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const bill = await Bill.findById(billId).session(session)
        if (!bill) {
            const error = new Error('Bill not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const PatientCharge = require('../common/patient_charge.model')
        const PatientChargeAddon = require('../common/patient_charge_addon.model')

        // Revert previously billed charges for this bill
        await PatientCharge.updateMany(
            { billId: bill._id },
            { $set: { isBilled: false, billId: null } },
            { session }
        )

        // Delete existing BillItems
        await BillItem.deleteMany({ billId: bill._id }).session(session)

        // Fetch selected charges
        const charges = await PatientCharge.find({ _id: { $in: chargeIds }, admissionId: bill.admissionId }).session(session)
        if (charges.length === 0) {
            const error = new Error('Please select at least one charge for the bill')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        let totalGrossAmount = 0
        const billItemsData = []

        for (const charge of charges) {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id }).session(session)
            const addonsTotal = addons.reduce((sum, a) => sum + (a.amount || 0), 0)
            
            const itemAmount = charge.amount + addonsTotal
            totalGrossAmount += itemAmount

            billItemsData.push({
                billId: bill._id,
                itemType: 'OTHER',
                sourceModule: 'OTHER',
                referenceId: charge._id,
                description: charge.description || 'IPD Charge',
                quantity: charge.quantity || 1,
                rate: charge.rate,
                amount: itemAmount,
                discountAmount: 0,
                netAmount: itemAmount,
                patientChargeId: charge._id
            })
        }

        await BillItem.insertMany(billItemsData, { session })

        // Mark charges as billed
        const selectedIds = charges.map(c => c._id)
        await PatientCharge.updateMany(
            { _id: { $in: selectedIds } },
            { $set: { isBilled: true, billId: bill._id } },
            { session }
        )

        const finalDiscount = Number(discountAmount || 0)
        const netAmt = Math.max(0, totalGrossAmount - finalDiscount)

        bill.grossAmount = totalGrossAmount
        bill.discountAmount = finalDiscount
        bill.netAmount = netAmt
        bill.balanceAmount = Math.max(0, netAmt - (bill.paidAmount || 0))
        await bill.save({ session })

        await session.commitTransaction()
        session.endSession()
        return bill
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        throw err
    }
}
