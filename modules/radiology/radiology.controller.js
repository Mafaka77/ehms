const radiologyService = require('./radiology.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.createRadiology = async (req, res) => {
    try {
        const radiology = await radiologyService.createRadiology(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Radiology category created successfully',
            data: radiology,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllRadiologies = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await radiologyService.getAllRadiologies({ page, limit, search })
        return res.code(STATUS_CODES.OK).send({
            message: 'Radiology categories fetched successfully',
            data: result.radiologies,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getRadiologyById = async (req, res) => {
    try {
        const { id } = req.params
        const radiology = await radiologyService.getRadiologyById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Radiology category fetched successfully',
            data: radiology,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateRadiology = async (req, res) => {
    try {
        const { id } = req.params
        const radiology = await radiologyService.updateRadiology(id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Radiology category updated successfully',
            data: radiology,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteRadiology = async (req, res) => {
    try {
        const { id } = req.params
        const radiology = await radiologyService.deleteRadiology(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Radiology category deleted successfully',
            data: radiology,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// ==========================================
// RadiologyTest Controller
// ==========================================

exports.createRadiologyTest = async (req, res) => {
    try {
        const test = await radiologyService.createRadiologyTest(req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Radiology test created successfully', data: test, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllRadiologyTests = async (req, res) => {
    try {
        const { page, limit, search, radiologyId } = req.query
        const result = await radiologyService.getAllRadiologyTests({ page, limit, search, radiologyId })
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology tests fetched successfully', data: result.tests, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getRadiologyTestById = async (req, res) => {
    try {
        const { id } = req.params
        const test = await radiologyService.getRadiologyTestById(id)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology test fetched successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateRadiologyTest = async (req, res) => {
    try {
        const { id } = req.params
        const test = await radiologyService.updateRadiologyTest(id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology test updated successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteRadiologyTest = async (req, res) => {
    try {
        const { id } = req.params
        const test = await radiologyService.deleteRadiologyTest(id)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology test deleted successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ==========================================
// RadiologyOrder Controller
// ==========================================

exports.createRadiologyOrder = async (req, res) => {
    try {
        const order = await radiologyService.createRadiologyOrder(req.body, req.user?._id)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Radiology order created successfully', data: order, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllRadiologyOrders = async (req, res) => {
    try {
        const { page, limit, search, paymentStatus, admissionId, patientId } = req.query
        const result = await radiologyService.getAllRadiologyOrders({ page, limit, search, paymentStatus, admissionId, patientId })
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology orders fetched successfully', data: result.orders, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getRadiologyOrderById = async (req, res) => {
    try {
        const { id } = req.params
        const result = await radiologyService.getRadiologyOrderById(id)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology order fetched successfully', data: result.order, items: result.items, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateRadiologyOrder = async (req, res) => {
    try {
        const { id } = req.params
        const order = await radiologyService.updateRadiologyOrder(id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology order updated successfully', data: order, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteRadiologyOrder = async (req, res) => {
    try {
        const { id } = req.params
        const order = await radiologyService.deleteRadiologyOrder(id)
        return res.code(STATUS_CODES.OK).send({ message: 'Radiology order deleted successfully', data: order, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}
