const auth = require('../../middleware/auth');
const authorizeRole = require('../../middleware/authorize');
const patientsController = require('./patients.controller');

module.exports = async function (fastify, opts) {
    fastify.get('/patients', { onRequest: [auth] }, patientsController.searchPatients);
    fastify.post('/patients', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Doctor', 'Nurse','EmergencyNurse'])] }, patientsController.createPatient);
}