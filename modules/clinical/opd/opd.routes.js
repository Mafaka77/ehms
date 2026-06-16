const auth = require('../../../middleware/auth');
const authorizeRole = require('../../../middleware/authorize');
const opdController = require('./opd.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/opd/doctors', { onRequest: [auth] }, opdController.getOpdDoctors);
    fastify.get('/opd/appointments', { onRequest: [auth] }, opdController.getAppointments);
    fastify.get('/opd/appointments/report', { onRequest: [auth] }, opdController.getAppointmentsReport);
    fastify.get('/opd/appointments/:id', { onRequest: [auth] }, opdController.getAppointmentById);
    fastify.post('/opd/appointments', { onRequest: [auth] }, opdController.createAppointment);
    fastify.delete('/opd/appointments/:id', { onRequest: [auth] }, opdController.deleteAppointment);
}
