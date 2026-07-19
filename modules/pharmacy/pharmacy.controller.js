const pharmacyService = require('./pharmacy.services')
const STATUS_CODES = require('../../utils/statuscode')

// ── Suppliers ──────────────────────────────────────────────

exports.createSupplier = async (req, res) => {
    try {
        const supplier = await pharmacyService.createSupplier(req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Supplier created successfully', data: supplier, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllSuppliers = async (req, res) => {
    try {
        const { page, limit, search, isActive } = req.query
        const result = await pharmacyService.getAllSuppliers({ page, limit, search, isActive })
        return res.code(STATUS_CODES.OK).send({ message: 'Suppliers fetched successfully', data: result.suppliers, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await pharmacyService.getSupplierById(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Supplier fetched successfully', data: supplier, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await pharmacyService.updateSupplier(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Supplier updated successfully', data: supplier, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        await pharmacyService.deleteSupplier(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Supplier deleted successfully', status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── Categories ─────────────────────────────────────────────

exports.createCategory = async (req, res) => {
    try {
        const category = await pharmacyService.createCategory(req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Medicine category created successfully', data: category, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const { page, limit, search, isActive } = req.query
        const result = await pharmacyService.getAllCategories({ page, limit, search, isActive })
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine categories fetched successfully', data: result.categories, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getCategoryById = async (req, res) => {
    try {
        const category = await pharmacyService.getCategoryById(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine category fetched successfully', data: category, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const category = await pharmacyService.updateCategory(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine category updated successfully', data: category, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        await pharmacyService.deleteCategory(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine category deleted successfully', status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── Medicines ──────────────────────────────────────────────

exports.createMedicine = async (req, res) => {
    try {
        const medicine = await pharmacyService.createMedicine(req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Medicine created successfully', data: medicine, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllMedicines = async (req, res) => {
    try {
        const { page, limit, search, categoryId, supplierId, isActive } = req.query
        const result = await pharmacyService.getAllMedicines({ page, limit, search, categoryId, supplierId, isActive })
        return res.code(STATUS_CODES.OK).send({ message: 'Medicines fetched successfully', data: result.medicines, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getMedicineById = async (req, res) => {
    try {
        const medicine = await pharmacyService.getMedicineById(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine fetched successfully', data: medicine, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateMedicine = async (req, res) => {
    try {
        const medicine = await pharmacyService.updateMedicine(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine updated successfully', data: medicine, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteMedicine = async (req, res) => {
    try {
        await pharmacyService.deleteMedicine(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine deleted successfully', status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── Medicine Batches ────────────────────────────────────────

exports.createBatch = async (req, res) => {
    try {
        const batch = await pharmacyService.createBatch(req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Batch created successfully', data: batch, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getBatchesByMedicineId = async (req, res) => {
    try {
        const batches = await pharmacyService.getBatchesByMedicineId(req.params.medicineId)
        return res.code(STATUS_CODES.OK).send({ message: 'Batches fetched successfully', data: batches, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateBatch = async (req, res) => {
    try {
        const batch = await pharmacyService.updateBatch(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({ message: 'Batch updated successfully', data: batch, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteBatch = async (req, res) => {
    try {
        await pharmacyService.deleteBatch(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Batch deleted successfully', status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── Pharmacy Sales ──────────────────────────────────────────

exports.createSale = async (req, res) => {
    try {
        const result = await pharmacyService.createSale(req.user._id, req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'Sale processed successfully', data: result.sale, items: result.items, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllSales = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await pharmacyService.getAllSales({ page, limit, search })
        return res.code(STATUS_CODES.OK).send({ message: 'Sales fetched successfully', data: result.sales, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getSaleById = async (req, res) => {
    try {
        const result = await pharmacyService.getSaleById(req.params.id)
        return res.code(STATUS_CODES.OK).send({ message: 'Sale fetched successfully', data: result.sale, items: result.items, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── IPD Medicine Orders ──────────────────────────────────────

exports.createIpdOrder = async (req, res) => {
    try {
        const result = await pharmacyService.createIpdOrder(req.user._id, req.body)
        return res.code(STATUS_CODES.CREATED).send({ message: 'IPD Medicine Order created successfully', data: result.order, items: result.items, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getIpdOrdersByAdmission = async (req, res) => {
    try {
        const result = await pharmacyService.getIpdOrdersByAdmission(req.params.admissionId)
        return res.code(STATUS_CODES.OK).send({ message: 'IPD Medicine Orders fetched successfully', data: result, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllIpdOrders = async (req, res) => {
    try {
        const { page, limit, status, search } = req.query
        const result = await pharmacyService.getAllIpdOrders({ page, limit, status, search })
        return res.code(STATUS_CODES.OK).send({ message: 'IPD Medicine Orders fetched successfully', data: result.orders, pagination: result.pagination, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateIpdOrderStatus = async (req, res) => {
    try {
        const result = await pharmacyService.updateIpdOrderStatus(req.params.id, req.body.status, req.user?._id)
        return res.code(STATUS_CODES.OK).send({ message: 'IPD Medicine Order status updated successfully', data: result, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.returnIpdMedicineItem = async (req, res) => {
    try {
        const { itemId, quantity, remarks } = req.body
        const result = await pharmacyService.returnIpdMedicineItem(itemId, quantity, remarks)
        return res.code(STATUS_CODES.OK).send({ message: 'Medicine returned successfully', data: result, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// ── Pharmacy Indents ──────────────────────────────────────

exports.createIndent = async (req, res) => {
    try {
        const indent = await pharmacyService.createIndent(req.user._id, req.body)
        return res.code(STATUS_CODES.CREATED).send({
            success: true,
            message: 'Pharmacy Indent created successfully',
            data: indent
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getIndents = async (req, res) => {
    try {
        const result = await pharmacyService.getIndents(req.query)
        return res.code(STATUS_CODES.OK).send({
            success: true,
            data: result.indents,
            pagination: result.pagination
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getIndentById = async (req, res) => {
    try {
        const indent = await pharmacyService.getIndentById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            success: true,
            data: indent
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateIndentStatus = async (req, res) => {
    try {
        const indent = await pharmacyService.updateIndentStatus(req.params.id, req.user._id, req.body)
        return res.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Indent status updated successfully',
            data: indent
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateIndent = async (req, res) => {
    try {
        const indent = await pharmacyService.updateIndent(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Pharmacy Indent updated successfully',
            data: indent
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteIndent = async (req, res) => {
    try {
        await pharmacyService.deleteIndent(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Pharmacy Indent deleted successfully'
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}
