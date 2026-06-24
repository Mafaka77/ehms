const Supplier = require('./medicine_supplier.model')
const MedicineCategory = require('./medicine_category.model')
const Medicine = require('./medicine.model')
const MedicineBatch = require('./medicine_batch.model')
const PharmacySale = require('./pharmacy_sale.model')
const PharmacySaleItem = require('./pharmacy_sale_item.model')
const STATUS_CODES = require('../../utils/statuscode')
const MedicineIpdOrder = require('./medicine_ipd_order.model')
const MedicineIpdOrderItem = require('./medicine_idp_order_item.model')
const Admission = require('../clinical/ipd/admission.model')
const nursingServices = require('../nursing/nursing.services')

// ── Suppliers ──────────────────────────────────────────────

exports.createSupplier = async (data) => {
    try {
        if (data.supplierCode && typeof data.supplierCode === 'string' && data.supplierCode.trim()) {
            const existing = await Supplier.findOne({ supplierCode: data.supplierCode.toUpperCase() })
            if (existing) {
                const error = new Error('Supplier with this code already exists')
                error.status = STATUS_CODES.CONFLICT
                throw error
            }
        } else {
            delete data.supplierCode
        }
        return await Supplier.create(data)
    } catch (error) {
        throw error
    }
}

exports.getAllSuppliers = async (query = {}) => {
    try {
        const page  = parseInt(query.page)  || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip  = (page - 1) * limit

        let filter = {}
        if (search) {
            filter.$or = [
                { supplierName: { $regex: search, $options: 'i' } },
                { supplierCode: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ]
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total     = await Supplier.countDocuments(filter)
        const suppliers = await Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

        return { suppliers, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
    } catch (error) {
        throw error
    }
}

exports.getSupplierById = async (id) => {
    try {
        const supplier = await Supplier.findById(id)
        if (!supplier) {
            const error = new Error('Supplier not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return supplier
    } catch (error) {
        throw error
    }
}

exports.updateSupplier = async (id, data) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!supplier) {
            const error = new Error('Supplier not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return supplier
    } catch (error) {
        throw error
    }
}

exports.deleteSupplier = async (id) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(id)
        if (!supplier) {
            const error = new Error('Supplier not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return supplier
    } catch (error) {
        throw error
    }
}

// ── Categories ─────────────────────────────────────────────

exports.createCategory = async (data) => {
    try {
        const existing = await MedicineCategory.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } })
        if (existing) {
            const error = new Error('Medicine category with this name already exists')
            error.status = STATUS_CODES.CONFLICT
            throw error
        }
        return await MedicineCategory.create(data)
    } catch (error) {
        throw error
    }
}

exports.getAllCategories = async (query = {}) => {
    try {
        const page  = parseInt(query.page)  || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip  = (page - 1) * limit

        let filter = {}
        if (search) {
            filter.name = { $regex: search, $options: 'i' }
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total      = await MedicineCategory.countDocuments(filter)
        const categories = await MedicineCategory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

        return { categories, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
    } catch (error) {
        throw error
    }
}

exports.getCategoryById = async (id) => {
    try {
        const category = await MedicineCategory.findById(id)
        if (!category) {
            const error = new Error('Medicine category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

exports.updateCategory = async (id, data) => {
    try {
        if (data.name) {
            const existing = await MedicineCategory.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') }, _id: { $ne: id } })
            if (existing) {
                const error = new Error('Medicine category with this name already exists')
                error.status = STATUS_CODES.CONFLICT
                throw error
            }
        }
        const category = await MedicineCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!category) {
            const error = new Error('Medicine category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

exports.deleteCategory = async (id) => {
    try {
        const Medicine = require('./medicine.model')
        const inUse = await Medicine.findOne({ categoryId: id })
        if (inUse) {
            const error = new Error('Cannot delete category because it is assigned to medicines')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const category = await MedicineCategory.findByIdAndDelete(id)
        if (!category) {
            const error = new Error('Medicine category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

// ── Medicines ──────────────────────────────────────────────

exports.createMedicine = async (data) => {
    try {
        if (!data.medicineCode || data.medicineCode.trim() === '') {
            // Auto generateMED-XXXXX
            let uniqueCode = false;
            let attempt = 0;
            while (!uniqueCode && attempt < 10) {
                const randomPart = Math.floor(10000 + Math.random() * 90000);
                const code = `MED-${randomPart}`;
                const exists = await Medicine.findOne({ medicineCode: code });
                if (!exists) {
                    data.medicineCode = code;
                    uniqueCode = true;
                }
                attempt++;
            }
            if (!uniqueCode) {
                data.medicineCode = `MED-${Date.now()}`;
            }
        }

        const existingCode = await Medicine.findOne({ medicineCode: data.medicineCode?.toUpperCase() })
        if (existingCode) {
            const error = new Error('Medicine with this code already exists')
            error.status = STATUS_CODES.CONFLICT
            throw error
        }
        return await Medicine.create(data)
    } catch (error) {
        throw error
    }
}

exports.getAllMedicines = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter.$or = [
                { medicineName: { $regex: search, $options: 'i' } },
                { medicineCode: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { brandName: { $regex: search, $options: 'i' } }
            ]
        }
        if (query.categoryId) {
            filter.categoryId = query.categoryId
        }
        if (query.supplierId) {
            filter.supplierId = query.supplierId
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total = await Medicine.countDocuments(filter)
        const medicines = await Medicine.find(filter)
            .populate('categoryId')
            .populate('supplierId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        // Dynamically compute stock and sale rate from active batches
        const medicineIds = medicines.map(m => m._id)
        const allBatches = await MedicineBatch.find({ medicineId: { $in: medicineIds }, isActive: true })

        const medicinesWithStats = medicines.map(med => {
            const medObj = med.toObject()
            const medBatches = allBatches.filter(b => b.medicineId.toString() === med._id.toString())
            
            const currentStock = medBatches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
            const sortedBatches = [...medBatches].sort((a, b) => b.createdAt - a.createdAt)
            const saleRate = sortedBatches.length > 0 ? sortedBatches[0].saleRate : 0

            medObj.currentStock = currentStock
            medObj.saleRate = saleRate
            return medObj
        })

        return { medicines: medicinesWithStats, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
    } catch (error) {
        throw error
    }
}

exports.getMedicineById = async (id) => {
    try {
        const medicine = await Medicine.findById(id).populate('categoryId').populate('supplierId')
        if (!medicine) {
            const error = new Error('Medicine not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const batches = await MedicineBatch.find({ medicineId: id, isActive: true }).sort({ createdAt: -1 })
        const currentStock = batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
        const saleRate = batches.length > 0 ? batches[0].saleRate : 0

        const medObj = medicine.toObject()
        medObj.currentStock = currentStock
        medObj.saleRate = saleRate

        return medObj
    } catch (error) {
        throw error
    }
}

exports.updateMedicine = async (id, data) => {
    try {
        if (data.medicineCode) {
            const existingCode = await Medicine.findOne({ medicineCode: data.medicineCode.toUpperCase(), _id: { $ne: id } })
            if (existingCode) {
                const error = new Error('Medicine with this code already exists')
                error.status = STATUS_CODES.CONFLICT
                throw error
            }
        }
        const medicine = await Medicine.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('categoryId').populate('supplierId')
        if (!medicine) {
            const error = new Error('Medicine not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const batches = await MedicineBatch.find({ medicineId: id, isActive: true }).sort({ createdAt: -1 })
        const currentStock = batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
        const saleRate = batches.length > 0 ? batches[0].saleRate : 0

        const medObj = medicine.toObject()
        medObj.currentStock = currentStock
        medObj.saleRate = saleRate

        return medObj
    } catch (error) {
        throw error
    }
}

exports.deleteMedicine = async (id) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(id)
        if (!medicine) {
            const error = new Error('Medicine not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        // Delete related batches
        await MedicineBatch.deleteMany({ medicineId: id })
        return medicine
    } catch (error) {
        throw error
    }
}

// ── Medicine Batches ────────────────────────────────────────

exports.createBatch = async (data) => {
    try {
        const existing = await MedicineBatch.findOne({ medicineId: data.medicineId, batchNo: data.batchNo })
        if (existing) {
            const error = new Error('Batch number already exists for this medicine')
            error.status = STATUS_CODES.CONFLICT
            throw error
        }
        return await MedicineBatch.create(data)
    } catch (error) {
        throw error
    }
}

exports.getBatchesByMedicineId = async (medicineId) => {
    try {
        return await MedicineBatch.find({ medicineId }).sort({ createdAt: -1 })
    } catch (error) {
        throw error
    }
}

exports.updateBatch = async (id, data) => {
    try {
        if (data.batchNo && data.medicineId) {
            const existing = await MedicineBatch.findOne({ 
                medicineId: data.medicineId, 
                batchNo: data.batchNo, 
                _id: { $ne: id } 
            })
            if (existing) {
                const error = new Error('Batch number already exists for this medicine')
                error.status = STATUS_CODES.CONFLICT
                throw error
            }
        }
        const batch = await MedicineBatch.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!batch) {
            const error = new Error('Batch not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return batch
    } catch (error) {
        throw error
    }
}

exports.deleteBatch = async (id) => {
    try {
        const batch = await MedicineBatch.findByIdAndDelete(id)
        if (!batch) {
            const error = new Error('Batch not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return batch
    } catch (error) {
        throw error
    }
}

// ── Pharmacy Sales ──────────────────────────────────────────

exports.createSale = async (createdBy, data) => {
    try {
        const { patientId, opdVisitId, admissionId, totalAmount, remarks, customerName, customerPhone, items } = data
        
        if (!items || items.length === 0) {
            const error = new Error('Sale must contain at least one item')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Validate stock for each item first
        for (const item of items) {
            const batch = await MedicineBatch.findById(item.batchId)
            if (!batch) {
                const error = new Error(`Batch not found for batchId: ${item.batchId}`)
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
            if (batch.currentStock < item.quantity) {
                const error = new Error(`Insufficient stock for batch ${batch.batchNo}. Available: ${batch.currentStock}`)
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }

        // Create the sale
        const sale = await PharmacySale.create({
            patientId: patientId || null,
            opdVisitId: opdVisitId || null,
            admissionId: admissionId || null,
            totalAmount,
            remarks,
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            createdBy
        })

        // Save items and deduct stock
        const saleItems = []
        for (const item of items) {
            const batch = await MedicineBatch.findById(item.batchId)
            batch.currentStock -= item.quantity
            await batch.save()

            const saleItem = await PharmacySaleItem.create({
                saleId: sale._id,
                medicineId: item.medicineId,
                batchId: item.batchId,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount
            })
            saleItems.push(saleItem)
        }

        return { sale, items: saleItems }
    } catch (error) {
        throw error
    }
}

exports.getAllSales = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter.$or = [
                { saleNo: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ]
        }
        if (query.admissionId) {
            filter.admissionId = query.admissionId
        }
        if (query.patientId) {
            filter.patientId = query.patientId
        }

        const total = await PharmacySale.countDocuments(filter)
        const sales = await PharmacySale.find(filter)
            .populate('patientId')
            .populate('createdBy')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return { sales, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
    } catch (error) {
        throw error
    }
}

exports.getSaleById = async (id) => {
    try {
        const sale = await PharmacySale.findById(id)
            .populate('patientId')
            .populate('createdBy')
        
        if (!sale) {
            const error = new Error('Sale not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const items = await PharmacySaleItem.find({ saleId: id })
            .populate('medicineId')
            .populate('batchId')

        return { sale, items }
    } catch (error) {
        throw error
    }
}

// ── IPD Medicine Orders ──────────────────────────────────────

exports.createIpdOrder = async (userId, data) => {
    try {
        const admission = await Admission.findById(data.admissionId).populate('bedId')
        if (!admission) {
            const error = new Error('Admission record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        let nursingStationId = data.nursingStationId
        if (!nursingStationId && admission.bedId) {
            nursingStationId = admission.bedId.nursingStationId
        }

        if (!nursingStationId) {
            try {
                const station = await nursingServices.getStationByNurse(userId)
                if (station) {
                    nursingStationId = station._id
                }
            } catch (err) {
                // ignore
            }
        }

        if (!nursingStationId) {
            const error = new Error('Nursing station is required for IPD orders')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const items = data.items || []
        if (items.length === 0) {
            const error = new Error('Order must contain at least one medicine')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Validate stock for each requested medicine before proceeding
        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId)
            if (!medicine) {
                const error = new Error(`Medicine not found for ID: ${item.medicineId}`)
                error.status = STATUS_CODES.NOT_FOUND
                throw error
            }
            const batches = await MedicineBatch.find({ medicineId: item.medicineId, isActive: true })
            const totalStock = batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
            if (totalStock < item.quantity) {
                const error = new Error(`Insufficient stock for medicine ${medicine.medicineName}. Requested: ${item.quantity}, Available: ${totalStock}`)
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }

        const order = new MedicineIpdOrder({
            admissionId: data.admissionId,
            patientId: admission.patientId,
            nursingStationId,
            requestedBy: userId,
            doctorId: data.doctorId || admission.consultantDoctorId || null,
            priority: data.priority || 'NORMAL',
            remarks: data.remarks || null,
            status: 'PENDING'
        })
        await order.save()

        const itemsToCreate = (data.items || []).map(item => ({
            medicineIpdOrderId: order._id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            issuedQuantity: 0,
            remarks: item.remarks || null
        }))

        let createdItems = []
        if (itemsToCreate.length > 0) {
            createdItems = await MedicineIpdOrderItem.insertMany(itemsToCreate)
        }

        // populate medicine details
        const populatedItems = await MedicineIpdOrderItem.find({ medicineIpdOrderId: order._id }).populate('medicineId')

        return { order, items: populatedItems }
    } catch (error) {
        throw error
    }
}

exports.getIpdOrdersByAdmission = async (admissionId) => {
    try {
        const orders = await MedicineIpdOrder.find({ admissionId })
            .populate('patientId')
            .populate('doctorId')
            .populate('requestedBy', 'fullName')
            .populate('nursingStationId')
            .sort({ createdAt: -1 })

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await MedicineIpdOrderItem.find({ medicineIpdOrderId: order._id }).populate('medicineId')
            return {
                ...order.toObject(),
                items
            }
        }))

        return ordersWithItems
    } catch (error) {
        throw error
    }
}

exports.getAllIpdOrders = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const skip = (page - 1) * limit
        const status = query.status
        const search = query.search

        let filter = {}
        if (status) {
            filter.status = status
        }
        if (search) {
            filter.$or = [
                { requestNo: { $regex: search, $options: 'i' } }
            ]
        }

        const total = await MedicineIpdOrder.countDocuments(filter)
        const orders = await MedicineIpdOrder.find(filter)
            .populate({
                path: 'admissionId',
                populate: {
                    path: 'bedId',
                    populate: {
                        path: 'wardId'
                    }
                }
            })
            .populate('patientId')
            .populate('doctorId')
            .populate('requestedBy', 'fullName')
            .populate('nursingStationId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await MedicineIpdOrderItem.find({ medicineIpdOrderId: order._id }).populate('medicineId')
            return {
                ...order.toObject(),
                items
            }
        }))

        return {
            orders: ordersWithItems,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        throw error
    }
}

exports.updateIpdOrderStatus = async (orderId, status) => {
    try {
        const order = await MedicineIpdOrder.findById(orderId)
        if (!order) {
            const error = new Error('Order not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        order.status = status
        await order.save()

        if (status === 'ISSUED') {
            const items = await MedicineIpdOrderItem.find({ medicineIpdOrderId: orderId }).populate('medicineId')
            const PatientCharge = require('../common/patient_charge.model')
            const MedicineBatch = require('./medicine_batch.model')
            const ChargeCategory = require('../clinical/ipd/ipd_charge_category.model')

            const pharmacyCategory = await ChargeCategory.findOne({ code: 'PHARMACY' })
            if (!pharmacyCategory) {
                const error = new Error('Pharmacy charge category not found. Please run seeders.')
                error.status = STATUS_CODES.INTERNAL_SERVER_ERROR
                throw error
            }

            for (const item of items) {
                // Get saleRate of the latest active batch of this medicine
                const batches = await MedicineBatch.find({ 
                    medicineId: item.medicineId?._id || item.medicineId, 
                    isActive: true 
                }).sort({ createdAt: -1 })
                const rate = batches.length > 0 ? batches[0].saleRate : 50

                item.issuedQuantity = item.quantity
                item.rate = rate
                item.amount = item.quantity * rate
                await item.save()

                // Create patient charge for the issued medicine
                await PatientCharge.create({
                    admissionId: order.admissionId,
                    sourceType: 'PHARMACY',
                    patientId: order.patientId,
                    chargeCategoryId: pharmacyCategory._id,
                    description: `Dispensed: ${item.quantity} units of ${item.medicineId?.medicineName || 'medicine'}`,
                    sourceId: item._id,
                    quantity: item.quantity,
                    rate: rate,
                    amount: item.quantity * rate,
                    isBilled: false
                })
            }
        }

        return order
    } catch (error) {
        throw error
    }
}

exports.returnIpdMedicineItem = async (itemId, returnQty, remarks) => {
    try {
        const item = await MedicineIpdOrderItem.findById(itemId).populate('medicineId')
        if (!item) {
            const error = new Error('Medicine order item not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const maxReturnable = item.issuedQuantity - item.returnedQuantity
        if (returnQty > maxReturnable) {
            const error = new Error(`Cannot return more than issued/remaining quantity. Max returnable: ${maxReturnable}`)
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        item.returnedQuantity += returnQty
        if (remarks) {
            item.remarks = item.remarks ? `${item.remarks} | Returned: ${remarks}` : `Returned: ${remarks}`
        }
        // Update both quantity and amount on the order item to reflect the net remaining quantity
        item.quantity = item.issuedQuantity - item.returnedQuantity
        item.amount = item.quantity * (item.rate || 0)
        await item.save()

        // Update original positive patient charge document inside PatientCharge
        const PatientCharge = require('../common/patient_charge.model')
        const charge = await PatientCharge.findOne({ sourceId: item._id })
        if (charge) {
            charge.quantity = item.quantity
            charge.amount = charge.quantity * charge.rate
            charge.description = `Dispensed: ${item.quantity} units of ${item.medicineId?.medicineName || 'medicine'}`
            await charge.save()
        }

        return item
    } catch (error) {
        throw error
    }
}
