const auth = require('../../middleware/auth');
const authorizeRole = require('../../middleware/authorize');
const patientsController = require('./patients.controller');

const allowedRoles = ['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Doctor', 'Nurse', 'EmergencyNurse'];

module.exports = async function (fastify, opts) {
    fastify.get('/patients', { onRequest: [auth] }, patientsController.getAllPatients);
    fastify.get('/patients/search', { onRequest: [auth] }, patientsController.searchPatients);
    fastify.get('/patients/:id', { onRequest: [auth] }, patientsController.getPatientById);
    fastify.post('/patients', { onRequest: [auth, authorizeRole(allowedRoles)] }, patientsController.createPatient);
    fastify.put('/patients/:id', { onRequest: [auth, authorizeRole(allowedRoles)] }, patientsController.updatePatient);
    fastify.delete('/patients/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, patientsController.deletePatient);
};