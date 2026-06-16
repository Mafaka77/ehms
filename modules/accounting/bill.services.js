const mongoose = require('mongoose')
const Bill = require('./bill.model')
const BillItem = require('./bill_item.model')
const Payment = require('./payment.model')
const LabOrder = require('../laboratory/lab_order.model')
const LabOrderItem = require('../laboratory/lab_order_item.model')
const RadiologyOrder = require('../radiology/radiology_order.model')
const RadiologyOrderItem = require('../radiology/radiology_order_item.model')
const OpdAppointment = require('../clinical/opd/opd_appointment.model')
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
        const existingBill = await Bill.findOne({ emergencyVisitId }).session(session)
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

        // 4. Create BillItem
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

        // Sync LabOrder
        if (txBill.billType === 'LAB' && txBill.labOrderId) {
            const order = await LabOrder.findById(txBill.labOrderId).session(session)
            if (order) {
                order.paymentStatus = txBill.status === 'PAID' ? 'PAID' : 'PARTIAL'
                await order.save({ session })

                // If fully PAID and linked to an admission, record as IPD patient charge
                if (order.paymentStatus === 'PAID' && order.admissionId) {
                    const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')
                    const IpdPatientCharge = require('../clinical/ipd/ipd_patient_charge.model')
                    const IpdPatientChargeAddon = require('../clinical/ipd/ipd_patient_charge_addon.model')

                    const labCategory = await ChargeCategory.findOne({ code: 'LAB' }).session(session)
                    const orderItems = await LabOrderItem.find({ orderId: order._id }).session(session)

                    for (const item of orderItems) {
                        const existingCharge = await IpdPatientCharge.findOne({
                            admissionId: order.admissionId,
                            sourceId: item._id
                        }).session(session)

                        if (!existingCharge) {
                            const [charge] = await IpdPatientCharge.create([{
                                admissionId: order.admissionId,
                                patientId: order.patientId,
                                doctorId: null,
                                chargeCategoryId: labCategory?._id,
                                description: item.testName,
                                sourceId: item._id,
                                quantity: item.quantity || 1,
                                rate: item.rate,
                                amount: item.amount,
                                billId: txBill._id,
                                isBilled: true
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
                    const IpdPatientCharge = require('../clinical/ipd/ipd_patient_charge.model')
                    const IpdPatientChargeAddon = require('../clinical/ipd/ipd_patient_charge_addon.model')

                    const radCategory = await ChargeCategory.findOne({ code: 'RADIOLOGY' }).session(session)
                    const orderItems = await RadiologyOrderItem.find({ orderId: order._id })
                        .populate('radiologyTestId', 'name')
                        .session(session)

                    for (const item of orderItems) {
                        const existingCharge = await IpdPatientCharge.findOne({
                            admissionId: order.admissionId,
                            sourceId: item._id
                        }).session(session)

                        if (!existingCharge) {
                            const testName = item.radiologyTestId?.name || 'Radiology Test'
                            const [charge] = await IpdPatientCharge.create([{
                                admissionId: order.admissionId,
                                patientId: order.patientId,
                                doctorId: null,
                                chargeCategoryId: radCategory?._id,
                                description: testName,
                                sourceId: item._id,
                                quantity: 1,
                                rate: item.rate,
                                amount: item.amount,
                                billId: txBill._id,
                                isBilled: true
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
                // Normalize paymentMode to match OpdAppointment enum: 'Cash' | 'Card' | 'UPI'
                // const paymentModeMap = { CASH: 'Cash', CARD: 'Card', UPI: 'UPI' }
                appointment.paymentStatus = txBill.status === 'PAID' ? 'Paid' : 'Unpaid'
                if (txBill.status === 'PAID') {
                    appointment.status = 'Booked'
                } else {
                    appointment.status = 'Draft'
                }
                // appointment.paymentMode = 'Cash'
                await appointment.save({ session })
            }
        }

        // Sync EmergencyVisit
        if (txBill.billType === 'EMERGENCY' && txBill.emergencyVisitId) {
            const visit = await mongoose.model('EmergencyVisit').findById(txBill.emergencyVisitId).session(session)
            if (visit) {
                visit.paymentStatus = txBill.status === 'PAID' ? 'Paid' : 'Unpaid'
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

        // Revert associated Emergency visit status
        if (bill.billType === 'EMERGENCY' && bill.emergencyVisitId) {
            const visit = await mongoose.model('EmergencyVisit').findById(bill.emergencyVisitId).session(session)
            if (visit) {
                visit.paymentStatus = 'Unpaid'
                await visit.save({ session })
            }
        }

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
                        const IpdPatientCharge = require('../clinical/ipd/ipd_patient_charge.model')
                        const IpdPatientChargeAddon = require('../clinical/ipd/ipd_patient_charge_addon.model')

                        const charges = await IpdPatientCharge.find({
                            admissionId: order.admissionId,
                            billId: bill._id
                        }).session(session)

                        const chargeIds = charges.map(c => c._id)

                        await IpdPatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session)
                        await IpdPatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session)
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
                        const IpdPatientCharge = require('../clinical/ipd/ipd_patient_charge.model')
                        const IpdPatientChargeAddon = require('../clinical/ipd/ipd_patient_charge_addon.model')

                        const charges = await IpdPatientCharge.find({
                            admissionId: order.admissionId,
                            billId: bill._id
                        }).session(session)

                        const chargeIds = charges.map(c => c._id)

                        await IpdPatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session)
                        await IpdPatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session)
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

            // Sync EmergencyVisit
            if (bill.billType === 'EMERGENCY' && bill.emergencyVisitId) {
                const visit = await mongoose.model('EmergencyVisit').findById(bill.emergencyVisitId).session(session)
                if (visit) {
                    visit.paymentStatus = bill.status === 'PAID' ? 'Paid' : 'Unpaid'
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
