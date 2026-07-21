const bcrypt = require('bcrypt')
const User = require('./user.model')
const STATUS_CODES = require('../../utils/statuscode')
require('./role.model')
require('./permission.model')
exports.login = async (data, fastify) => {
    const { email, password } = data
    const user = await User.findOne({ email })
        .populate({
            path:"role",
            select:"name permissions",
            populate:{
                path:"permissions",
                select:"code"
            }
        })
        .populate({
            path:"roles",
            select:"name permissions",
            populate:{
                path:"permissions",
                select:"code"
            }
        })
    if (!user) {
        const error = new Error('User not found')
        error.status = STATUS_CODES.NOT_FOUND
        throw error
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        const error = new Error('Invalid password')
        error.status = STATUS_CODES.UNAUTHORIZED
        throw error
    }
    const permissions = []
    if (user.role && Array.isArray(user.role.permissions)) {
        user.role.permissions.forEach((permission) => {
            if (permission && permission.code && !permissions.includes(permission.code)) {
                permissions.push(permission.code)
            }
        })
    }
    if (Array.isArray(user.roles)) {
        user.roles.forEach((r) => {
            if (r && Array.isArray(r.permissions)) {
                r.permissions.forEach((permission) => {
                    if (permission && permission.code && !permissions.includes(permission.code)) {
                        permissions.push(permission.code)
                    }
                })
            }
        })
    }

    // Store only minimal data in JWT — full role objects bloat the token past HTTP header limits (431)
    const token = fastify.jwt.sign({
        _id: user._id,
        roleName: user.role?.name || null,
        roleIds: (user.roles || []).map(r => r._id?.toString()),
        permissions
    })
    return token
}

const Role = require('./role.model')
const Employee = require('../hr/employee.model')

exports.getRoles = async () => {
    try {
        const roles = await Role.find({})
        return roles
    } catch (error) {
        throw error
    }
}

exports.createRole = async (data) => {
    try {
        const existingRole = await Role.findOne({ name: data.name })
        if (existingRole) {
            const error = new Error('Role name already exists')
            error.status = 400
            throw error
        }
        const role = new Role({
            name: data.name,
            permissions: data.permissions || []
        })
        await role.save()
        return role
    } catch (error) {
        throw error
    }
}

exports.updateRole = async (id, data) => {
    try {
        const role = await Role.findById(id)
        if (!role) {
            const error = new Error('Role not found')
            error.status = 404
            throw error
        }
        if (data.name && data.name !== role.name) {
            const existingRole = await Role.findOne({ name: data.name, _id: { $ne: id } })
            if (existingRole) {
                const error = new Error('Role name already exists')
                error.status = 400
                throw error
            }
            role.name = data.name
        }
        if (data.permissions) {
            role.permissions = data.permissions
        }
        await role.save()
        return role
    } catch (error) {
        throw error
    }
}

exports.checkLogin = async (email) => {
    try {
        if (!email) {
            return { enabled: false }
        }
        const user = await User.findOne({ email }).populate('role', 'name').populate('roles', 'name')
        if (user) {
            return { enabled: true, user }
        }
        return { enabled: false }
    } catch (error) {
        throw error
    }
}

exports.enableLogin = async (data) => {
    try {
        const { employeeId, password, roleId } = data

        const employee = await Employee.findById(employeeId)
        if (!employee) {
            const error = new Error('Employee not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const role = await Role.findById(roleId)
        if (!role) {
            const error = new Error('Role not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        let user = await User.findOne({ email: employee.email })
        if (user) {
            user.password = hashedPassword
            user.role = roleId
            user.roles = [roleId]
            user.fullName = employee.fullName
            await user.save()
        } else {
            user = await User.create({
                fullName: employee.fullName,
                email: employee.email,
                password: hashedPassword,
                role: roleId,
                roles: [roleId]
            })
        }

        return user
    } catch (error) {
        throw error
    }
}

const Permission = require('./permission.model')

exports.getAllUsers = async () => {
    try {
        const users = await User.find().populate('role', 'name').populate('roles', 'name')
        return users
    } catch (error) {
        throw error
    }
}

exports.getUserById = async (id) => {
    try {
        const user = await User.findById(id)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            })
            .populate({
                path: 'roles',
                populate: {
                    path: 'permissions'
                }
            })
        return user
    } catch (error) {
        throw error
    }
}

exports.deleteUser = async (id) => {
    try {
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            const error = new Error('User account not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return user
    } catch (error) {
        throw error
    }
}

exports.getAllPermissions = async () => {
    try {
        const permissions = await Permission.find()
        return permissions
    } catch (error) {
        throw error
    }
}

exports.createPermission = async (data) => {
    try {
        const permission = await Permission.create({
            code: data.code,
            name: data.name,
            module: data.module
        })
        
        // Automatically append to SuperAdmin role
        const superAdminRole = await Role.findOne({ name: 'SuperAdmin' })
        if (superAdminRole) {
            superAdminRole.permissions.push(permission._id)
            await superAdminRole.save()
        }

        return permission
    } catch (error) {
        if (error.code === 11000) {
            const duplicateError = new Error('Permission code already exists')
            duplicateError.status = STATUS_CODES.CONFLICT
            throw duplicateError
        }
        throw error
    }
}

exports.updateRolePermissions = async (roleId, permissionIds) => {
    try {
        const role = await Role.findById(roleId)
        if (!role) {
            const error = new Error('Role not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        role.permissions = permissionIds
        await role.save()
        return role
    } catch (error) {
        throw error
    }
}
exports.updateUser = async (id, data) => {
    try {
        const { roleId, roleIds, password } = data;
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('User not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        
        const targetRoleIds = roleIds || (Array.isArray(roleId) ? roleId : (roleId ? [roleId] : null));
        
        if (targetRoleIds && targetRoleIds.length > 0) {
            for (const rId of targetRoleIds) {
                const role = await Role.findById(rId);
                if (!role) {
                    const error = new Error(`Role not found: ${rId}`);
                    error.status = STATUS_CODES.NOT_FOUND;
                    throw error;
                }
            }
            user.roles = targetRoleIds;
            user.role = targetRoleIds[0];
        }
        
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        
        await user.save();
        return await User.findById(id).populate('role', 'name').populate('roles', 'name');
    } catch (error) {
        throw error;
    }
}
