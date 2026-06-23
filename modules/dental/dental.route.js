const auth = require('../../middleware/auth');
const authorizeRole = require('../../middleware/authorize');
const dentalController = require('./dental.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/dental/doctors', { onRequest: [auth] }, dentalController.getDentalDoctors);
    fastify.get('/dental/appointments', { onRequest: [auth] }, dentalController.getAppointments);
    fastify.get('/dental/appointments/report', { onRequest: [auth] }, dentalController.getAppointmentsReport);
    fastify.get('/dental/appointments/:id', { onRequest: [auth] }, dentalController.getAppointmentById);
    fastify.post('/dental/appointments', { onRequest: [auth] }, dentalController.createAppointment);
    fastify.delete('/dental/appointments/:id', { onRequest: [auth] }, dentalController.deleteAppointment);
    fastify.post('/dental/appointments/:id/charges', { onRequest: [auth] }, dentalController.addPatientCharge);
    fastify.get('/dental/appointments/:id/charges', { onRequest: [auth] }, dentalController.getPatientCharges);
    fastify.delete('/dental/appointments/:id/charges/:chargeId', { onRequest: [auth] }, dentalController.deletePatientCharge);
    fastify.put('/dental/appointments/:id/charges/:chargeId', { onRequest: [auth] }, dentalController.updatePatientCharge);
    fastify.post('/dental/appointments/:id/charges/:chargeId/installments', { onRequest: [auth] }, dentalController.addInstallment);
    fastify.get('/dental/appointments/:id/installments', { onRequest: [auth] }, dentalController.getInstallments);
    fastify.put('/dental/appointments/:id/status', { onRequest: [auth] }, dentalController.updateAppointmentStatus);
}
