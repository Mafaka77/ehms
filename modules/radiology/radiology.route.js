const auth = require('../../middleware/auth')
const radiologyController = require('./radiology.controller')

module.exports = async (fastify, options) => {

    // Radiology category routes
    fastify.post('/category', { onRequest: [auth] }, radiologyController.createRadiology)
    fastify.get('/category', { onRequest: [auth] }, radiologyController.getAllRadiologies)
    fastify.get('/category/:id', { onRequest: [auth] }, radiologyController.getRadiologyById)
    fastify.put('/category/:id', { onRequest: [auth] }, radiologyController.updateRadiology)
    fastify.delete('/category/:id', { onRequest: [auth] }, radiologyController.deleteRadiology)

    // Radiology test routes
    fastify.post('/test', { onRequest: [auth] }, radiologyController.createRadiologyTest)
    fastify.get('/test', { onRequest: [auth] }, radiologyController.getAllRadiologyTests)
    fastify.get('/test/:id', { onRequest: [auth] }, radiologyController.getRadiologyTestById)
    fastify.put('/test/:id', { onRequest: [auth] }, radiologyController.updateRadiologyTest)
    fastify.delete('/test/:id', { onRequest: [auth] }, radiologyController.deleteRadiologyTest)

    // Radiology order routes
    fastify.get('/order', { onRequest: [auth] }, radiologyController.getAllRadiologyOrders)
    fastify.post('/order', { onRequest: [auth] }, radiologyController.createRadiologyOrder)
    fastify.get('/order/:id', { onRequest: [auth] }, radiologyController.getRadiologyOrderById)
    fastify.put('/order/:id', { onRequest: [auth] }, radiologyController.updateRadiologyOrder)
    fastify.delete('/order/:id', { onRequest: [auth] }, radiologyController.deleteRadiologyOrder)

}
