const LabCategory = require('./lab_category.model')
const LabSampleType = require('./lab_sample_type.model')
const LabTest = require('./lab_test.model')
const LabTestParameter = require('./lab_test_params.model')
const LabOrder = require('./lab_order.model')
const LabOrderItem = require('./lab_order_item.model')
const Employee = require('../hr/employee.model')
const STATUS_CODES = require('../../utils/statuscode')

// --- Lab Category Services ---

exports.createLabCategory = async (data) => {
    try {
        const existingCategory = await LabCategory.findOne({ name: data.name })
        if (existingCategory) {
            const error = new Error('Lab category already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const category = await LabCategory.create(data)
        return category
    } catch (error) {
        throw error
    }
}

exports.getAllLabCategories = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit
 
        let filter = {}
        if (search) {
            filter = { name: { $regex: search, $options: 'i' } }
        }

        const total = await LabCategory.countDocuments(filter)
        const categories = await LabCategory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            categories,
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

exports.getLabCategoryById = async (id) => {
    try {
        const category = await LabCategory.findById(id)
        if (!category) {
            const error = new Error('Lab category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

exports.deleteLabCategory = async (id) => {
    try {
        const category = await LabCategory.findByIdAndDelete(id)
        if (!category) {
            const error = new Error('Lab category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

exports.updateLabCategory = async (id, data) => {
    try {
        if (data.name) {
            const existingCategory = await LabCategory.findOne({ name: data.name, _id: { $ne: id } })
            if (existingCategory) {
                const error = new Error('Lab category name already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const category = await LabCategory.findByIdAndUpdate(id, data, { new: true })
        if (!category) {
            const error = new Error('Lab category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

// --- Lab Sample Type Services ---
exports.createLabSampleType = async (data) => {
    try {
        const existingType = await LabSampleType.findOne({ name: data.name })
        if (existingType) {
            const error = new Error('Lab sample type already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const sampleType = await LabSampleType.create(data)
        return sampleType
    } catch (error) {
        throw error
    }
}

exports.getAllLabSampleTypes = async (query = {}) => {
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

        const total = await LabSampleType.countDocuments(filter)
        const sampleTypes = await LabSampleType.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            sampleTypes,
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

exports.getLabSampleTypeById = async (id) => {
    try {
        const sampleType = await LabSampleType.findById(id)
        if (!sampleType) {
            const error = new Error('Lab sample type not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return sampleType
    } catch (error) {
        throw error
    }
}

exports.updateLabSampleType = async (id, data) => {
    try {
        if (data.name) {
            const existingType = await LabSampleType.findOne({ name: data.name, _id: { $ne: id } })
            if (existingType) {
                const error = new Error('Lab sample type name already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const sampleType = await LabSampleType.findByIdAndUpdate(id, data, { new: true })
        if (!sampleType) {
            const error = new Error('Lab sample type not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return sampleType
    } catch (error) {
        throw error
    }
}

exports.deleteLabSampleType = async (id) => {
    try {
        const sampleType = await LabSampleType.findByIdAndDelete(id)
        if (!sampleType) {
            const error = new Error('Lab sample type not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return sampleType
    } catch (error) {
        throw error
    }
}

// --- Lab Test Services ---
exports.createLabTest = async (data) => {
    try {
        const existingTest = await LabTest.findOne({ $or: [{ name: data.name }, { code: data.code }] })
        if (existingTest) {
            const error = new Error('Lab test name or code already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const test = await LabTest.create(data)
        return test
    } catch (error) {
        throw error
    }
}

exports.getAllLabTests = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const sampleTypeId = query.sampleTypeId || ''
        const skip = (page - 1) * limit
 
        let filter = {}
        if (search) {
            filter = { name: { $regex: search, $options: 'i' } }
        }
        if (sampleTypeId) {
            filter.sampleTypeId = sampleTypeId
        }

        const total = await LabTest.countDocuments(filter)
        const tests = await LabTest.find(filter)
            .populate('categoryId', 'name')
            .populate('sampleTypeId', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            data: tests, // Need to make sure returning this format aligns, wait, in previous ones I returned the array directly under the name
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

exports.getLabTestById = async (id) => {
    try {
        const test = await LabTest.findById(id).populate('categoryId', 'name').populate('sampleTypeId', 'name code')
        if (!test) {
            const error = new Error('Lab test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

exports.updateLabTest = async (id, data) => {
    try {
        if (data.name || data.code) {
            const orConditions = []
            if (data.name) orConditions.push({ name: data.name })
            if (data.code) orConditions.push({ code: data.code })
            
            const existingTest = await LabTest.findOne({ $or: orConditions, _id: { $ne: id } })
            if (existingTest) {
                const error = new Error('Lab test name or code already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const test = await LabTest.findByIdAndUpdate(id, data, { new: true })
            .populate('categoryId', 'name')
            .populate('sampleTypeId', 'name code')
        if (!test) {
            const error = new Error('Lab test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

exports.deleteLabTest = async (id) => {
    try {
        const test = await LabTest.findByIdAndDelete(id)
        if (!test) {
            const error = new Error('Lab test not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return test
    } catch (error) {
        throw error
    }
}

// --- Lab Test Parameter Services ---
exports.createLabTestParameter = async (data) => {
    try {
        const param = await LabTestParameter.create(data)
        return param
    } catch (error) {
        throw error
    }
}

exports.getAllLabTestParameters = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const testId = query.testId || ''
        const skip = (page - 1) * limit
 
        let filter = {}
        if (search) {
            filter = { name: { $regex: search, $options: 'i' } }
        }
        if (testId) {
            filter.testId = testId
        }

        const total = await LabTestParameter.countDocuments(filter)
        const parameters = await LabTestParameter.find(filter)
            .sort({ displayOrder: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            data: parameters,
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

exports.getLabTestParameterById = async (id) => {
    try {
        const param = await LabTestParameter.findById(id)
        if (!param) {
            const error = new Error('Lab test parameter not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return param
    } catch (error) {
        throw error
    }
}

exports.updateLabTestParameter = async (id, data) => {
    try {
        const param = await LabTestParameter.findByIdAndUpdate(id, data, { new: true })
        if (!param) {
            const error = new Error('Lab test parameter not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return param
    } catch (error) {
        throw error
    }
}

exports.deleteLabTestParameter = async (id) => {
    try {
        const param = await LabTestParameter.findByIdAndDelete(id)
        if (!param) {
            const error = new Error('Lab test parameter not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return param
    } catch (error) {
        throw error
    }
}

exports.createLabOrder = async (data) => { 
    const session = await LabOrder.startSession();
    session.startTransaction();
    try {
        let totalAmount = 0;
        
        // Prepare items and calculate total amount
        const items = [];
        if (data.tests && data.tests.length > 0) {
            for (const testItem of data.tests) {
                totalAmount += testItem.amount || 0;
                items.push(testItem);
            }
        }
        
        const order = await LabOrder.create([{
            patientId: data.patientId,
            referral: data.referral || 'Doctor',
            doctorId: data.referral === 'Self' ? null : data.doctorId,
            opdAppointmentId: data.opdAppointmentId || null,
            admissionId: data.admissionId || null,
            priority: data.priority || 'ROUTINE',
            totalAmount,
            clinicalNotes: data.clinicalNotes,
            remarks: data.remarks,
            paymentStatus: data.admissionId ? 'IPD' : 'UNPAID'
        }], { session });

        if (items.length > 0) {
            const orderItems = items.map(item => ({
                orderId: order[0]._id,
                testId: item.testId,
                testName: item.testName,
                rate: item.rate,
                quantity: item.quantity || 1,
                amount: item.amount
            }));
            await LabOrderItem.insertMany(orderItems, { session });
        }

        await session.commitTransaction();
        session.endSession();
        return order[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.getAllLabOrders = async (query = {}) => { 
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit
 
        let filter = {}
        if (search) {
            filter = { orderNo: { $regex: search, $options: 'i' } }
        }
        if (query.paymentStatus) {
            if (query.paymentStatus === 'PAID_AND_IPD') {
                filter.paymentStatus = { $in: ['PAID', 'IPD'] }
            } else {
                filter.paymentStatus = query.paymentStatus
            }
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

        const total = await LabOrder.countDocuments(filter)
        const orders = await LabOrder.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('patientId')
            .populate('doctorId')

        return {
            data: orders,
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

exports.getLabOrderById = async (id) => { 
    try {
        const order = await LabOrder.findById(id)
            .populate('patientId')
            .populate('doctorId')
            .populate('opdAppointmentId')
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        const items = await LabOrderItem.find({ orderId: id })
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

        return { ...orderObj, items }
    } catch (error) {
        throw error
    }
}

exports.updateLabOrder = async (id, data) => { 
    const session = await LabOrder.startSession();
    session.startTransaction();
    try {
        const order = await LabOrder.findById(id).session(session);
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Update core fields
        if (data.patientId) order.patientId = data.patientId;
        if (data.referral) order.referral = data.referral;
        if (data.referral === 'Self') order.doctorId = null;
        else if (data.doctorId) order.doctorId = data.doctorId;
        
        if (data.priority) order.priority = data.priority;
        if (data.status) order.status = data.status;
        if (data.clinicalNotes !== undefined) order.clinicalNotes = data.clinicalNotes;
        if (data.remarks !== undefined) order.remarks = data.remarks;

        // If tests are provided, we replace all existing items
        if (data.tests) {
            await LabOrderItem.deleteMany({ orderId: id }).session(session);
            
            let totalAmount = 0;
            const items = [];
            for (const testItem of data.tests) {
                totalAmount += testItem.amount || 0;
                items.push(testItem);
            }
            order.totalAmount = totalAmount;

            if (items.length > 0) {
                const orderItems = items.map(item => ({
                    orderId: id,
                    testId: item.testId,
                    testName: item.testName,
                    rate: item.rate,
                    quantity: item.quantity || 1,
                    amount: item.amount
                }));
                await LabOrderItem.insertMany(orderItems, { session });
            }
        }

        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.deleteLabOrder = async (id) => { 
    const session = await LabOrder.startSession();
    session.startTransaction();
    try {
        const order = await LabOrder.findById(id).session(session);
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (order.admissionId) {
            const PatientCharge = require('../common/patient_charge.model')
            const PatientChargeAddon = require('../common/patient_charge_addon.model')

            const orderItems = await LabOrderItem.find({ orderId: id }).session(session);
            const itemIds = orderItems.map(item => item._id);

            const charges = await PatientCharge.find({
                admissionId: order.admissionId,
                sourceId: { $in: itemIds }
            }).session(session);
            const chargeIds = charges.map(c => c._id);

            await PatientChargeAddon.deleteMany({ patientChargeId: { $in: chargeIds } }).session(session);
            await PatientCharge.deleteMany({ _id: { $in: chargeIds } }).session(session);
        }

        const LabResult = require('./lab_result.model')
        await LabResult.deleteMany({ orderId: id }).session(session);

        await LabOrderItem.deleteMany({ orderId: id }).session(session);
        await LabOrder.findByIdAndDelete(id).session(session);
        
        await session.commitTransaction();
        session.endSession();
        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

exports.getLabStats = async () => {
    try {
        const Bill = require('../accounting/bill.model')
        
        const totalTests = await LabTest.countDocuments()
        const pendingOrders = await LabOrder.countDocuments({ paymentStatus: 'UNPAID' })
        const completedOrders = await LabOrder.countDocuments({ status: { $in: ['COMPLETED', 'VERIFIED'] } })
        
        const bills = await Bill.aggregate([
            { $match: { billType: 'LAB', status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, totalPaid: { $sum: '$paidAmount' } } }
        ])
        const revenue = bills.length > 0 ? bills[0].totalPaid : 0
        
        return {
            totalTests,
            pendingOrders,
            completedOrders,
            revenue
        }
    } catch (error) {
        throw error
    }
}

exports.getLabOrderResults = async (orderId) => {
    try {
        const LabResult = require('./lab_result.model')
        
        const order = await LabOrder.findById(orderId)
            .populate('patientId')
            .populate('doctorId');
            
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const orderItems = await LabOrderItem.find({ orderId });

        const structuredResults = [];
        for (const item of orderItems) {
            const parameters = await LabTestParameter.find({ testId: item.testId }).sort({ displayOrder: 1 });
            const results = await LabResult.find({ orderItemId: item._id });

            structuredResults.push({
                orderItemId: item._id,
                testId: item.testId,
                testName: item.testName,
                status: item.status,
                parameters: parameters.map(p => {
                    const matchedResult = results.find(r => r.parameterId.toString() === p._id.toString());
                    return {
                        parameterId: p._id,
                        name: p.name,
                        unit: p.unit,
                        normalRangeMale: p.normalRangeMale,
                        normalRangeFemale: p.normalRangeFemale,
                        normalRangeChild: p.normalRangeChild,
                        referenceIntervals: p.referenceIntervals || [],
                        displayOrder: p.displayOrder,
                        measuredValue: matchedResult ? matchedResult.measuredValue : '',
                        isOutOfRange: matchedResult ? matchedResult.isOutOfRange : false,
                        resultId: matchedResult ? matchedResult._id : null
                    };
                })
            });
        }

        return {
            order,
            tests: structuredResults
        };
    } catch (error) {
        throw error;
    }
}

exports.saveLabOrderResults = async (orderId, resultsData, userId) => {
    const session = await LabOrder.startSession();
    session.startTransaction();
    try {
        const LabResult = require('./lab_result.model')

        const order = await LabOrder.findById(orderId).session(session);
        if (!order) {
            const error = new Error('Lab order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        for (const res of resultsData) {
            const query = {
                orderId,
                orderItemId: res.orderItemId,
                parameterId: res.parameterId
            };
            const update = {
                measuredValue: res.measuredValue,
                isOutOfRange: !!res.isOutOfRange,
                enteredBy: userId,
                enteredAt: new Date()
            };
            await LabResult.findOneAndUpdate(query, update, {
                upsert: true,
                new: true,
                session
            });
        }

        await LabOrderItem.updateMany(
            { orderId, status: { $ne: 'CANCELLED' } },
            { 
                status: 'COMPLETED',
                processedAt: new Date(),
                processedBy: userId
            }
        ).session(session);

        order.status = 'COMPLETED';

        if (order.admissionId) {
            order.paymentStatus = 'PAID';

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
                        isBilled: false
                    }], { session })
                }
            }
        }

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return { success: true, message: 'Results saved successfully' };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

