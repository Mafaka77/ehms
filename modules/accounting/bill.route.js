const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const billController = require('./bill.controller')

module.exports = async function (fastify, opts) {
    fastify.post('/generate-from-lab-order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromLabOrder)
    fastify.post('/generate-from-radiology-order', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromRadiologyOrder)
    fastify.post('/generate-from-opd-appointment', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromOpdAppointment)
    fastify.post('/generate-from-emergency-visit', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromEmergencyVisit)
    fastify.post('/generate-from-dental-appointment', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromDentalAppointment)
    fastify.post('/generate-from-dental-consultation', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.generateBillFromDentalConsultation)
    fastify.post('/bills/:id/pay', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.processPayment)
    fastify.post('/bills/:id/cancel', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.cancelBill)
    fastify.get('/bills/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.getBillById)
    fastify.post('/payments/:id/cancel', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'Cashier'])] }, billController.cancelPayment)
}

