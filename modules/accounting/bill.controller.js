const billService = require('./bill.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.generateBillFromLabOrder = async (req, res) => {
    try {
        const { labOrderId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!labOrderId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'labOrderId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromLabOrder(
            labOrderId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromRadiologyOrder = async (req, res) => {
    try {
        const { radiologyOrderId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!radiologyOrderId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'radiologyOrderId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromRadiologyOrder(
            radiologyOrderId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromOpdAppointment = async (req, res) => {
    try {
        const { opdAppointmentId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!opdAppointmentId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'opdAppointmentId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromOpdAppointment(
            opdAppointmentId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromEmergencyVisit = async (req, res) => {
    try {
        const { emergencyVisitId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!emergencyVisitId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'emergencyVisitId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromEmergencyVisit(
            emergencyVisitId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromEmergencyCharges = async (req, res) => {
    try {
        const { emergencyVisitId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!emergencyVisitId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'emergencyVisitId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromEmergencyCharges(
            emergencyVisitId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Discharge bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromDentalAppointment = async (req, res) => {
    try {
        const { dentalAppointmentId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!dentalAppointmentId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'dentalAppointmentId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromDentalAppointment(
            dentalAppointmentId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.generateBillFromDentalConsultation = async (req, res) => {
    try {
        const { dentalAppointmentId, discountAmount, discountType, discountRemarks, employeeId } = req.body
        if (!dentalAppointmentId) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'dentalAppointmentId is required',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        const bill = await billService.generateBillFromDentalConsultation(
            dentalAppointmentId, 
            req.user._id, 
            discountAmount || 0,
            discountType,
            discountRemarks,
            employeeId
        )
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Consultation Bill generated successfully',
            data: bill,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.processPayment = async (req, res) => {
    try {
        const { id } = req.params
        const result = await billService.processBillPayment(id, req.body, req.user._id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Payment processed successfully',
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

exports.getBillById = async (req, res) => {
    try {
        const { id } = req.params
        const bill = await billService.getBillById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bill fetched successfully',
            data: bill,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.cancelBill = async (req, res) => {
    try {
        const { id } = req.params
        await billService.cancelBill(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bill cancelled successfully',
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.cancelPayment = async (req, res) => {
    try {
        const { id } = req.params
        const result = await billService.cancelPayment(id, req.user._id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Payment cancelled successfully',
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

