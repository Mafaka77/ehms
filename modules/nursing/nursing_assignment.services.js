const NursingAssignment = require('./nursing_assignment.model')
const STATUS_CODES = require('../../utils/statuscode')

const populate = [
    { path: 'nursingStationId', select: 'name code' },
    { path: 'nurseId', select: 'fullName email' },
    { path: 'assignedBy', select: 'fullName email' }
]

exports.createAssignment = async (data, userId) => {
    try {
        const assignment = await NursingAssignment.create({ ...data, assignedBy: userId })
        return await NursingAssignment.findById(assignment._id).populate(populate)
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('This nurse is already actively assigned to this station')
            err.status = STATUS_CODES.CONFLICT
            throw err
        }
        throw error
    }
}

exports.getAllAssignments = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (query.nursingStationId) filter.nursingStationId = query.nursingStationId
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total = await NursingAssignment.countDocuments(filter)
        const assignments = await NursingAssignment.find(filter)
            .populate(populate)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            assignments,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        }
    } catch (error) {
        throw error
    }
}

exports.getAssignmentById = async (id) => {
    try {
        const assignment = await NursingAssignment.findById(id).populate(populate)
        if (!assignment) {
            const error = new Error('Assignment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return assignment
    } catch (error) {
        throw error
    }
}

exports.updateAssignment = async (id, data) => {
    try {
        const assignment = await NursingAssignment.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate(populate)
        if (!assignment) {
            const error = new Error('Assignment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return assignment
    } catch (error) {
        throw error
    }
}

exports.deleteAssignment = async (id) => {
    try {
        const assignment = await NursingAssignment.findByIdAndDelete(id)
        if (!assignment) {
            const error = new Error('Assignment not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return assignment
    } catch (error) {
        throw error
    }
}
