const emergencyService = require('./emergency.services');
const STATUS_CODES = require('../../utils/statuscode');

exports.getEmergencyDoctors = async (req, res) => {
    try {
        const doctors = await emergencyService.getEmergencyDoctors();
        return res.code(STATUS_CODES.OK).send({
            message: 'Emergency Doctors fetched successfully',
            data: doctors,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getEmergencyVisits = async (req, res) => {
    try {
        const result = await emergencyService.getEmergencyVisits(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Emergency visits fetched successfully',
            data: result,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.createEmergencyVisit = async (req, res) => {
    try {
        const visit = await emergencyService.createEmergencyVisit(req.body);
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Emergency visit registered successfully',
            data: visit,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.deleteEmergencyVisit = async (req, res) => {
    try {
        const visit = await emergencyService.deleteEmergencyVisit(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Emergency visit deleted successfully',
            data: visit,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getEmergencyVisitById = async (req, res) => {
    try {
        const visit = await emergencyService.getEmergencyVisitById(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Emergency visit fetched successfully',
            data: visit,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getEmergencyVisitsReport = async (req, res) => {
    try {
        const report = await emergencyService.getEmergencyVisitsReport(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Emergency visits report generated successfully',
            data: report,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getPatientCharges = async (req, res) => {
    try {
        const charges = await emergencyService.getEmergencyCharges(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient charges fetched successfully',
            data: charges,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.addPatientCharge = async (req, res) => {
    try {
        const charge = await emergencyService.createEmergencyCharge(req.params.id, req.body);
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Patient charge added successfully',
            data: charge,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.deletePatientCharge = async (req, res) => {
    try {
        const charge = await emergencyService.deleteEmergencyCharge(req.params.chargeId);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient charge deleted successfully',
            data: charge,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.updatePatientCharge = async (req, res) => {
    try {
        const charge = await emergencyService.updateEmergencyCharge(req.params.chargeId, req.body);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient charge updated successfully',
            data: charge,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}
