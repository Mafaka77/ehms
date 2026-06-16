const Role = require('../modules/auth/role.model')
const STATUS_CODES = require('../utils/statuscode')

function authorize(roles = []) {

  return async function (request, reply) {

    const roleNames = []

    // New slim JWT: roleName (string) + roleIds (array of id strings)
    if (request.user.roleName) {
      roleNames.push(request.user.roleName)
    }

    if (request.user.roleIds && Array.isArray(request.user.roleIds)) {
      for (const id of request.user.roleIds) {
        try {
          const dbRole = await Role.findById(id).select('name')
          if (dbRole && !roleNames.includes(dbRole.name)) {
            roleNames.push(dbRole.name)
          }
        } catch (err) { /* ignore */ }
      }
    }

    // Legacy JWT fallback: role object / roles array
    if (roleNames.length === 0) {
      const legacyRoles = []
      if (request.user.role) legacyRoles.push(request.user.role)
      if (request.user.roles && Array.isArray(request.user.roles)) {
        request.user.roles.forEach(r => { if (r) legacyRoles.push(r) })
      }
      for (const r of legacyRoles) {
        const name = typeof r === 'object' && r !== null ? r.name : r
        if (name) {
          roleNames.push(name)
        } else {
          const roleId = typeof r === 'object' && r !== null ? r._id : r
          if (roleId) {
            try {
              const dbRole = await Role.findById(roleId)
              if (dbRole) roleNames.push(dbRole.name)
            } catch (err) { /* ignore */ }
          }
        }
      }
    }

    const isAuthorized = roleNames.some(name => roles.includes(name))

    if (!isAuthorized) {
      return reply.code(STATUS_CODES.FORBIDDEN).send({
        success: false,
        message: 'Forbidden'
      })
    }

  }

}

module.exports = authorize