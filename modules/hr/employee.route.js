const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const employeeController=require('./employee.controller')

module.exports = async (fastify, options) => {
    fastify.post('/employee', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, employeeController.createEmployee);
    fastify.get('/employees', { onRequest: [auth] }, employeeController.getAllEmployees);
    fastify.delete('/employee/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, employeeController.deleteEmployee);
    fastify.put('/employee/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, employeeController.updateEmployee);
}
