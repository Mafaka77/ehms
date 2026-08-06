const endoscopyController = require('./endoscopy.controller')
const auth = require('../../middleware/auth')

module.exports = async function (fastify, opts) {
    // --- Category Routes ---
    fastify.post('/category', { onRequest: [auth] }, endoscopyController.createCategory)
    fastify.get('/category', { onRequest: [auth] }, endoscopyController.getAllCategories)
    fastify.get('/category/:id', { onRequest: [auth] }, endoscopyController.getCategoryById)
    fastify.put('/category/:id', { onRequest: [auth] }, endoscopyController.updateCategory)
    fastify.delete('/category/:id', { onRequest: [auth] }, endoscopyController.deleteCategory)

    // --- Test Routes ---
    fastify.post('/test', { onRequest: [auth] }, endoscopyController.createTest)
    fastify.get('/test', { onRequest: [auth] }, endoscopyController.getAllTests)
    fastify.get('/test/:id', { onRequest: [auth] }, endoscopyController.getTestById)
    fastify.put('/test/:id', { onRequest: [auth] }, endoscopyController.updateTest)
    fastify.delete('/test/:id', { onRequest: [auth] }, endoscopyController.deleteTest)

    // --- Order Routes ---
    fastify.get('/order', { onRequest: [auth] }, endoscopyController.getAllEndoscopyOrders)
    fastify.post('/order', { onRequest: [auth] }, endoscopyController.createEndoscopyOrder)
    fastify.get('/order/:id', { onRequest: [auth] }, endoscopyController.getEndoscopyOrderById)
    fastify.put('/order/:id', { onRequest: [auth] }, endoscopyController.updateEndoscopyOrder)
    fastify.delete('/order/:id', { onRequest: [auth] }, endoscopyController.deleteEndoscopyOrder)
}
