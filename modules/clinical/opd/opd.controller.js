const opdService = require('./opd.services');
const STATUS_CODES = require('../../../utils/statuscode');

exports.getOpdDoctors = async (req, res) => {
    try {
        const doctors = await opdService.getOpdDoctors();
        return res.code(STATUS_CODES.OK).send({
            message: 'OPD Doctors fetched successfully',
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

exports.getAppointments = async (req, res) => {
    try {
        const result = await opdService.getAppointments(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointments fetched successfully',
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

exports.createAppointment = async (req, res) => {
    try {
        const appointment = await opdService.createAppointment(req.body);
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Appointment booked successfully',
            data: appointment,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await opdService.deleteAppointment(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointment deleted successfully',
            data: appointment,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await opdService.getAppointmentById(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointment fetched successfully',
            data: appointment,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getAppointmentsReport = async (req, res) => {
    try {
        const report = await opdService.getAppointmentsReport(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointments report generated successfully',
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

exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await opdService.updateAppointment(req.params.id, req.body);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointment updated successfully',
            data: appointment,
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
        const charge = await opdService.createOpdCharge(req.params.id, req.body, req.user?._id);
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

exports.getPatientCharges = async (req, res) => {
    try {
        const charges = await opdService.getOpdCharges(req.params.id);
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

exports.deletePatientCharge = async (req, res) => {
    try {
        const result = await opdService.deleteOpdCharge(req.params.chargeId);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient charge deleted successfully',
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

exports.updatePatientCharge = async (req, res) => {
    try {
        const result = await opdService.updateOpdCharge(req.params.chargeId, req.body, req.user?._id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient charge updated successfully',
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

exports.syncAppointmentDates = async (req, res) => {
    try {
        const count = await opdService.syncAppointmentDates();
        return res.code(STATUS_CODES.OK).send({
            status: STATUS_CODES.OK,
            message: `Synced ${count} appointment dates successfully`
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};