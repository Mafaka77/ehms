const doctorActivityService = require('./doctor_activity.services');
const STATUS_CODES = require('../../utils/statuscode');

exports.getDoctorActivityList = async (req, res) => {
    try {
        const result = await doctorActivityService.getDoctorActivityList(req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Doctor activity list fetched successfully',
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
};

exports.getDoctorActivityById = async (req, res) => {
    try {
        const data = await doctorActivityService.getDoctorActivityById(req.params.id);
        return res.code(STATUS_CODES.OK).send({
            message: 'Doctor activity details fetched successfully',
            data,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
};

exports.getDoctorActivityLogs = async (req, res) => {
    try {
        const data = await doctorActivityService.getDoctorActivityLogs(req.params.id, req.query);
        return res.code(STATUS_CODES.OK).send({
            message: 'Doctor activity logs fetched successfully',
            data,
            status: STATUS_CODES.OK
        });
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        });
    }
};
