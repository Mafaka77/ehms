const authService = require('./auth.services');
const STATUS_CODES = require('../../utils/statuscode')

exports.login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body, req.server)
        console.log(req.server)
       return res.code(STATUS_CODES.OK).send({
            status: "success",
            status: STATUS_CODES.OK,
            data: result
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: error.message
        })
    }
}

exports.getRoles = async (req, res) => {
    try {
        const roles = await authService.getRoles()
        return res.code(STATUS_CODES.OK).send({
            message: 'Roles fetched successfully',
            data: roles,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createRole = async (req, res) => {
    try {
        const role = await authService.createRole(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Role created successfully',
            data: role,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateRole = async (req, res) => {
    try {
        const role = await authService.updateRole(req.params.id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Role updated successfully',
            data: role,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.checkLogin = async (req, res) => {
    try {
        const { email } = req.query
        const status = await authService.checkLogin(email)
        return res.code(STATUS_CODES.OK).send({
            ...status,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.enableLogin = async (req, res) => {
    try {
        const { employeeId, password, roleId } = req.body
        const user = await authService.enableLogin({ employeeId, password, roleId })
        return res.code(STATUS_CODES.OK).send({
            message: 'User login enabled successfully',
            data: user,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await authService.getAllUsers()
        return res.code(STATUS_CODES.OK).send({
            message: 'Users fetched successfully',
            data: users,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await authService.getUserById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'User fetched successfully',
            data: user,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await authService.deleteUser(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'User account deleted successfully',
            data: user,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await authService.getAllPermissions()
        return res.code(STATUS_CODES.OK).send({
            message: 'Permissions fetched successfully',
            data: permissions,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.createPermission = async (req, res) => {
    try {
        const permission = await authService.createPermission(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Permission created successfully',
            data: permission,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params
        const { permissionIds } = req.body
        const role = await authService.updateRolePermissions(id, permissionIds)
        return res.code(STATUS_CODES.OK).send({
            message: 'Role permissions updated successfully',
            data: role,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const userData = req.body
        const user = await authService.updateUser(id, userData)
        return res.code(STATUS_CODES.OK).send({
            message: 'User updated successfully',
            data: user,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
