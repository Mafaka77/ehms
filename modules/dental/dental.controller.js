const dentalService = require('./dental.services');
const STATUS_CODES = require('../../utils/statuscode');

exports.getDentalDoctors = async (req, res) => {
    try {
        const doctors = await dentalService.getDentalDoctors();
        return res.code(STATUS_CODES.OK).send({
            message: 'Dental Doctors fetched successfully',
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
        const result = await dentalService.getAppointments(req.query);
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
        const appointment = await dentalService.createAppointment(req.body);
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

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const appointment = await dentalService.updateAppointmentStatus(req.params.id, req.body.status);
        return res.code(STATUS_CODES.OK).send({
            message: 'Appointment treatment status updated successfully',
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

exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await dentalService.deleteAppointment(req.params.id);
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
        const appointment = await dentalService.getAppointmentById(req.params.id);
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
        const report = await dentalService.getAppointmentsReport(req.query);
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

exports.addPatientCharge = async (req, res) => {
    try {
        const charge = await dentalService.addPatientCharge(req.params.id, req.body);
        return res.code(STATUS_CODES.CREATED).send({
            status: STATUS_CODES.CREATED,
            message: 'Patient charge added successfully',
            data: charge
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};

exports.getPatientCharges = async (req, res) => {
    try {
        const charges = await dentalService.getPatientCharges(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            status: STATUS_CODES.OK,
            message: 'Patient charges fetched successfully',
            data: charges
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};

exports.deletePatientCharge = async (req, res) => {
    try {
        const charge = await dentalService.deletePatientCharge(req.params.id, req.params.chargeId);
        return res.code(STATUS_CODES.OK).send({
            status: STATUS_CODES.OK,
            message: 'Patient charge deleted successfully',
            data: charge
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};

exports.updatePatientCharge = async (req, res) => {
    try {
        const charge = await dentalService.updatePatientCharge(req.params.chargeId, req.body);
        return res.code(STATUS_CODES.OK).send({
            status: STATUS_CODES.OK,
            message: 'Patient charge updated successfully',
            data: charge
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};

exports.addInstallment = async (req, res) => {
    try {
        const installment = await dentalService.addInstallment(req.params.id, req.params.chargeId, req.body, req.user._id);
        return res.code(STATUS_CODES.CREATED).send({
            status: STATUS_CODES.CREATED,
            message: 'Installment payment added successfully',
            data: installment
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};

exports.getInstallments = async (req, res) => {
    try {
        const installments = await dentalService.getInstallments(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            status: STATUS_CODES.OK,
            message: 'Installment payments fetched successfully',
            data: installments
        });
    } catch (error) {
        console.error(error);
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal Server Error'
        });
    }
};
