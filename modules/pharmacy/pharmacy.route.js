const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const pharmacyController = require('./pharmacy.controller')

module.exports = async (fastify, options) => {

    // ── Supplier routes ────────────────────────────────────
    fastify.post('/supplier',     { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.createSupplier)
    fastify.get('/suppliers',     { onRequest: [auth] },                                                                   pharmacyController.getAllSuppliers)
    fastify.get('/supplier/:id',  { onRequest: [auth] },                                                                   pharmacyController.getSupplierById)
    fastify.put('/supplier/:id',  { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.updateSupplier)
    fastify.delete('/supplier/:id',{ onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] },                  pharmacyController.deleteSupplier)

    // ── Category routes ────────────────────────────────────
    fastify.post('/category',     { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.createCategory)
    fastify.get('/categories',    { onRequest: [auth] },                                                                   pharmacyController.getAllCategories)
    fastify.get('/category/:id',  { onRequest: [auth] },                                                                   pharmacyController.getCategoryById)
    fastify.put('/category/:id',  { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.updateCategory)
    fastify.delete('/category/:id',{ onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] },                  pharmacyController.deleteCategory)

    // ── Medicine routes ────────────────────────────────────
    fastify.post('/medicine',     { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.createMedicine)
    fastify.get('/medicines',     { onRequest: [auth] },                                                                   pharmacyController.getAllMedicines)
    fastify.get('/medicine/:id',  { onRequest: [auth] },                                                                   pharmacyController.getMedicineById)
    fastify.put('/medicine/:id',  { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.updateMedicine)
    fastify.delete('/medicine/:id',{ onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] },                  pharmacyController.deleteMedicine)

    // ── Medicine Batch routes ──────────────────────────────
    fastify.post('/medicine-batch',       { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.createBatch)
    fastify.get('/medicine/:medicineId/batches', { onRequest: [auth] },                                                             pharmacyController.getBatchesByMedicineId)
    fastify.put('/medicine-batch/:id',    { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.updateBatch)
    fastify.delete('/medicine-batch/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] },                  pharmacyController.deleteBatch)

    // ── Pharmacy Sale routes ───────────────────────────────
    fastify.post('/sales',     { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin', 'PharmacyManager'])] }, pharmacyController.createSale)
    fastify.get('/sales',      { onRequest: [auth] },                                                                   pharmacyController.getAllSales)
    fastify.get('/sale/:id',   { onRequest: [auth] },                                                                   pharmacyController.getSaleById)

    // ── IPD Medicine Order routes ──────────────────────────
    fastify.post('/ipd-orders',                       { onRequest: [auth] }, pharmacyController.createIpdOrder)
    fastify.get('/ipd-orders/admission/:admissionId', { onRequest: [auth] }, pharmacyController.getIpdOrdersByAdmission)
    fastify.get('/ipd-orders',                        { onRequest: [auth] }, pharmacyController.getAllIpdOrders)
    fastify.put('/ipd-orders/:id/status',             { onRequest: [auth] }, pharmacyController.updateIpdOrderStatus)
    fastify.post('/ipd-orders/return',                { onRequest: [auth] }, pharmacyController.returnIpdMedicineItem)

}
