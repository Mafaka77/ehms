const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const nursingController = require('./nursing.controller')
const assignmentController = require('./nursing_assignment.controller')

module.exports = async (fastify, options) => {
    // Generate next station code preview
    fastify.get('/station/generate-code', { onRequest: [auth] }, nursingController.generateStationCode)

    // Nursing Station REST endpoints
    fastify.post('/station', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','NursingManager'])] }, nursingController.createNursingStation)
    fastify.get('/stations', { onRequest: [auth] }, nursingController.getAllNursingStations)
    fastify.get('/station/:id', { onRequest: [auth] }, nursingController.getNursingStationById)
    fastify.put('/station/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','NursingManager'])] }, nursingController.updateNursingStation)
    fastify.delete('/station/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','NursingManager'])] }, nursingController.deleteNursingStation)
  // My Station endpoint for logged-in nurse
  fastify.get('/my-station', { onRequest: [auth] }, nursingController.getMyStation)

    // Wards helper endpoint
    fastify.get('/wards', { onRequest: [auth] }, nursingController.getAllWards)

    // Nurses filtered by role
    fastify.get('/nurses', { onRequest: [auth] }, nursingController.getNursesByRole)
    
    // Get station by nurse
    fastify.get('/station-by-nurse', { onRequest: [auth] }, nursingController.getStationByNurse)

    // Nursing Assignment CRUD
    fastify.post('/assignment', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'NursingManager'])] }, assignmentController.createAssignment)
    fastify.get('/assignments', { onRequest: [auth] }, assignmentController.getAllAssignments)
    fastify.get('/assignment/:id', { onRequest: [auth] }, assignmentController.getAssignmentById)
    fastify.put('/assignment/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'NursingManager'])] }, assignmentController.updateAssignment)
    fastify.delete('/assignment/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'NursingManager'])] }, assignmentController.deleteAssignment)
}
