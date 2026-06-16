const Department=require('./department.model')
const Designation=require('./designation.model')
const Specialization=require('./specialization.model')
const STATUS_CODES = require('../../utils/statuscode')


exports.createDepartment=async(data)=>{
    try {
        const existingDepartment=await Department.findOne({name:data.name})
        if(existingDepartment){
            const error = new Error('Department already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const department=await Department.create(data)
        return department
    } catch (error) {
        throw error
    }
}

exports.getAllDepartment = async (query = {}) => {
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
                    { description: { $regex: search, $options: 'i' } }
                ]
            }
        }

        const total = await Department.countDocuments(filter)
        const departments = await Department.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            departments,
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

exports.deleteDepartment = async (id) => {
    try {
        const department = await Department.findByIdAndDelete(id)
        if (!department) {
            const error = new Error('Department not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return department
    } catch (error) {
        throw error
    }
}

exports.updateDepartment = async (id, data) => {
    try {
        if (data.name) {
            const existingDepartment = await Department.findOne({ name: data.name, _id: { $ne: id } })
            if (existingDepartment) {
                const error = new Error('Department name already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const department = await Department.findByIdAndUpdate(id, data, { new: true })
        if (!department) {
            const error = new Error('Department not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return department
    } catch (error) {
        throw error
    }
}

exports.createDesignation = async (data) => {
    try {
        const existingDesignation = await Designation.findOne({ 
            designationName: { $regex: new RegExp(`^${data.designationName.trim()}$`, 'i') }
        })
        if (existingDesignation) {
            const error = new Error('Designation already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const designation = await Designation.create(data)
        return await Designation.findById(designation._id)
    } catch (error) {
        throw error
    }
}

exports.getAllDesignations = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter.designationName = { $regex: search, $options: 'i' }
        }

        const total = await Designation.countDocuments(filter)
        const designations = await Designation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            designations,
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

exports.deleteDesignation = async (id) => {
    try {
        const designation = await Designation.findByIdAndDelete(id)
        if (!designation) {
            const error = new Error('Designation not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return designation
    } catch (error) {
        throw error
    }
}

exports.updateDesignation = async (id, data) => {
    try {
        if (data.designationName) {
            const existingDesignation = await Designation.findOne({ 
                designationName: { $regex: new RegExp(`^${data.designationName.trim()}$`, 'i') }, 
                _id: { $ne: id } 
            })
            if (existingDesignation) {
                const error = new Error('Designation already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const designation = await Designation.findByIdAndUpdate(id, data, { new: true })
        if (!designation) {
            const error = new Error('Designation not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return designation
    } catch (error) {
        throw error
    }
}

exports.createSpecialization=async(data)=>{
    try {
        const existingSpecialization=await Specialization.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') } },
                { code: data.code.trim().toUpperCase() }
            ]
        })
        if(existingSpecialization){
            const error = new Error('Specialization name or code already exists')
            error.status = STATUS_CODES.BAD_REQUEST
            throw error
        }
        const specialization=await Specialization.create({
            code: data.code.trim().toUpperCase(),
            name: data.name.trim(),
            description: data.description || '',
            isActive: data.isActive !== false
        })
        return specialization
    } catch (error) {
        throw error
    }
}

exports.getAllSpecializations = async (query = {}) => {
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
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }
        }

        const total = await Specialization.countDocuments(filter)
        const specializations = await Specialization.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            specializations,
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

exports.deleteSpecialization = async (id) => {
    try {
        const specialization = await Specialization.findByIdAndDelete(id)
        if (!specialization) {
            const error = new Error('Specialization not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return specialization
    } catch (error) {
        throw error
    }
}

exports.updateSpecialization = async (id, data) => {
    try {
        if (data.name) {
            const existingSpecialization = await Specialization.findOne({ name: data.name, _id: { $ne: id } })
            if (existingSpecialization) {
                const error = new Error('Specialization name already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        if (data.code) {
            const existingSpecialization = await Specialization.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } })
            if (existingSpecialization) {
                const error = new Error('Specialization code already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        const specialization = await Specialization.findByIdAndUpdate(id, data, { new: true })
        if (!specialization) {
            const error = new Error('Specialization not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return specialization
    } catch (error) {
        throw error
    }
}

