const auth = require('../../../middleware/auth')
const authorizeRole = require('../../../middleware/authorize')
const ipdController = require('./ipd.controller')

module.exports = async (fastify, options) => {
    // Wards CRUD endpoints
    fastify.post('/ward', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.createWard)
    fastify.get('/wards', { onRequest: [auth] }, ipdController.getAllWards)
    fastify.get('/ward/:id', { onRequest: [auth] }, ipdController.getWardById)
    fastify.put('/ward/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.updateWard)
    fastify.delete('/ward/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.deleteWard)



    // Beds CRUD endpoints
    fastify.post('/bed', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.createBed)
    fastify.get('/beds', { onRequest: [auth] }, ipdController.getAllBeds)
    fastify.get('/bed/:id', { onRequest: [auth] }, ipdController.getBedById)
    fastify.put('/bed/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.updateBed)
    fastify.delete('/bed/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.deleteBed)

    // Admissions CRUD endpoints
    fastify.post('/admission', { onRequest: [auth] }, ipdController.createAdmission)
    fastify.get('/admissions', { onRequest: [auth] }, ipdController.getAllAdmissions)
    fastify.get('/admission/:id', { onRequest: [auth] }, ipdController.getAdmissionById)
    fastify.put('/admission/:id', { onRequest: [auth] }, ipdController.updateAdmission)
    fastify.delete('/admission/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, ipdController.deleteAdmission)

    // Admission Notes / Files
    fastify.post('/admission/:id/notes', { onRequest: [auth] }, ipdController.createAdmissionNote)
    fastify.get('/admission/:id/notes', { onRequest: [auth] }, ipdController.getAdmissionNotes)
    fastify.post('/admission/:id/files', { onRequest: [auth] }, ipdController.uploadPatientFile)
    fastify.get('/admission/:id/files', { onRequest: [auth] }, ipdController.getPatientFiles)
    fastify.delete('/admission/files/:fileId', { onRequest: [auth] }, ipdController.deletePatientFile)
    fastify.get('/admission/files/:fileId/download', { onRequest: [auth] }, ipdController.downloadPatientFile)
    fastify.get('/admission/:id/bed-history', { onRequest: [auth] }, ipdController.getAdmissionBedHistory)
    fastify.put('/admission/bed-history/:id', { onRequest: [auth] }, ipdController.updateAdmissionBedHistory)

    // Patient Charges routes
    fastify.get('/admission/:id/charges', { onRequest: [auth] }, ipdController.getAdmissionCharges)
    fastify.post('/admission/:id/charge', { onRequest: [auth] }, ipdController.createAdmissionCharge)
    fastify.delete('/admission/charge/:id', { onRequest: [auth] }, ipdController.deleteAdmissionCharge)
    fastify.put('/admission/charge/:id', { onRequest: [auth] }, ipdController.updateAdmissionCharge)
    fastify.get('/charge-categories', { onRequest: [auth] }, ipdController.getAllChargeCategories)
    fastify.post('/charge-categories', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.createChargeCategory)
    fastify.get('/charge-categories/:id', { onRequest: [auth] }, ipdController.getChargeCategoryById)
    fastify.delete('/charge-categories/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.deleteChargeCategory)
    fastify.get('/charge-categories/:id/charge-masters', { onRequest: [auth] }, ipdController.getChargeMastersByCategory)
    fastify.post('/charge-categories/:id/charge-masters', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.createChargeMaster)
    fastify.delete('/charge-masters/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.deleteChargeMaster)
    fastify.put('/charge-masters/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.updateChargeMaster)

    // Charge Package Items routes
    fastify.get('/charge-masters/:id/package-items', { onRequest: [auth] }, ipdController.getPackageItems)
    fastify.post('/charge-masters/:id/package-items', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.addPackageItem)
    fastify.delete('/package-items/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin','Nurse'])] }, ipdController.deletePackageItem)

    // Admission Advances routes
    fastify.post('/admission/:id/advance', { onRequest: [auth] }, ipdController.createAdmissionAdvance)
    fastify.get('/admission/:id/advances', { onRequest: [auth] }, ipdController.getAdmissionAdvances)

    // Admission Bills
    fastify.get('/admission/:id/bills', { onRequest: [auth] }, ipdController.getAdmissionBills)
}
