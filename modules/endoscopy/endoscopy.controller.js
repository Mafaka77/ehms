const endoscopyService = require('./endoscopy.services')
const STATUS_CODES = require('../../utils/statuscode')

// --- Category Controller ---

exports.createCategory = async (req, res) => {
    try {
        const category = await endoscopyService.createCategory(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Endoscopy category created successfully',
            data: category,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const result = await endoscopyService.getAllCategories(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy categories fetched successfully',
            data: result.categories,
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

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params
        const category = await endoscopyService.getCategoryById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy category fetched successfully',
            data: category,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params
        const category = await endoscopyService.updateCategory(id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy category updated successfully',
            data: category,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params
        const category = await endoscopyService.deleteCategory(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy category deleted successfully',
            data: category,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// --- Test Controller ---

exports.createTest = async (req, res) => {
    try {
        const test = await endoscopyService.createTest(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Endoscopy test created successfully',
            data: test,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllTests = async (req, res) => {
    try {
        const result = await endoscopyService.getAllTests(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy tests fetched successfully',
            data: result.tests,
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

exports.getTestById = async (req, res) => {
    try {
        const { id } = req.params
        const test = await endoscopyService.getTestById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy test fetched successfully',
            data: test,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateTest = async (req, res) => {
    try {
        const { id } = req.params
        const test = await endoscopyService.updateTest(id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy test updated successfully',
            data: test,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteTest = async (req, res) => {
    try {
        const { id } = req.params
        const test = await endoscopyService.deleteTest(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy test deleted successfully',
            data: test,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// --- Order Controller ---

exports.createEndoscopyOrder = async (req, res) => {
    try {
        const order = await endoscopyService.createEndoscopyOrder(req.body, req.user?._id)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Endoscopy order created successfully',
            data: order,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllEndoscopyOrders = async (req, res) => {
    try {
        const result = await endoscopyService.getAllEndoscopyOrders(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy orders fetched successfully',
            data: result.orders,
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

exports.getEndoscopyOrderById = async (req, res) => {
    try {
        const { id } = req.params
        const result = await endoscopyService.getEndoscopyOrderById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy order fetched successfully',
            data: result,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateEndoscopyOrder = async (req, res) => {
    try {
        const { id } = req.params
        const order = await endoscopyService.updateEndoscopyOrder(id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy order updated successfully',
            data: order,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteEndoscopyOrder = async (req, res) => {
    try {
        const { id } = req.params
        const order = await endoscopyService.deleteEndoscopyOrder(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Endoscopy order deleted successfully',
            data: order,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

