const Radiology = require('./radiology.model')
const RadiologyTest = require('./radiology_test.model')
const RadiologyOrder = require('./radiology_order.model')
const RadiologyOrderItem = require('./radiology_order_item.model')
const STATUS_CODES = require('../../utils/statuscode')
const Employee = require('../hr/employee.model')

exports.createRadiology = async (data) => {
    try {
        const existing = await Radiology.findOne({ $or: [{ name: data.name }, { code: data.code }] })
        if (existing) {
            const error = new Error('Radiology category with this name or code already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const radiology = await Radiology.create(data)
        return radiology
    } catch (error) {
        throw error
    }
}

exports.getAllRadiologies = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            }
        }

        const total = await Radiology.countDocuments(filter)
        const radiologies = await Radiology.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            radiologies,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        throw error
    }
}

exports.getRadiologyById = async (id) => {
    try {
        const radiology = await Radiology.findById(id)
        if (!radiology) {
            const error = new Error('Radiology category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return radiology
    } catch (error) {
        throw error
    }
}

exports.updateRadiology = async (id, data) => {
    try {
        const radiology = await Radiology.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!radiology) {
            const error = new Error('Radiology category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return radiology
    } catch (error) {
        throw error
    }
}

exports.deleteRadiology = async (id) => {
    try {
        const radiology = await Radiology.findByIdAndDelete(id)
        if (!radiology) {
            const error = new Error('Radiology category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return radiology
    } catch (error) {
        throw error
    }
}

// ==========================================
// RadiologyTest Services
// ==========================================

exports.createRadiologyTest = async (data) => {
    try {
        const existing = await RadiologyTest.findOne({ code: data.code })
        if (existing) {
            const error = new Error('A radiology test with this code already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const test = await RadiologyTest.create(data)
        return test
    } catch (error) {
        throw error
    }
}

exports.getAllRadiologyTests = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) === 0 ? 0 : (parseInt(query.limit) || 20)
        const search = query.search || ''
        const radiologyId = query.radiologyId || null

        let filter = {}
        if (radiologyId) {
            filter.radiologyId = radiologyId
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ]
        }

        const total = await RadiologyTest.countDocuments(filter)
        let queryChain = RadiologyTest.find(filter)
            .populate('radiologyId', 'name code')
            .sort({ createdAt: -1 })

        if (limit > 0) {
            const skip = (page - 1) * limit
            queryChain = queryChain.skip(skip).limit(limit)
        }

        const tests = await queryChain

        return {
            tests,
            pagination: {
                total,
                page,
                limit,
                pages: limit > 0 ? Math.ceil(total / limit) : 1
            }
        }
    } catch (error) {
        throw error
    }
}

exports.getRadiologyTestById = async (id) => {
    try {
        const test = await RadiologyTest.findById(id).populate('radiologyId', 'name code')
        if (!test) {
            const error = new Error('Radiology test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

exports.updateRadiologyTest = async (id, data) => {
    try {
        const test = await RadiologyTest.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!test) {
            const error = new Error('Radiology test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

exports.deleteRadiologyTest = async (id) => {
    try {
        const test = await RadiologyTest.findByIdAndDelete(id)
        if (!test) {
            const error = new Error('Radiology test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

// ==========================================
// RadiologyOrder Services
// ==========================================

exports.createRadiologyOrder = async (data, userId) => {
    const session = await RadiologyOrder.startSession()
    session.startTransaction()
    try {
        const { tests = [], ...orderData } = data || {}

        // Sanitize optional ObjectId fields
        const fields = ['opdAppointmentId', 'admissionId', 'emergencyVisitId', 'doctorId', 'performedById']
        for (const field of fields) {
            if (orderData[field] === '' || orderData[field] === undefined) {
                orderData[field] = null
            }
        }
        if (orderData.referral === 'Self') {
            orderData.doctorId = null
        }

        const order = new RadiologyOrder({
            ...orderData,
            paymentStatus: orderData.admissionId ? 'IPD' : 'UNPAID',
            status: 'ORDERED',
            createdBy: userId || null
        })
        await order.save({ session })

        let totalAmount = 0
        const items = []
        const testList = Array.isArray(tests) ? tests : []
        for (const t of testList) {
            if (!t || !t.testId) continue
            const test = await RadiologyTest.findById(t.testId).session(session)
            if (!test) continue
            const amount = test.rate || 0
            totalAmount += amount
            items.push({
                orderId: order._id,
                radiologyTestId: test._id,
                rate: test.rate || 0,
                amount
            })
        }

        let insertedItems = []
        if (items.length > 0) {
            insertedItems = await RadiologyOrderItem.insertMany(items, { session })
        }

        order.totalAmount = totalAmount
        await order.save({ session })

        if (orderData.admissionId && insertedItems.length > 0) {
            const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')
            const PatientCharge = require('../common/patient_charge.model')

            const radCategory = await ChargeCategory.findOne({ code: 'RADIOLOGY' }).session(session)

            for (const dbItem of insertedItems) {
                const test = await RadiologyTest.findById(dbItem.radiologyTestId).session(session)
                const testName = test ? test.name : 'Radiology Test'

                await PatientCharge.create([{
                    admissionId: orderData.admissionId || null,
                    emergencyVisitId: orderData.emergencyVisitId || null,
                    dentalAppointmentId: orderData.dentalAppointmentId || null,
                    sourceType: 'RADIOLOGY',
                    patientId: orderData.patientId,
                    chargeCategoryId: radCategory?._id || null,
                    description: testName,
                    sourceId: dbItem._id,
                    quantity: 1,
                    rate: dbItem.rate || 0,
                    amount: dbItem.amount || 0,
                    isBilled: false,
                    createdBy: userId || null,
                    updatedBy: userId || null
                }], { session })
            }
        }

        await session.commitTransaction()
        session.endSession()
        return order
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

exports.getAllRadiologyOrders = async (query = {}) => {
    try {
        const mongoose = require('mongoose')
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) === 0 ? 0 : (parseInt(query.limit) || 10)
        const search = query.search ? query.search.trim() : ''
        const paymentStatus = query.paymentStatus || ''
        const skip = (page - 1) * (limit || 1)

        let filter = {}
        if (search) {
            const searchRegex = new RegExp(search, 'i')
            const Patient = mongoose.model('Patient')
            const matchingPatients = await Patient.find({
                $or: [
                    { fullName: searchRegex },
                    { patientCode: searchRegex },
                    { mobileNo: searchRegex }
                ]
            }).select('_id')
            const patientIds = matchingPatients.map(p => p._id)

            filter.$or = [
                { orderNo: searchRegex },
                { patientId: { $in: patientIds } }
            ]
        }
        if (paymentStatus) {
            filter.paymentStatus = paymentStatus
        }
        if (query.admissionId) {
            if (query.admissionId === 'null') {
                filter.admissionId = null
            } else if (query.admissionId === 'not-null') {
                filter.admissionId = { $ne: null }
            } else {
                filter.admissionId = query.admissionId
            }
        }
        if (query.patientId) {
            filter.patientId = query.patientId
        }

        if (query.startDate || query.endDate) {
            filter.createdAt = filter.createdAt || {}
            if (query.startDate) {
                const sStr = String(query.startDate).trim()
                if (/^\d{4}-\d{2}-\d{2}$/.test(sStr)) {
                    const [y, m, d] = sStr.split('-').map(Number)
                    filter.createdAt.$gte = new Date(y, m - 1, d, 0, 0, 0, 0)
                } else {
                    filter.createdAt.$gte = new Date(query.startDate)
                }
            }
            if (query.endDate) {
                const eStr = String(query.endDate).trim()
                if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
                    const [y, m, d] = eStr.split('-').map(Number)
                    filter.createdAt.$lte = new Date(y, m - 1, d, 23, 59, 59, 999)
                } else {
                    const end = new Date(query.endDate)
                    end.setHours(23, 59, 59, 999)
                    filter.createdAt.$lte = end
                }
            }
        }

        const total = await RadiologyOrder.countDocuments(filter)
        let queryExec = RadiologyOrder.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo')
            .populate('doctorId', 'fullName doctorCode')
            .populate('performedById', 'fullName doctorCode')
            .sort({ createdAt: -1 })

        if (limit > 0) {
            queryExec = queryExec.skip(skip).limit(limit)
        }

        const orders = await queryExec

        const orderIds = orders.map(o => o._id)
        const allItems = await RadiologyOrderItem.find({ orderId: { $in: orderIds } }).populate('radiologyTestId', 'name code rate')

        const itemsByOrderId = {}
        allItems.forEach(item => {
            const oid = item.orderId ? item.orderId.toString() : ''
            if (oid) {
                if (!itemsByOrderId[oid]) itemsByOrderId[oid] = []
                itemsByOrderId[oid].push(item)
            }
        })

        const ordersWithItems = orders.map(o => {
            const obj = o.toObject()
            obj.items = itemsByOrderId[o._id.toString()] || []
            return obj
        })

        return {
            orders: ordersWithItems,
            pagination: {
                total,
                page,
                limit: limit > 0 ? limit : total,
                pages: limit > 0 ? Math.ceil(total / limit) : 1
            }
        }
    } catch (error) {
        throw error
    }
}

exports.getRadiologyOrderById = async (id) => {
    try {
        const order = await RadiologyOrder.findById(id)
            .populate('patientId')
            .populate('doctorId', 'fullName doctorCode')
            .populate('performedById', 'fullName doctorCode')
            .populate('createdBy', 'email')

        if (!order) {
            const error = new Error('Radiology order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const items = await RadiologyOrderItem.find({ orderId: id })
            .populate('radiologyTestId', 'name code rate')

        const orderObj = order.toObject()

        // Check if the patient matches an active employee record
        if (orderObj.patientId) {
            const mobileStr = orderObj.patientId.mobileNo ? String(orderObj.patientId.mobileNo).replace(/\D/g, '') : ''
            const phoneNum = Number(mobileStr)
            const query = []
            if (mobileStr && !isNaN(phoneNum)) {
                query.push({ mobile: phoneNum })
            }
            if (orderObj.patientId.email) {
                query.push({ email: orderObj.patientId.email })
            }
            if (query.length > 0) {
                const employee = await Employee.findOne({ $or: query, isActive: true })
                if (employee) {
                    orderObj.patientId.isEmployee = true
                    orderObj.patientId.employeeCode = employee.employeeCode
                    orderObj.patientId.employeeId = employee._id
                }
            }
        }

        return { order: orderObj, items }
    } catch (error) {
        throw error
    }
}

exports.updateRadiologyOrder = async (id, data) => {
    try {
        const updateData = { ...data }
        delete updateData.tests

        // Only sanitize empty string fields if explicitly passed in updateData
        const fields = ['opdAppointmentId', 'admissionId', 'emergencyVisitId', 'doctorId', 'performedById']
        for (const field of fields) {
            if (updateData[field] === '') {
                updateData[field] = null
            } else if (updateData[field] === undefined) {
                delete updateData[field]
            }
        }

        if (updateData.referral === 'Self') {
            updateData.doctorId = null
        }

        const order = await RadiologyOrder.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patientId', 'fullName patientCode mobileNo')
            .populate('doctorId', 'fullName doctorCode')
            .populate('performedById', 'fullName doctorCode')

        if (!order) {
            const error = new Error('Radiology order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return order
    } catch (error) {
        throw error
    }
}

exports.deleteRadiologyOrder = async (id) => {
    const session = await RadiologyOrder.startSession()
    session.startTransaction()
    try {
        const order = await RadiologyOrder.findById(id).session(session)
        if (!order) {
            const error = new Error('Radiology order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (order.admissionId) {
            const PatientCharge = require('../common/patient_charge.model')
            const PatientChargeAddon = require('../common/patient_charge_addon.model')

            const orderItems = await RadiologyOrderItem.find({ orderId: id }).session(session)
            const itemIds = orderItems.map(item => item._id)

            const charges = await PatientCharge.find({
                admissionId: order.admissionId,
                sourceId: { $in: itemIds }
            }).session(session)
            const chargeIds = charges.map(c => c._id)

            await PatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session)
            await PatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session)
        }

        await RadiologyOrderItem.deleteMany({ orderId: id }).session(session)
        await RadiologyOrder.findByIdAndDelete(id).session(session)

        await session.commitTransaction()
        session.endSession()
        return order
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}
