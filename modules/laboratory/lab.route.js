const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const labController = require('./lab.controller')

module.exports = async (fastify, options) => {

    // lab category routes
    fastify.post('/category', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.createLabCategory);
    fastify.get('/category', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getAllLabCategories);
    fastify.get('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getLabCategoryById);
    fastify.put('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.updateLabCategory);
    fastify.delete('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.deleteLabCategory);

    // //lab sample type routes
    fastify.post('/sample-type', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.createLabSampleType);
    fastify.get('/sample-type', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getAllLabSampleTypes);
    fastify.get('/sample-type/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getLabSampleTypeById);
    fastify.put('/sample-type/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.updateLabSampleType);
    fastify.delete('/sample-type/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.deleteLabSampleType);

    // //lab test routes
    fastify.post('/test', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.createLabTest);
    fastify.get('/test', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.getAllLabTests);
    fastify.get('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getLabTestById);
    fastify.put('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.updateLabTest);
    fastify.delete('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.deleteLabTest);

    // //lab test parameter routes
    fastify.post('/test-parameter', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.createLabTestParameter);
    fastify.get('/test-parameter', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.getAllLabTestParameters);
    fastify.get('/test-parameter/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.getLabTestParameterById);
    fastify.put('/test-parameter/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.updateLabTestParameter);
    fastify.delete('/test-parameter/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'LabTechnician'])] }, labController.deleteLabTestParameter);

    // //lab order routes
    fastify.get('/stats', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'LabTechnician'])] }, labController.getLabStats);
    fastify.post('/order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.createLabOrder);
    fastify.get('/order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'LabTechnician'])] }, labController.getAllLabOrders);
    fastify.get('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'LabTechnician'])] }, labController.getLabOrderById);
    fastify.get('/order/:id/results', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'LabTechnician'])] }, labController.getLabOrderResults);
    fastify.post('/order/:id/results', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.saveLabOrderResults);
    fastify.put('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.updateLabOrder);
    fastify.delete('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'LabTechnician'])] }, labController.deleteLabOrder);
}