const assignmentService = require('./nursing_assignment.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.createAssignment = async (req, res) => {
    try {
        const assignment = await assignmentService.createAssignment(req.body, req.user?._id)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Assignment created successfully',
            data: assignment,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllAssignments = async (req, res) => {
    try {
        const { page, limit, nursingStationId, isActive } = req.query
        const result = await assignmentService.getAllAssignments({ page, limit, nursingStationId, isActive })
        return res.code(STATUS_CODES.OK).send({
            message: 'Assignments fetched successfully',
            data: result.assignments,
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

exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await assignmentService.getAssignmentById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Assignment fetched successfully',
            data: assignment,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await assignmentService.updateAssignment(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Assignment updated successfully',
            data: assignment,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteAssignment = async (req, res) => {
    try {
        await assignmentService.deleteAssignment(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Assignment deleted successfully',
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
