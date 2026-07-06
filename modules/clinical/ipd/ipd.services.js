const mongoose = require('mongoose')
const Ward = require('./ward.model')
const Bed = require('./bed.model')
const Admission = require('./admission.model')
const Patient = require('../../patients/patient.model')
const Doctor = require('../../hr/doctor.model')
const AdmissionNote = require('./admission_note.model')
const AdmissionAdvance = require('./admission_advance.model')
const STATUS_CODES = require('../../../utils/statuscode')

// ==========================================
// Ward Services
// ==========================================

exports.createWard = async (data) => {
    try {
        const existing = await Ward.findOne({ code: data.code.toUpperCase() })
        if (existing) {
            const error = new Error('Ward with this code already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        return await Ward.create({ ...data, code: data.code.toUpperCase() })
    } catch (error) {
        throw error
    }
}

exports.getAllWards = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            }
        }

        const total = await Ward.countDocuments(filter)
        const wards = await Ward.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            wards,
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

exports.getWardById = async (id) => {
    try {
        const ward = await Ward.findById(id)
        if (!ward) {
            const error = new Error('Ward not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return ward
    } catch (error) {
        throw error
    }
}

exports.updateWard = async (id, data) => {
    try {
        if (data.code) {
            const existing = await Ward.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } })
            if (existing) {
                const error = new Error('Ward with this code already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
            data.code = data.code.toUpperCase()
        }
        const ward = await Ward.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        if (!ward) {
            const error = new Error('Ward not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return ward
    } catch (error) {
        throw error
    }
}

exports.deleteWard = async (id) => {
    try {
        const linkedBeds = await Bed.countDocuments({ wardId: id })
        if (linkedBeds > 0) {
            const error = new Error('Cannot delete Ward. It contains active beds.')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const ward = await Ward.findByIdAndDelete(id)
        if (!ward) {
            const error = new Error('Ward not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return ward
    } catch (error) {
        throw error
    }
}

// ==========================================
// Bed Services
// ==========================================

exports.createBed = async (data) => {
    try {
        const existing = await Bed.findOne({ bedNo: data.bedNo, wardId: data.wardId })
        if (existing) {
            const error = new Error('Bed number already exists in this ward')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const bed = await Bed.create(data)
        return await Bed.findById(bed._id)
            .populate('wardId', 'name code')
            .populate('nursingStationId', 'name code')
    } catch (error) {
        throw error
    }
}

exports.getAllBeds = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 100
        const wardId = query.wardId
        const status = query.status
        const nursingStationId = query.nursingStationId
        const unassigned = query.unassigned
        const skip = (page - 1) * limit

        let filter = {}
        if (status) {
            filter.status = status
        }
        if (wardId) {
            filter.wardId = wardId
        }
        if (unassigned === 'true') {
            filter.nursingStationId = null
        } else if (nursingStationId) {
            filter.nursingStationId = nursingStationId
        }

        const total = await Bed.countDocuments(filter)
        const beds = await Bed.find(filter)
            .populate('wardId', 'name code')
            .populate('nursingStationId', 'name code')
            .sort({ bedNo: 1 })
            .skip(skip)
            .limit(limit)

        return {
            beds,
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

exports.getBedById = async (id) => {
    try {
        const bed = await Bed.findById(id)
            .populate('wardId', 'name code')
            .populate('nursingStationId', 'name code')
        if (!bed) {
            const error = new Error('Bed not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return bed
    } catch (error) {
        throw error
    }
}

exports.updateBed = async (id, data) => {
    try {
        if (data.bedNo && data.wardId) {
            const existing = await Bed.findOne({ bedNo: data.bedNo, wardId: data.wardId, _id: { $ne: id } })
            if (existing) {
                const error = new Error('Bed number already exists in this ward')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const bed = await Bed.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('wardId', 'name code')
            .populate('nursingStationId', 'name code')
        if (!bed) {
            const error = new Error('Bed not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return bed
    } catch (error) {
        throw error
    }
}

exports.deleteBed = async (id) => {
    try {
        const bed = await Bed.findById(id)
        if (!bed) {
            const error = new Error('Bed not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        if (bed.status === 'OCCUPIED') {
            const error = new Error('Cannot delete Bed. It is currently occupied.')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        await Bed.findByIdAndDelete(id)
        return bed
    } catch (error) {
        throw error
    }
}

// ==========================================
// Admission Services
// ==========================================

exports.createAdmission = async (data) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        // 1. Verify bed is available
        const bed = await Bed.findById(data.bedId).session(session)
        if (!bed) {
            const error = new Error('Bed not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        if (bed.status !== 'AVAILABLE') {
            const error = new Error('Selected bed is not available')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // 2. Verify patient exists
        const patient = await Patient.findById(data.patientId).session(session)
        if (!patient) {
            const error = new Error('Patient not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // 3. Verify doctor exists
        const doctor = await Doctor.findById(data.consultantDoctorId).session(session)
        if (!doctor) {
            const error = new Error('Doctor not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // 4. Create admission record
        const admissionData = {
            patientId: data.patientId,
            admissionDate: data.admissionDate || new Date(),
            admissionType: data.admissionType || 'NORMAL',
            consultantDoctorId: data.consultantDoctorId,
            bedId: data.bedId,
            diagnosis: data.diagnosis || null,
            status: 'ADMITTED',
            remarks: data.remarks || null,
            createdBy: data.createdBy || null
        }
        
        const [admission] = await Admission.create([admissionData], { session })

        // 5. Update bed status to OCCUPIED
        bed.status = 'OCCUPIED'
        await bed.save({ session })

        // 5.5 Register patient bed history
        const AdmissionBedHistory = require('./admission_bed_history.model')
        await AdmissionBedHistory.create([{
            admissionId: admission._id,
            wardId: bed.wardId,
            bedId: bed._id,
            fromDate: admission.admissionDate || new Date(),
            toDate: null,
            dailyRate: bed.dailyRate,
            totalDays: 0,
            totalAmount: 0,
            transferReason: 'Initial admission bed allocation',
            isCurrent: true,
            createdBy: data.createdBy || null
        }], { session })

        await session.commitTransaction()
        session.endSession()

        // Populate and return
        return await Admission.findById(admission._id)
            .populate('patientId')
            .populate('consultantDoctorId')
            .populate({
                path: 'bedId',
                populate: {
                    path: 'wardId'
                }
            })
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

exports.getAllAdmissions = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const status = query.status
        const consultantDoctorId = query.consultantDoctorId
        const search = query.search || ''
        const date = query.date
        const skip = (page - 1) * limit

        let filter = {}
        if (status) {
            filter.status = status
        }
        if (consultantDoctorId) {
            filter.consultantDoctorId = consultantDoctorId
        }
        if (date) {
            const startOfDay = new Date(date)
            startOfDay.setHours(0,0,0,0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23,59,59,999)
            filter.admissionDate = { $gte: startOfDay, $lte: endOfDay }
        }

        const nursingStationId = query.nursingStationId
        if (nursingStationId) {
            const beds = await Bed.find({ nursingStationId }).select('_id')
            const bedIds = beds.map(b => b._id)
            filter.bedId = { $in: bedIds }
        }

        if (search) {
            // Search patient first
            const patients = await Patient.find({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { patientCode: { $regex: search, $options: 'i' } },
                    { mobileNo: { $regex: search, $options: 'i' } }
                ]
            }).select('_id')
            const patientIds = patients.map(p => p._id)

            filter.$or = [
                { admissionNo: { $regex: search, $options: 'i' } },
                { patientId: { $in: patientIds } }
            ]
        }

        const total = await Admission.countDocuments(filter)
        const admissions = await Admission.find(filter)
            .populate('patientId')
            .populate('consultantDoctorId')
            .populate({
                path: 'bedId',
                populate: {
                    path: 'wardId'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            admissions,
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

exports.getAdmissionById = async (id) => {
    try {
        const admission = await Admission.findById(id)
            .populate('patientId')
            .populate('consultantDoctorId')
            .populate({
                path: 'bedId',
                populate: {
                    path: 'wardId'
                }
            })
        if (!admission) {
            const error = new Error('Admission not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return admission
    } catch (error) {
        throw error
    }
}

exports.updateAdmission = async (id, data) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const admission = await Admission.findById(id).session(session)
        if (!admission) {
            const error = new Error('Admission not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // If status changes to DISCHARGED or CANCELLED, we must make the bed AVAILABLE again!
        if (data.status && data.status !== admission.status) {
            if (['DISCHARGED', 'CANCELLED'].includes(data.status)) {
                const bed = await Bed.findById(admission.bedId).session(session)
                if (bed) {
                    bed.status = 'AVAILABLE'
                    await bed.save({ session })
                }

                // Close active bed history
                const AdmissionBedHistory = require('./admission_bed_history.model')
                const currentHistory = await AdmissionBedHistory.findOne({ admissionId: id, isCurrent: true }).session(session)
                if (currentHistory) {
                    currentHistory.toDate = new Date()
                    currentHistory.isCurrent = false
                    const diffTime = Math.abs(currentHistory.toDate - currentHistory.fromDate)
                    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                    currentHistory.totalDays = diffDays
                    currentHistory.totalAmount = diffDays * currentHistory.dailyRate
                    await currentHistory.save({ session })

                    // Add charge to PatientCharge
                    const PatientCharge = require('../../common/patient_charge.model')
                    const ChargeCategory = require('./ipd_charge_category.model')
                    const roomCategory = await ChargeCategory.findOne({ code: 'ROOM' })

                    await PatientCharge.create([{
                        admissionId: id,
                        patientId: admission.patientId,
                        chargeCategoryId: roomCategory?._id,
                        description: `IPD Bed Rental (Bed Rate: ₹${currentHistory.dailyRate}/day)`,
                        sourceId: currentHistory._id,
                        quantity: currentHistory.totalDays,
                        rate: currentHistory.dailyRate,
                        amount: currentHistory.totalAmount,
                        isBilled: false
                    }], { session })
                }
            } else if (data.status === 'ADMITTED') {
                const bed = await Bed.findById(admission.bedId).session(session)
                if (bed) {
                    bed.status = 'OCCUPIED'
                    await bed.save({ session })
                }

                // Re-open bed history if needed (or create one if not exists)
                const AdmissionBedHistory = require('./admission_bed_history.model')
                const currentHistory = await AdmissionBedHistory.findOne({ admissionId: id, isCurrent: true }).session(session)
                if (!currentHistory && bed) {
                    await AdmissionBedHistory.create([{
                        admissionId: id,
                        wardId: bed.wardId,
                        bedId: bed._id,
                        fromDate: new Date(),
                        toDate: null,
                        dailyRate: bed.dailyRate,
                        totalDays: 0,
                        totalAmount: 0,
                        transferReason: 'Re-admitted bed allocation',
                        isCurrent: true,
                        createdBy: data.createdBy || null
                    }], { session })
                }
            }
        }

        // If bed changes
        if (data.bedId && data.bedId.toString() !== admission.bedId.toString()) {
            // Free the old bed
            const oldBed = await Bed.findById(admission.bedId).session(session)
            if (oldBed) {
                oldBed.status = 'AVAILABLE'
                await oldBed.save({ session })
            }

            // Occupy the new bed
            const newBed = await Bed.findById(data.bedId).session(session)
            if (!newBed || newBed.status !== 'AVAILABLE') {
                const error = new Error('New bed is not available')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
            newBed.status = 'OCCUPIED'
            await newBed.save({ session })

            // Update bed history
            const AdmissionBedHistory = require('./admission_bed_history.model')
            const currentHistory = await AdmissionBedHistory.findOne({ admissionId: id, isCurrent: true }).session(session)
            if (currentHistory) {
                currentHistory.toDate = new Date()
                currentHistory.isCurrent = false
                const diffTime = Math.abs(currentHistory.toDate - currentHistory.fromDate)
                const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                currentHistory.totalDays = diffDays
                currentHistory.totalAmount = diffDays * currentHistory.dailyRate
                await currentHistory.save({ session })

                // Add charge to PatientCharge
                const PatientCharge = require('../../common/patient_charge.model')
                const ChargeCategory = require('./ipd_charge_category.model')
                const roomCategory = await ChargeCategory.findOne({ code: 'ROOM' })

                await PatientCharge.create([{
                    admissionId: id,
                    sourceType: 'IPD',
                    patientId: admission.patientId,
                    chargeCategoryId: roomCategory?._id,
                    description: `IPD Bed Rental (Bed Rate: ₹${currentHistory.dailyRate}/day)`,
                    sourceId: currentHistory._id,
                    quantity: currentHistory.totalDays,
                    rate: currentHistory.dailyRate,
                    amount: currentHistory.totalAmount,
                    isBilled: false
                }], { session })
            }

            await AdmissionBedHistory.create([{
                admissionId: id,
                wardId: newBed.wardId,
                bedId: newBed._id,
                fromDate: new Date(),
                toDate: null,
                dailyRate: newBed.dailyRate,
                totalDays: 0,
                totalAmount: 0,
                transferReason: data.transferReason || 'Bed transfer / reassignment',
                isCurrent: true,
                createdBy: data.createdBy || null
            }], { session })
        }

        Object.assign(admission, data)
        await admission.save({ session })

        await session.commitTransaction()
        session.endSession()

        return await Admission.findById(id)
            .populate('patientId')
            .populate('consultantDoctorId')
            .populate({
                path: 'bedId',
                populate: {
                    path: 'wardId'
                }
            })
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

// ==========================================
// Admission Note Services
// ==========================================

exports.createAdmissionNote = async (admissionId, data, userId) => {
    try {
        const admission = await Admission.findById(admissionId)
        if (!admission) {
            const error = new Error('Admission not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        const note = await AdmissionNote.create({
            admissionId,
            noteType: data.noteType || 'CLINICAL_NOTE',
            note: data.note,
            attachments: data.attachments || [],
            createdBy: userId
        })
        return await AdmissionNote.findById(note._id).populate('createdBy', 'fullName username')
    } catch (error) {
        throw error
    }
}

exports.getAdmissionNotes = async (admissionId) => {
    try {
        return await AdmissionNote.find({ admissionId })
            .populate('createdBy', 'fullName username')
            .sort({ createdAt: -1 })
    } catch (error) {
        throw error
    }
}

// ==========================================
// Patient File Services
// ==========================================

exports.createPatientFile = async (admissionId, patientId, fileDetails, userId) => {
    try {
        const IpdPatientFile = require('./ipd_patient_file.model')
        const fileDoc = await IpdPatientFile.create({
            admissionId,
            patientId,
            fileName: fileDetails.fileName,
            savedFileName: fileDetails.savedFileName,
            fileType: fileDetails.fileType,
            fileSize: fileDetails.fileSize,
            fileUrl: fileDetails.fileUrl,
            description: fileDetails.description || '',
            uploadedBy: userId
        })
        return await IpdPatientFile.findById(fileDoc._id).populate('uploadedBy', 'fullName username')
    } catch (error) {
        throw error
    }
}

exports.getPatientFiles = async (admissionId) => {
    try {
        const IpdPatientFile = require('./ipd_patient_file.model')
        return await IpdPatientFile.find({ admissionId })
            .populate('uploadedBy', 'fullName username')
            .sort({ createdAt: -1 })
    } catch (error) {
        throw error
    }
}

exports.deletePatientFile = async (fileId) => {
    try {
        const IpdPatientFile = require('./ipd_patient_file.model')
        const file = await IpdPatientFile.findById(fileId)
        if (!file) {
            const error = new Error('File not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        file.isDeleted = true
        file.deletedAt = new Date()
        await file.save()
        return file
    } catch (error) {
        throw error
    }
}

exports.getAdmissionBedHistory = async (admissionId) => {
    try {
        const AdmissionBedHistory = require('./admission_bed_history.model')
        return await AdmissionBedHistory.find({ admissionId })
            .populate('wardId')
            .populate('bedId')
            .populate('createdBy', 'fullName')
            .sort({ fromDate: -1 })
    } catch (error) {
        throw error
    }
}

exports.updateAdmissionBedHistory = async (id, data) => {
    try {
        const AdmissionBedHistory = require('./admission_bed_history.model')
        const history = await AdmissionBedHistory.findById(id)
        if (!history) {
            const error = new Error('Bed history record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (data.fromDate !== undefined) history.fromDate = data.fromDate
        if (data.toDate !== undefined) {
            history.toDate = data.toDate
            if (data.toDate === null || data.toDate === '') {
                history.toDate = null
                history.isCurrent = true
            } else {
                history.isCurrent = false
            }
        }
        if (data.totalDays !== undefined && data.totalDays !== null) {
            history.totalDays = Number(data.totalDays)
            history.totalAmount = history.totalDays * history.dailyRate
        }
        if (data.transferReason !== undefined) history.transferReason = data.transferReason

        await history.save()

        // Sync to PatientCharge
        const PatientCharge = require('../../common/patient_charge.model')
        const Admission = require('./admission.model')
        const admission = await Admission.findById(history.admissionId)

        const ChargeCategory = require('./ipd_charge_category.model')
        const roomCategory = await ChargeCategory.findOne({ code: 'ROOM' })

        let charge = await PatientCharge.findOne({ sourceId: history._id })
        if (history.isCurrent === false || history.totalDays > 0) {
            if (!charge) {
                charge = new PatientCharge({
                    admissionId: history.admissionId,
                    sourceType: 'IPD',
                    patientId: admission?.patientId,
                    chargeCategoryId: roomCategory?._id,
                    description: `IPD Bed Rental (Bed Rate: ₹${history.dailyRate}/day)`,
                    sourceId: history._id,
                    isBilled: false
                })
            }
            charge.quantity = history.totalDays || 1
            charge.rate = history.dailyRate
            charge.amount = (history.totalDays || 1) * history.dailyRate
            await charge.save()
        } else if (charge) {
            await charge.deleteOne()
        }

        return history
    } catch (error) {
        throw error
    }
}

exports.deleteAdmission = async (id) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const admission = await Admission.findById(id).session(session)
        if (!admission) {
            const error = new Error('Admission record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // 1. Release the occupied bed if the patient is currently admitted
        if (admission.status === 'ADMITTED' && admission.bedId) {
            const Bed = require('./bed.model')
            await Bed.findByIdAndUpdate(admission.bedId, { status: 'AVAILABLE' }).session(session)
        }

        // 2. Require all models for deletion
        const AdmissionBedHistory = require('./admission_bed_history.model')
        const AdmissionDoctor = require('./admission_doctor.model')
        const AdmissionNote = require('./admission_note.model')
        const DoctorVisit = require('./admission_doctor_visit.model')
        const PatientCharge = require('../../common/patient_charge.model')
        const PatientChargeAddon = require('../../common/patient_charge_addon.model')
        const IpdPatientFile = require('./ipd_patient_file.model')
        const MedicineIpdOrder = require('../../pharmacy/medicine_ipd_order.model')
        const MedicineIpdOrderItem = require('../../pharmacy/medicine_idp_order_item.model')
        const LabOrder = require('../../laboratory/lab_order.model')
        const LabOrderItem = require('../../laboratory/lab_order_item.model')
        const LabResult = require('../../laboratory/lab_result.model')
        const RadiologyOrder = require('../../radiology/radiology_order.model')
        const RadiologyOrderItem = require('../../radiology/radiology_order_item.model')
        const PharmacySale = require('../../pharmacy/pharmacy_sale.model')
        const PharmacySaleItem = require('../../pharmacy/pharmacy_sale_item.model')
        const Bill = require('../../accounting/bill.model')
        const BillItem = require('../../accounting/bill_item.model')

        // 3. Find IDs of parent documents to delete child documents
        const patientCharges = await PatientCharge.find({ admissionId: id }).session(session)
        const patientChargeIds = patientCharges.map(c => c._id)

        const orders = await MedicineIpdOrder.find({ admissionId: id }).session(session)
        const orderIds = orders.map(o => o._id)

        const labOrders = await LabOrder.find({ admissionId: id }).session(session)
        const labOrderIds = labOrders.map(o => o._id)

        const radOrders = await RadiologyOrder.find({ admissionId: id }).session(session)
        const radOrderIds = radOrders.map(o => o._id)

        const sales = await PharmacySale.find({ admissionId: id }).session(session)
        const saleIds = sales.map(s => s._id)

        const bills = await Bill.find({ admissionId: id }).session(session)
        const billIds = bills.map(b => b._id)

        // 4. Cascade soft delete all documents
        const deletedAt = new Date()
        const updateObj = { isDeleted: true, deletedAt }

        await AdmissionBedHistory.updateMany({ admissionId: id }, updateObj).session(session)
        await AdmissionDoctor.updateMany({ admissionId: id }, updateObj).session(session)
        await AdmissionNote.updateMany({ admissionId: id }, updateObj).session(session)
        await DoctorVisit.updateMany({ admissionId: id }, updateObj).session(session)
        await IpdPatientFile.updateMany({ admissionId: id }, updateObj).session(session)
        
        await PatientChargeAddon.updateMany({ patientChargeId: { $in: patientChargeIds } }, updateObj).session(session)
        await PatientCharge.updateMany({ admissionId: id }, updateObj).session(session)
        
        await MedicineIpdOrderItem.updateMany({ medicineIpdOrderId: { $in: orderIds } }, updateObj).session(session)
        await MedicineIpdOrder.updateMany({ admissionId: id }, updateObj).session(session)
        
        await LabResult.updateMany({ orderId: { $in: labOrderIds } }, updateObj).session(session)
        await LabOrderItem.updateMany({ orderId: { $in: labOrderIds } }, updateObj).session(session)
        await LabOrder.updateMany({ admissionId: id }, updateObj).session(session)
        
        await RadiologyOrderItem.updateMany({ orderId: { $in: radOrderIds } }, updateObj).session(session)
        await RadiologyOrder.updateMany({ admissionId: id }, updateObj).session(session)
        
        await PharmacySaleItem.updateMany({ saleId: { $in: saleIds } }, updateObj).session(session)
        await PharmacySale.updateMany({ admissionId: id }, updateObj).session(session)
        
        await BillItem.updateMany({ billId: { $in: billIds } }, updateObj).session(session)
        await Bill.updateMany({ admissionId: id }, updateObj).session(session)

        // Finally, soft delete the admission record itself
        admission.isDeleted = true
        admission.deletedAt = deletedAt
        await admission.save({ session })

        await session.commitTransaction()
        session.endSession()

        return admission
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

exports.getAdmissionCharges = async (admissionId) => {
    try {
        const PatientCharge = require('../../common/patient_charge.model')
        const PatientChargeAddon = require('../../common/patient_charge_addon.model')
        require('./ipd_charge_category.model') // ensure ChargeCategory schema is registered
        const charges = await PatientCharge.find({ admissionId })
            .populate('chargeCategoryId')
            .populate('doctorId', 'fullName name specializationId')
            .sort({ createdAt: -1 })
        
        const chargesWithAddons = await Promise.all(charges.map(async (charge) => {
            const addons = await PatientChargeAddon.find({ patientChargeId: charge._id })
                .populate('doctorId', 'fullName name specializationId')
            return {
                ...charge.toObject(),
                addons
            }
        }))
        return chargesWithAddons
    } catch (error) {
        throw error
    }
}

exports.createAdmissionCharge = async (admissionId, data, userId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const PatientCharge = require('../../common/patient_charge.model')
        const PatientChargeAddon = require('../../common/patient_charge_addon.model')
        const Admission = require('./admission.model')

        const admission = await Admission.findById(admissionId).session(session)
        if (!admission) {
            const error = new Error('Admission record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const rate = Number(data.rate)
        const quantity = Number(data.quantity || 1)
        const amount = rate * quantity
        const chargeDate = data.chargeDate ? new Date(data.chargeDate) : new Date()

        // Create main charge (rate = base rate only, NOT including addon amounts)
        const [charge] = await PatientCharge.create([{
            admissionId,
            sourceType: 'IPD',
            patientId: admission.patientId,
            chargeCategoryId: data.chargeCategoryId,
            chargeMasterId: data.chargeMasterId || null,
            description: data.description,
            quantity,
            rate,
            amount,
            sourceId: data.sourceId || data.chargeMasterId || null,
            isBilled: false,
            doctorId: data.doctorId || null,
            createdBy: userId || null,
            updatedBy: userId || null,
            createdAt: chargeDate
        }], { session })

        // Create addons as separate PatientChargeAddon records (amounts stored independently)
        if (data.addons && Array.isArray(data.addons) && data.addons.length > 0) {
            const addonRecords = data.addons.map(addon => ({
                patientChargeId: charge._id,
                itemName: addon.itemName,
                amount: Number(addon.amount || 0),
                packageItemId: addon.packageItemId || null,
                chargeCategoryId: addon.chargeCategoryId || data.chargeCategoryId,
                chargeMasterId: data.chargeMasterId || null,
                isCustom: !!addon.isCustom,
                doctorId: addon.doctorId || null,
                createdBy: userId || null,
                updatedBy: userId || null,
                createdAt: chargeDate
            }))
            await PatientChargeAddon.insertMany(addonRecords, { session })
        }

        await session.commitTransaction()
        session.endSession()

        return charge
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

exports.deleteAdmissionCharge = async (chargeId) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const PatientCharge = require('../../common/patient_charge.model')
        const PatientChargeAddon = require('../../common/patient_charge_addon.model')

        const charge = await PatientCharge.findById(chargeId).session(session)
        if (!charge) {
            const error = new Error('Charge record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (charge.isBilled) {
            const error = new Error('Cannot delete a charge that is already billed')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Delete all associated addons
        await PatientChargeAddon.deleteMany({ patientChargeId: chargeId }).session(session)
        await charge.deleteOne({ session })

        await session.commitTransaction()
        session.endSession()
        return charge
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}

exports.updateAdmissionCharge = async (chargeId, data, userId) => {
    try {
        const PatientCharge = require('../../common/patient_charge.model')
        const charge = await PatientCharge.findById(chargeId)
        if (!charge) {
            const error = new Error('Charge record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (charge.isBilled) {
            const error = new Error('Cannot update a charge that is already billed')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const rate = data.rate !== undefined ? Number(data.rate) : charge.rate
        const quantity = data.quantity !== undefined ? Number(data.quantity) : charge.quantity

        if (rate < 0) {
            const error = new Error('Rate cannot be negative')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        if (quantity <= 0) {
            const error = new Error('Quantity must be at least 1')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        charge.rate = rate
        charge.quantity = quantity
        charge.amount = rate * quantity
        if (userId) charge.updatedBy = userId

        await charge.save()
        return charge
    } catch (error) {
        throw error
    }
}

exports.getAllChargeCategories = async () => {
    try {
        const ChargeCategory = require('./ipd_charge_category.model')
        return await ChargeCategory.find({ isActive: true }).sort({ name: 1 })
    } catch (error) {
        throw error
    }
}

exports.getChargeCategoryById = async (id) => {
    try {
        const ChargeCategory = require('./ipd_charge_category.model')
        const category = await ChargeCategory.findById(id)
        if (!category) {
            const error = new Error('Charge category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return category
    } catch (error) {
        throw error
    }
}

exports.getChargeMastersByCategory = async (categoryId) => {
    try {
        const ChargeMaster = require('./ipd_charge_master.model')
        return await ChargeMaster.find({ categoryId }).sort({ name: 1 })
    } catch (error) {
        throw error
    }
}

exports.createChargeMaster = async (categoryId, data, userId) => {
    try {
        const ChargeMaster = require('./ipd_charge_master.model')
        
        let code = data.code ? data.code.toUpperCase().trim() : ''
        if (code) {
            const existing = await ChargeMaster.findOne({ code })
            if (existing) {
                const error = new Error(`Charge Master with code "${code}" already exists`)
                error.status = 400
                throw error
            }
        } else {
            // Auto-generate code from name
            let baseCode = data.name.toUpperCase().trim()
                .replace(/[^A-Z0-9\s]/g, '')
                .replace(/\s+/g, '_')
            
            code = baseCode
            let suffix = 1
            while (await ChargeMaster.findOne({ code })) {
                code = `${baseCode}_${suffix}`
                suffix++
            }
        }

        const chargeMaster = await ChargeMaster.create({
            categoryId,
            code,
            name: data.name,
            description: data.description || null,
            billingUnit: data.billingUnit || 'ITEM',
            standardRate: Number(data.standardRate),
            minimumRate: data.minimumRate !== undefined && data.minimumRate !== null && data.minimumRate !== '' ? Number(data.minimumRate) : null,
            maximumRate: data.maximumRate !== undefined && data.maximumRate !== null && data.maximumRate !== '' ? Number(data.maximumRate) : null,
            isVariableRate: !!data.isVariableRate,
            requiresApproval: !!data.requiresApproval,
            isPackage: !!data.isPackage,
            packageDurationType: data.packageDurationType || null,
            applicableTo: data.applicableTo || ['IPD'],
            remarks: data.remarks || null,
            createdBy: userId
        })

        return chargeMaster
    } catch (error) {
        throw error
    }
}

exports.updateChargeMaster = async (id, data) => {
    try {
        const ChargeMaster = require('./ipd_charge_master.model')
        const chargeMaster = await ChargeMaster.findById(id)
        if (!chargeMaster) {
            const error = new Error('Charge Master not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (data.code && data.code.toUpperCase().trim() !== chargeMaster.code) {
            const existing = await ChargeMaster.findOne({ code: data.code.toUpperCase().trim() })
            if (existing) {
                const error = new Error(`Charge Master with code "${data.code}" already exists`)
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
            chargeMaster.code = data.code.toUpperCase().trim()
        }

        if (data.name !== undefined) chargeMaster.name = data.name
        if (data.description !== undefined) chargeMaster.description = data.description || null
        if (data.billingUnit !== undefined) chargeMaster.billingUnit = data.billingUnit || 'ITEM'
        if (data.standardRate !== undefined) chargeMaster.standardRate = Number(data.standardRate)
        if (data.minimumRate !== undefined) chargeMaster.minimumRate = data.minimumRate !== null && data.minimumRate !== '' ? Number(data.minimumRate) : null
        if (data.maximumRate !== undefined) chargeMaster.maximumRate = data.maximumRate !== null && data.maximumRate !== '' ? Number(data.maximumRate) : null
        if (data.isVariableRate !== undefined) chargeMaster.isVariableRate = !!data.isVariableRate
        if (data.requiresApproval !== undefined) chargeMaster.requiresApproval = !!data.requiresApproval
        if (data.isPackage !== undefined) chargeMaster.isPackage = !!data.isPackage
        if (data.packageDurationType !== undefined) chargeMaster.packageDurationType = data.packageDurationType || null
        if (data.applicableTo !== undefined) chargeMaster.applicableTo = data.applicableTo || ['IPD']
        if (data.remarks !== undefined) chargeMaster.remarks = data.remarks || null

        await chargeMaster.save()
        return chargeMaster
    } catch (error) {
        throw error
    }
}

// ==========================================
// Charge Package Items Services
// ==========================================

exports.getPackageItems = async (chargeMasterId) => {
    try {
        const ChargePackageItem = require('./ipd_charge_package_item.model')
        return await ChargePackageItem.find({ chargeMasterId }).sort({ itemName: 1 })
    } catch (error) {
        throw error
    }
}

exports.addPackageItem = async (chargeMasterId, data) => {
    try {
        const ChargeMaster = require('./ipd_charge_master.model')
        const ChargePackageItem = require('./ipd_charge_package_item.model')

        const master = await ChargeMaster.findById(chargeMasterId)
        if (!master) {
            const error = new Error('Charge master not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (!data.itemName || !data.itemName.trim()) {
            const error = new Error('Item name is required')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        if (data.defaultAmount === undefined || data.defaultAmount === null || data.defaultAmount === '') {
            const error = new Error('Default amount is required')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const item = await ChargePackageItem.create({
            chargeMasterId,
            itemName: data.itemName.trim(),
            categoryCode: data.categoryCode || null,
            defaultAmount: Number(data.defaultAmount),
            isMandatory: data.isMandatory !== undefined ? !!data.isMandatory : true
        })

        // Recalculate and update master rate
        const allItems = await ChargePackageItem.find({ chargeMasterId })
        const totalRate = allItems.reduce((sum, it) => sum + (it.defaultAmount || 0), 0)
        master.standardRate = totalRate
        await master.save()

        return item
    } catch (error) {
        throw error
    }
}

exports.deletePackageItem = async (itemId) => {
    try {
        const ChargePackageItem = require('./ipd_charge_package_item.model')
        const ChargeMaster = require('./ipd_charge_master.model')
        const item = await ChargePackageItem.findById(itemId)
        if (!item) {
            const error = new Error('Package item not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        
        const chargeMasterId = item.chargeMasterId
        await item.deleteOne()

        // Recalculate and update master rate
        const master = await ChargeMaster.findById(chargeMasterId)
        if (master) {
            const allItems = await ChargePackageItem.find({ chargeMasterId })
            const totalRate = allItems.reduce((sum, it) => sum + (it.defaultAmount || 0), 0)
            master.standardRate = totalRate
            await master.save()
        }

        return item
    } catch (error) {
        throw error
    }
}

exports.deleteChargeMaster = async (id) => {
    try {
        const ChargeMaster = require('./ipd_charge_master.model')
        const ChargePackageItem = require('./ipd_charge_package_item.model')

        const master = await ChargeMaster.findById(id)
        if (!master) {
            const error = new Error('Charge master not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Cascade delete associated package items
        await ChargePackageItem.deleteMany({ chargeMasterId: id })

        await master.deleteOne()
        return master
    } catch (error) {
        throw error
    }
}

exports.createChargeCategory = async (data) => {
    try {
        const ChargeCategory = require('./ipd_charge_category.model')

        // Check if code is already taken
        const existing = await ChargeCategory.findOne({ code: data.code.toUpperCase().trim() })
        if (existing) {
            const error = new Error(`Charge Category with code "${data.code}" already exists`)
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        const category = await ChargeCategory.create({
            code: data.code.toUpperCase().trim(),
            name: data.name.trim(),
            description: data.description ? data.description.trim() : null,
            isActive: data.isActive !== undefined ? !!data.isActive : true
        })

        return category
    } catch (error) {
        throw error
    }
}

exports.deleteChargeCategory = async (id) => {
    try {
        const ChargeCategory = require('./ipd_charge_category.model')
        const ChargeMaster = require('./ipd_charge_master.model')
        const ChargePackageItem = require('./ipd_charge_package_item.model')

        const category = await ChargeCategory.findById(id)
        if (!category) {
            const error = new Error('Charge category not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        // Safeguard standard seed categories
        const protectedCodes = ['ROOM', 'LAB', 'PHARMACY', 'DOCTOR', 'ENDOSCOPY', 'RADIOLOGY']
        if (protectedCodes.includes(category.code)) {
            const error = new Error(`System protected category "${category.code}" cannot be deleted`)
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }

        // Fetch all charge masters for this category
        const masters = await ChargeMaster.find({ categoryId: id })
        const masterIds = masters.map(m => m._id)

        // Delete associated package items
        if (masterIds.length > 0) {
            await ChargePackageItem.deleteMany({ chargeMasterId: { $in: masterIds } })
        }

        // Delete associated charge masters
        await ChargeMaster.deleteMany({ categoryId: id })

        // Delete the category itself
        await category.deleteOne()
        return category
    } catch (error) {
        throw error
    }
}


// ==========================================
// Admission Advance Services
// ==========================================

exports.createAdmissionAdvance = async (admissionId, data, userId) => {
    try {
        const admission = await Admission.findById(admissionId)
        if (!admission) {
            const error = new Error('Admission not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const advance = new AdmissionAdvance({
            admissionId,
            patientId: admission.patientId,
            amount: data.amount,
            paymentMode: data.paymentMode,
            referenceNo: data.referenceNo,
            remarks: data.remarks,
            receivedBy: userId
        })

        await advance.save()

        return { success: true, data: advance, message: 'Advance payment recorded successfully' }
    } catch (error) {
        throw error
    }
}

exports.getAdmissionAdvances = async (admissionId) => {
    try {
        const advances = await AdmissionAdvance.find({ admissionId })
            .populate('receivedBy', 'fullName')
            .sort({ date: -1 })
            .lean()
        return { success: true, data: advances }
    } catch (error) {
        throw error
    }
}

exports.getAdmissionBills = async (admissionId) => {
    try {
        const Bill = mongoose.model('Bill')
        const bills = await Bill.find({ admissionId, billType: 'IPD' })
            .populate('generatedBy', 'fullName')
            .sort({ generatedAt: -1 })
            .lean()
        return { success: true, data: bills }
    } catch (error) {
        throw error
    }
}
