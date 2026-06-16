const patientService = require('./patient.services');
const STATUS_CODES = require('../../utils/statuscode');

exports.searchPatients = async (req, res) => {
    try {
        const patients = await patientService.searchPatients(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Patients fetched successfully',
            data: patients,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}

exports.createPatient = async (req, res) => {
    try {
        const patient = await patientService.createPatient(req.body);
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Patient created successfully',
            data: patient,
            status: STATUS_CODES.CREATED
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
}