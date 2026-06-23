const doctorService = require('./doctor.services');
const STATUS_CODES = require('../../utils/statuscode');

exports.createDoctor = async (req, res) => {
    try {
        const result = await doctorService.createDoctor(req.body);
        const message = result.autoUserCreated
            ? 'Doctor registered successfully. A doctor login account has been automatically created (default password: mobile number).'
            : 'Doctor created successfully';
        return res.code(STATUS_CODES.CREATED).send({
            message: message,
            data: result.doctor,
            autoUserCreated: result.autoUserCreated,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getDoctors = async (req, res) => {
    try {
        const result = await doctorService.getDoctors(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Doctors fetched successfully',
            data: result.doctors,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Doctor fetched successfully',
            data: doctor,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.getRemunerationRules = async (req, res) => {
    try {
        const rules = await doctorService.getRemunerationRules(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Remuneration rules fetched successfully',
            data: rules,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.createRemunerationRule = async (req, res) => {
    try {
        const rule = await doctorService.createRemunerationRule(req.params.id, req.body);
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Remuneration rule created successfully',
            data: rule,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.deleteRemunerationRule = async (req, res) => {
    try {
        await doctorService.deleteRemunerationRule(req.params.ruleId);
        return res.code(STATUS_CODES.OK).send({
            message: 'Remuneration rule deleted successfully',
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}
