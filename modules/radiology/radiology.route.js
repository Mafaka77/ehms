const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const radiologyController = require('./radiology.controller')

module.exports = async (fastify, options) => {

    // Radiology category routes
    fastify.post('/category', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.createRadiology)
    fastify.get('/category', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.getAllRadiologies)
    fastify.get('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.getRadiologyById)
    fastify.put('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.updateRadiology)
    fastify.delete('/category/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.deleteRadiology)

    // Radiology test routes
    fastify.post('/test', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.createRadiologyTest)
    fastify.get('/test', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.getAllRadiologyTests)
    fastify.get('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.getRadiologyTestById)
    fastify.put('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.updateRadiologyTest)
    fastify.delete('/test/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.deleteRadiologyTest)

    // Radiology order routes
    fastify.get('/order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'Doctor', 'Nurse', 'EmergencyNurse'])] }, radiologyController.getAllRadiologyOrders)
    fastify.post('/order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Doctor', 'Nurse', 'EmergencyNurse'])] }, radiologyController.createRadiologyOrder)
    fastify.get('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Cashier', 'Doctor', 'Nurse', 'EmergencyNurse'])] }, radiologyController.getRadiologyOrderById)
    fastify.put('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Receptionist', 'Doctor', 'Nurse', 'EmergencyNurse'])] }, radiologyController.updateRadiologyOrder)
    fastify.delete('/order/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, radiologyController.deleteRadiologyOrder)

}
