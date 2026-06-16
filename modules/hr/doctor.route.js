const auth = require('../../middleware/auth');
const authorizeRole = require('../../middleware/authorize');
const doctorController = require('./doctor.controller');

module.exports = async function (fastify, opts) {
    fastify.post('/doctors', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, doctorController.createDoctor);
    fastify.get('/doctors', { onRequest: [auth] }, doctorController.getDoctors);
    fastify.get('/doctors/:id', { onRequest: [auth] }, doctorController.getDoctorById);
    fastify.get('/doctors/:id/remuneration-rules', { onRequest: [auth] }, doctorController.getRemunerationRules);
    fastify.post('/doctors/:id/remuneration-rules', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'HRManager'])] }, doctorController.createRemunerationRule);
    fastify.delete('/doctors/remuneration-rules/:ruleId', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'HRManager'])] }, doctorController.deleteRemunerationRule);
}
