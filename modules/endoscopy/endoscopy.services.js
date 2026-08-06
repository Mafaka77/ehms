const EndoscopyCategory = require('./endoscopy_category.model')
const EndoscopyTest = require('./endoscopy_test.model')
const STATUS_CODES = require('../../utils/statuscode')

// --- Endoscopy Category Services ---

exports.createCategory = async (data) => {
    try {
        const category = new EndoscopyCategory(data)
        await category.save()
        return category
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('Category code already exists')
            err.status = STATUS_CODES.CONFLICT
            throw err
        }
        throw error
    }
}

exports.getAllCategories = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) === 0 ? 0 : (parseInt(query.limit) || 10)
        const search = query.search ? query.search.trim() : ''
        const skip = (page - 1) * (limit || 1)

        let filter = {}
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ]
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total = await EndoscopyCategory.countDocuments(filter)
        let queryExec = EndoscopyCategory.find(filter)
            .sort({ displayOrder: 1, name: 1 })

        if (limit > 0) {
            queryExec = queryExec.skip(skip).limit(limit)
        }

        const categories = await queryExec

        // Get test counts for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const testCount = await EndoscopyTest.countDocuments({ categoryId: cat._id })
                const catObj = cat.toObject()
                catObj.testCount = testCount
                return catObj
            })
        )

        return {
            categories: categoriesWithCount,
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

exports.getCategoryById = async (id) => {
    try {
        const category = await EndoscopyCategory.findById(id)
        if (!category) {
            const err = new Error('Endoscopy category not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        const testCount = await EndoscopyTest.countDocuments({ categoryId: id })
        const catObj = category.toObject()
        catObj.testCount = testCount
        return catObj
    } catch (error) {
        throw error
    }
}

exports.updateCategory = async (id, data) => {
    try {
        const category = await EndoscopyCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!category) {
            const err = new Error('Endoscopy category not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        return category
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('Category code already exists')
            err.status = STATUS_CODES.CONFLICT
            throw err
        }
        throw error
    }
}

exports.deleteCategory = async (id) => {
    try {
        const category = await EndoscopyCategory.findById(id)
        if (!category) {
            const err = new Error('Endoscopy category not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        await category.softDelete()
        // Soft delete associated tests
        await EndoscopyTest.updateMany({ categoryId: id }, { isDeleted: true, deletedAt: new Date() })
        return category
    } catch (error) {
        throw error
    }
}

// --- Endoscopy Test Services ---

exports.createTest = async (data) => {
    try {
        // Support categoryId or endoscopyId
        if (!data.categoryId && data.endoscopyId) {
            data.categoryId = data.endoscopyId
        }
        const test = new EndoscopyTest(data)
        await test.save()
        await test.populate('categoryId', 'name code')
        return test
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('Test code already exists')
            err.status = STATUS_CODES.CONFLICT
            throw err
        }
        throw error
    }
}

exports.getAllTests = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) === 0 ? 0 : (parseInt(query.limit) || 10)
        const search = query.search ? query.search.trim() : ''
        const categoryId = query.categoryId || query.endoscopyId || ''
        const skip = (page - 1) * (limit || 1)

        let filter = {}
        if (categoryId) {
            filter.categoryId = categoryId
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ]
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total = await EndoscopyTest.countDocuments(filter)
        let queryExec = EndoscopyTest.find(filter)
            .populate('categoryId', 'name code')
            .sort({ name: 1 })

        if (limit > 0) {
            queryExec = queryExec.skip(skip).limit(limit)
        }

        const tests = await queryExec

        return {
            tests,
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

exports.getTestById = async (id) => {
    try {
        const test = await EndoscopyTest.findById(id).populate('categoryId', 'name code')
        if (!test) {
            const err = new Error('Endoscopy test not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        return test
    } catch (error) {
        throw error
    }
}

exports.updateTest = async (id, data) => {
    try {
        if (!data.categoryId && data.endoscopyId) {
            data.categoryId = data.endoscopyId
        }
        const test = await EndoscopyTest.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('categoryId', 'name code')
        if (!test) {
            const err = new Error('Endoscopy test not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        return test
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('Test code already exists')
            err.status = STATUS_CODES.CONFLICT
            throw err
        }
        throw error
    }
}

exports.deleteTest = async (id) => {
    try {
        const test = await EndoscopyTest.findById(id)
        if (!test) {
            const err = new Error('Endoscopy test not found')
            err.status = STATUS_CODES.NOT_FOUND
            throw err
        }
        await test.softDelete()
        return test
    } catch (error) {
        throw error
    }
}

// --- Endoscopy Order Services ---

const EndoscopyOrder = require('./endoscopy_order.model')
const EndoscopyOrderItem = require('./endoscopy_order_item.model')
const Employee = require('../hr/employee.model')

exports.createEndoscopyOrder = async (data, userId) => {
    const session = await EndoscopyOrder.startSession()
    session.startTransaction()
    try {
        const { tests = [], ...orderData } = data || {}

        const fields = ['opdAppointmentId', 'admissionId', 'emergencyVisitId', 'doctorId']
        for (const field of fields) {
            if (orderData[field] === '' || orderData[field] === undefined) {
                orderData[field] = null
            }
        }
        if (orderData.referral === 'Self') {
            orderData.doctorId = null
        }

        const order = new EndoscopyOrder({
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
            const test = await EndoscopyTest.findById(t.testId).session(session)
            if (!test) continue
            const amount = test.rate || 0
            totalAmount += amount
            items.push({
                orderId: order._id,
                endoscopyTestId: test._id,
                rate: test.rate || 0,
                amount
            })
        }

        let insertedItems = []
        if (items.length > 0) {
            insertedItems = await EndoscopyOrderItem.insertMany(items, { session })
        }

        order.totalAmount = totalAmount
        await order.save({ session })

        if (orderData.admissionId && insertedItems.length > 0) {
            const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')
            const PatientCharge = require('../common/patient_charge.model')

            const endoCategory = await ChargeCategory.findOne({ code: 'ENDOSCOPY' }).session(session)

            for (const dbItem of insertedItems) {
                const test = await EndoscopyTest.findById(dbItem.endoscopyTestId).session(session)
                const testName = test ? test.name : 'Endoscopy Test'

                await PatientCharge.create([{
                    admissionId: orderData.admissionId || null,
                    emergencyVisitId: orderData.emergencyVisitId || null,
                    sourceType: 'ENDOSCOPY',
                    patientId: orderData.patientId,
                    chargeCategoryId: endoCategory?._id || null,
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

exports.getAllEndoscopyOrders = async (query = {}) => {
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

        const total = await EndoscopyOrder.countDocuments(filter)
        let queryExec = EndoscopyOrder.find(filter)
            .populate('patientId', 'fullName patientCode mobileNo')
            .populate('doctorId', 'fullName doctorCode')
            .sort({ createdAt: -1 })

        if (limit > 0) {
            queryExec = queryExec.skip(skip).limit(limit)
        }

        const orders = await queryExec

        return {
            orders,
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

exports.getEndoscopyOrderById = async (id) => {
    try {
        const order = await EndoscopyOrder.findById(id)
            .populate('patientId')
            .populate('doctorId', 'fullName doctorCode')
            .populate('createdBy', 'email')

        if (!order) {
            const error = new Error('Endoscopy order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const items = await EndoscopyOrderItem.find({ orderId: id })
            .populate('endoscopyTestId', 'name code rate duration')

        const orderObj = order.toObject()

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

exports.updateEndoscopyOrder = async (id, data) => {
    try {
        const updateData = { ...data }
        const tests = updateData.tests
        delete updateData.tests

        const fields = ['opdAppointmentId', 'admissionId', 'emergencyVisitId', 'doctorId']
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

        const order = await EndoscopyOrder.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('patientId', 'fullName patientCode mobileNo')
            .populate('doctorId', 'fullName doctorCode')

        if (!order) {
            const error = new Error('Endoscopy order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (Array.isArray(tests)) {
            await EndoscopyOrderItem.deleteMany({ orderId: id })
            let totalAmount = 0
            const items = []
            for (const t of tests) {
                if (!t || !t.testId) continue
                const test = await EndoscopyTest.findById(t.testId)
                if (!test) continue
                const amount = test.rate || 0
                totalAmount += amount
                items.push({
                    orderId: id,
                    endoscopyTestId: test._id,
                    rate: test.rate || 0,
                    amount
                })
            }
            if (items.length > 0) {
                await EndoscopyOrderItem.insertMany(items)
            }
            order.totalAmount = totalAmount
            await order.save()
        }

        return order
    } catch (error) {
        throw error
    }
}

exports.deleteEndoscopyOrder = async (id) => {
    const session = await EndoscopyOrder.startSession()
    session.startTransaction()
    try {
        const order = await EndoscopyOrder.findById(id).session(session)
        if (!order) {
            const error = new Error('Endoscopy order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const PatientCharge = require('../common/patient_charge.model')
        const orderItems = await EndoscopyOrderItem.find({ orderId: id }).session(session)
        const orderItemIds = orderItems.map(item => item._id)

        if (orderItemIds.length > 0) {
            await PatientCharge.deleteMany({
                sourceType: 'ENDOSCOPY',
                sourceId: { $in: orderItemIds }
            }).session(session)
        }

        await EndoscopyOrderItem.deleteMany({ orderId: id }).session(session)
        await EndoscopyOrder.findByIdAndDelete(id).session(session)

        await session.commitTransaction()
        session.endSession()
        return order
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

