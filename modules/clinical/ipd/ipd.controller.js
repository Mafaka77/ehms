const ipdService = require('./ipd.services')
const STATUS_CODES = require('../../../utils/statuscode')

// ==========================================
// Ward Controller
// ==========================================

exports.createWard = async (req, res) => {
    try {
        const ward = await ipdService.createWard(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Ward created successfully',
            data: ward,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllWards = async (req, res) => {
    try {
        const result = await ipdService.getAllWards(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Wards fetched successfully',
            data: result.wards,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getWardById = async (req, res) => {
    try {
        const ward = await ipdService.getWardById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Ward fetched successfully',
            data: ward,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateWard = async (req, res) => {
    try {
        const ward = await ipdService.updateWard(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Ward updated successfully',
            data: ward,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteWard = async (req, res) => {
    try {
        const ward = await ipdService.deleteWard(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Ward deleted successfully',
            data: ward,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// ==========================================
// Bed Controller
// ==========================================

exports.createBed = async (req, res) => {
    try {
        const bed = await ipdService.createBed(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Bed created successfully',
            data: bed,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllBeds = async (req, res) => {
    try {
        const result = await ipdService.getAllBeds(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Beds fetched successfully',
            data: result.beds,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getBedById = async (req, res) => {
    try {
        const bed = await ipdService.getBedById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bed fetched successfully',
            data: bed,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateBed = async (req, res) => {
    try {
        const bed = await ipdService.updateBed(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bed updated successfully',
            data: bed,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteBed = async (req, res) => {
    try {
        const bed = await ipdService.deleteBed(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bed deleted successfully',
            data: bed,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// ==========================================
// Admission Controller
// ==========================================

exports.createAdmission = async (req, res) => {
    try {
        const admission = await ipdService.createAdmission({
            ...req.body,
            createdBy: req.user?._id
        })
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Patient admitted successfully',
            data: admission,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllAdmissions = async (req, res) => {
    try {
        const result = await ipdService.getAllAdmissions(req.query)
        return res.code(STATUS_CODES.OK).send({
            message: 'Admissions fetched successfully',
            data: result.admissions,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAdmissionById = async (req, res) => {
    try {
        const admission = await ipdService.getAdmissionById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Admission fetched successfully',
            data: admission,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateAdmission = async (req, res) => {
    try {
        const admission = await ipdService.updateAdmission(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Admission details updated successfully',
            data: admission,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createAdmissionNote = async (req, res) => {
    try {
        const note = await ipdService.createAdmissionNote(req.params.id, req.body, req.user?._id)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Clinical note added successfully',
            data: note,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAdmissionNotes = async (req, res) => {
    try {
        const notes = await ipdService.getAdmissionNotes(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Notes fetched successfully',
            data: notes,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAdmissionBedHistory = async (req, res) => {
    try {
        const history = await ipdService.getAdmissionBedHistory(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bed history fetched successfully',
            data: history,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateAdmissionBedHistory = async (req, res) => {
    try {
        const history = await ipdService.updateAdmissionBedHistory(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Bed history updated successfully',
            data: history,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteAdmission = async (req, res) => {
    try {
        const admission = await ipdService.deleteAdmission(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Admission deleted successfully',
            data: admission,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAdmissionCharges = async (req, res) => {
    try {
        const charges = await ipdService.getAdmissionCharges(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charges fetched successfully',
            data: charges,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createAdmissionCharge = async (req, res) => {
    try {
        const charge = await ipdService.createAdmissionCharge(req.params.id, req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Charge added successfully',
            data: charge,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteAdmissionCharge = async (req, res) => {
    try {
        const charge = await ipdService.deleteAdmissionCharge(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge deleted successfully',
            data: charge,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateAdmissionCharge = async (req, res) => {
    try {
        const charge = await ipdService.updateAdmissionCharge(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge updated successfully',
            data: charge,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllChargeCategories = async (req, res) => {
    try {
        const categories = await ipdService.getAllChargeCategories()
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge categories fetched successfully',
            data: categories,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getChargeCategoryById = async (req, res) => {
    try {
        const category = await ipdService.getChargeCategoryById(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge category fetched successfully',
            data: category,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getChargeMastersByCategory = async (req, res) => {
    try {
        const masters = await ipdService.getChargeMastersByCategory(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge masters fetched successfully',
            data: masters,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createChargeMaster = async (req, res) => {
    try {
        const master = await ipdService.createChargeMaster(req.params.id, req.body, req.user?._id)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Charge master created successfully',
            data: master,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateChargeMaster = async (req, res) => {
    try {
        const master = await ipdService.updateChargeMaster(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge master updated successfully',
            data: master,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

// ==========================================
// Charge Package Item Controllers
// ==========================================

exports.getPackageItems = async (req, res) => {
    try {
        const items = await ipdService.getPackageItems(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Package items fetched successfully',
            data: items,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.addPackageItem = async (req, res) => {
    try {
        const item = await ipdService.addPackageItem(req.params.id, req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Package item added successfully',
            data: item,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deletePackageItem = async (req, res) => {
    try {
        const item = await ipdService.deletePackageItem(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Package item deleted successfully',
            data: item,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteChargeMaster = async (req, res) => {
    try {
        const master = await ipdService.deleteChargeMaster(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge master deleted successfully',
            data: master,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.uploadPatientFile = async (req, res) => {
    try {
        const fs = require('fs')
        const path = require('path')
        const { pipeline } = require('stream/promises')
        
        const admissionId = req.params.id
        const admission = await ipdService.getAdmissionById(admissionId)
        
        // Parse the multipart request
        const data = await req.file()
        if (!data) {
            return res.code(STATUS_CODES.BAD_REQUEST).send({
                message: 'No file uploaded',
                status: STATUS_CODES.BAD_REQUEST
            })
        }
        
        // Extract description from fields if present
        const description = data.fields?.description?.value || ''
        
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../../../uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        
        // Create a unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const fileExt = path.extname(data.filename)
        const originalName = data.filename
        const savedFileName = path.basename(originalName, fileExt) + '-' + uniqueSuffix + fileExt
        const filePath = path.join(uploadDir, savedFileName)
        
        // Save file stream to disk
        await pipeline(data.file, fs.createWriteStream(filePath))
        
        // Check file size on disk
        const stats = fs.statSync(filePath)
        
        // Call service to save metadata
        const fileDetails = {
            fileName: originalName,
            savedFileName,
            fileType: data.mimetype,
            fileSize: stats.size,
            fileUrl: 'placeholder',
            description
        }
        
        const fileDoc = await ipdService.createPatientFile(
            admission._id,
            admission.patientId?._id || admission.patientId,
            fileDetails,
            req.user?._id
        )
        
        // Update correct download url using the created file _id
        fileDoc.fileUrl = `/api/ipd/admission/files/${fileDoc._id}/download`
        await fileDoc.save()
        
        return res.code(STATUS_CODES.CREATED).send({
            message: 'File uploaded successfully',
            data: fileDoc,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getPatientFiles = async (req, res) => {
    try {
        const files = await ipdService.getPatientFiles(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient files fetched successfully',
            data: files,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deletePatientFile = async (req, res) => {
    try {
        const file = await ipdService.deletePatientFile(req.params.fileId)
        return res.code(STATUS_CODES.OK).send({
            message: 'Patient file deleted successfully',
            data: file,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.downloadPatientFile = async (req, res) => {
    try {
        const fs = require('fs')
        const path = require('path')
        const IpdPatientFile = require('./ipd_patient_file.model')
        
        const file = await IpdPatientFile.findById(req.params.fileId)
        if (!file) {
            return res.code(STATUS_CODES.NOT_FOUND).send({
                message: 'File not found',
                status: STATUS_CODES.NOT_FOUND
            })
        }
        
        const filePath = path.join(__dirname, '../../../uploads', file.savedFileName)
        if (!fs.existsSync(filePath)) {
            return res.code(STATUS_CODES.NOT_FOUND).send({
                message: 'Physical file not found on server',
                status: STATUS_CODES.NOT_FOUND
            })
        }
        
        res.header('Content-Type', file.fileType)
        res.header('Content-Disposition', `attachment; filename="${file.fileName}"`)
        return res.send(fs.createReadStream(filePath))
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createChargeCategory = async (req, res) => {
    try {
        const category = await ipdService.createChargeCategory(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Charge category created successfully',
            data: category,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteChargeCategory = async (req, res) => {
    try {
        const category = await ipdService.deleteChargeCategory(req.params.id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Charge category deleted successfully',
            data: category,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}



