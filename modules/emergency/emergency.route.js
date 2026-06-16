const auth = require('../../middleware/auth');
const authorizeRole = require('../../middleware/authorize');
const emergencyController = require('./emergency.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/emergency/doctors', { onRequest: [auth] }, emergencyController.getEmergencyDoctors);
    fastify.get('/emergency/visits', { onRequest: [auth] }, emergencyController.getEmergencyVisits);
    fastify.get('/emergency/visits/report', { onRequest: [auth] }, emergencyController.getEmergencyVisitsReport);
    fastify.get('/emergency/visits/:id', { onRequest: [auth] }, emergencyController.getEmergencyVisitById);
    fastify.post('/emergency/visits', { onRequest: [auth] }, emergencyController.createEmergencyVisit);
    fastify.delete('/emergency/visits/:id', { onRequest: [auth] }, emergencyController.deleteEmergencyVisit);
}
