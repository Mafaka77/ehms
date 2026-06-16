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