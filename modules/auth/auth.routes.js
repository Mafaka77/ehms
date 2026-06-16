const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const authController = require('./auth.controller')

module.exports = async function(fastify, opts){
    fastify.post('/login', authController.login)
    fastify.get('/roles', { onRequest: [auth] }, authController.getRoles)
    fastify.get('/check-login', { onRequest: [auth] }, authController.checkLogin)
    fastify.post('/enable-login', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.enableLogin)
    fastify.get('/users', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.getAllUsers)
    fastify.get('/users/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.getUserById)
    fastify.delete('/users/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.deleteUser)
    fastify.put('/users/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.updateUser)
    fastify.get('/permissions', { onRequest: [auth] }, authController.getAllPermissions)
    fastify.post('/permissions', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.createPermission)
    fastify.put('/roles/:id/permissions', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, authController.updateRolePermissions)
}