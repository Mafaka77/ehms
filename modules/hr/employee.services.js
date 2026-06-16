const Employee = require('./employee.model')
const STATUS_CODES = require('../../utils/statuscode')
const Designation = require('../master/designation.model')
const User = require('../auth/user.model')
const Role = require('../auth/role.model')
const bcrypt = require('bcrypt')

exports.createEmployee = async (data) => {
    try {
        const existingEmployee = await Employee.findOne({ mobile: data.mobile })
        if (existingEmployee) {
            const error = new Error('Employee already exists')
            error.status = STATUS_CODES.CONFLICT
            throw error
        }

        const employee = await Employee.create(data)

        // Auto-create User account if designation is a nursing role
        let autoUserCreated = false
        if (data.designationId) {
            try {
                const designation = await Designation.findById(data.designationId)
                const isNurse = designation && /nurs/i.test(designation.designationName)

                if (isNurse && data.email) {
                    const nurseRole = await Role.findOne({ name: { $regex: 'nurs', $options: 'i' } })
                    if (!nurseRole) {
                        console.warn('[Employee] No Nurse role found in DB — skipping auto user creation')
                    } else {
                        const existingUser = await User.findOne({ email: data.email })
                        if (existingUser) {
                            console.info(`[Employee] User already exists for ${data.email} — skipping`)
                        } else {
                            const hashedPassword = await bcrypt.hash(String(data.mobile), 10)
                            await User.create({
                                fullName: employee.fullName,
                                email: employee.email,
                                password: hashedPassword,
                                role: nurseRole._id,
                                roles: [nurseRole._id]
                            })
                            autoUserCreated = true
                            console.info(`[Employee] Auto-created nurse User for ${data.email}`)
                        }
                    }
                }
            } catch (userErr) {
                // Don't fail the whole request if user auto-creation fails
                console.error('[Employee] Failed to auto-create nurse User:', userErr.message)
            }
        }

        const created = await Employee.findById(employee._id)
            .populate('designationId', 'designationName')

        return { employee: created, autoUserCreated }
    } catch (error) {
        throw error
    }
}

exports.getAllEmployees = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeCode: { $regex: search, $options: 'i' } }
            ]
        }

        if (query.departmentId) {
            filter.departmentId = query.departmentId
        }
        if (query.employmentType) {
            filter.employmentType = query.employmentType
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            filter.isActive = query.isActive === 'true' || query.isActive === true
        }

        const total = await Employee.countDocuments(filter)
        const employees = await Employee.find(filter)
            .populate('departmentId', 'name')
            .populate('designationId', 'designationName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            employees,
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

exports.deleteEmployee = async (id) => {
    try {
        const employee = await Employee.findByIdAndDelete(id)
        if (!employee) {
            const error = new Error('Employee not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return employee
    } catch (error) {
        throw error
    }
}

exports.updateEmployee = async (id, data) => {
    try {
        const employee = await Employee.findByIdAndUpdate(id, data, { new: true })
            .populate('departmentId', 'name')
            .populate('designationId', 'designationName')
        if (!employee) {
            const error = new Error('Employee not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return employee
    } catch (error) {
        throw error
    }
}
