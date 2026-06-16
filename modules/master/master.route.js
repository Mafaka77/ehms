const departmentController = require('./master.controller')
const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')

module.exports = async (fastify, options) => {
    fastify.post('/department', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.createDepartment);
    fastify.get('/departments', { onRequest: [auth] }, departmentController.getAllDepartment);
    fastify.delete('/department/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.deleteDepartment);
    fastify.put('/department/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.updateDepartment);

    fastify.post('/designation', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.createDesignation);
    fastify.get('/designations', { onRequest: [auth] }, departmentController.getAllDesignations);
    fastify.delete('/designation/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.deleteDesignation);
    fastify.put('/designation/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.updateDesignation);

    fastify.post('/specialization', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.createSpecialization);
    fastify.get('/specializations', { onRequest: [auth] }, departmentController.getAllSpecializations);
    fastify.delete('/specialization/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.deleteSpecialization);
    fastify.put('/specialization/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, departmentController.updateSpecialization);
}
