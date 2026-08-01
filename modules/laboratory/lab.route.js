const auth = require('../../middleware/auth')
const labController = require('./lab.controller')

module.exports = async (fastify, options) => {

    // lab category routes
    fastify.post('/category', { onRequest: [auth] }, labController.createLabCategory);
    fastify.get('/category', { onRequest: [auth] }, labController.getAllLabCategories);
    fastify.get('/category/:id', { onRequest: [auth] }, labController.getLabCategoryById);
    fastify.put('/category/:id', { onRequest: [auth] }, labController.updateLabCategory);
    fastify.delete('/category/:id', { onRequest: [auth] }, labController.deleteLabCategory);

    // //lab sample type routes
    fastify.post('/sample-type', { onRequest: [auth] }, labController.createLabSampleType);
    fastify.get('/sample-type', { onRequest: [auth] }, labController.getAllLabSampleTypes);
    fastify.get('/sample-type/:id', { onRequest: [auth] }, labController.getLabSampleTypeById);
    fastify.put('/sample-type/:id', { onRequest: [auth] }, labController.updateLabSampleType);
    fastify.delete('/sample-type/:id', { onRequest: [auth] }, labController.deleteLabSampleType);

    // //lab test routes
    fastify.post('/test', { onRequest: [auth] }, labController.createLabTest);
    fastify.get('/test', { onRequest: [auth] }, labController.getAllLabTests);
    fastify.get('/test/:id', { onRequest: [auth] }, labController.getLabTestById);
    fastify.put('/test/:id', { onRequest: [auth] }, labController.updateLabTest);
    fastify.delete('/test/:id', { onRequest: [auth] }, labController.deleteLabTest);

    // //lab test parameter routes
    fastify.post('/test-parameter', { onRequest: [auth] }, labController.createLabTestParameter);
    fastify.get('/test-parameter', { onRequest: [auth] }, labController.getAllLabTestParameters);
    fastify.get('/test-parameter/:id', { onRequest: [auth] }, labController.getLabTestParameterById);
    fastify.put('/test-parameter/:id', { onRequest: [auth] }, labController.updateLabTestParameter);
    fastify.delete('/test-parameter/:id', { onRequest: [auth] }, labController.deleteLabTestParameter);

    // //lab order routes
    fastify.get('/stats', { onRequest: [auth] }, labController.getLabStats);
    fastify.post('/order', { onRequest: [auth] }, labController.createLabOrder);
    fastify.get('/order', { onRequest: [auth] }, labController.getAllLabOrders);
    fastify.get('/order/:id', { onRequest: [auth] }, labController.getLabOrderById);
    fastify.get('/order/:id/results', { onRequest: [auth] }, labController.getLabOrderResults);
    fastify.post('/order/:id/results', { onRequest: [auth] }, labController.saveLabOrderResults);
    fastify.put('/order/:id', { onRequest: [auth] }, labController.updateLabOrder);
    fastify.delete('/order/:id', { onRequest: [auth] }, labController.deleteLabOrder);

    // lab instrument routes
    fastify.post('/instrument', { onRequest: [auth] }, labController.createLabInstrument);
    fastify.get('/instrument', { onRequest: [auth] }, labController.getAllLabInstruments);
    fastify.get('/instrument/:id', { onRequest: [auth] }, labController.getLabInstrumentById);
    fastify.put('/instrument/:id', { onRequest: [auth] }, labController.updateLabInstrument);
    fastify.delete('/instrument/:id', { onRequest: [auth] }, labController.deleteLabInstrument);
}