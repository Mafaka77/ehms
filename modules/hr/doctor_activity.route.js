const auth = require('../../middleware/auth');
const doctorActivityController = require('./doctor_activity.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/doctor-activity', { onRequest: [auth] }, doctorActivityController.getDoctorActivityList);
    fastify.get('/doctor-activity/:id', { onRequest: [auth] }, doctorActivityController.getDoctorActivityById);
    fastify.get('/doctor-activity/:id/logs', { onRequest: [auth] }, doctorActivityController.getDoctorActivityLogs);
};
