const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const dashboardController = require('./dashboard.controller')

const adminRoles = ['SuperAdmin', 'HospitalAdmin']

module.exports = async function (fastify, opts) {
    fastify.get(
        '/admin/stats',
        { onRequest: [auth, authorizeRole(adminRoles)] },
        dashboardController.getAdminStats
    )
    fastify.get(
        '/admin/activity',
        { onRequest: [auth, authorizeRole(adminRoles)] },
        dashboardController.getRecentActivity
    )
    fastify.get(
        '/admin/chart',
        { onRequest: [auth, authorizeRole(adminRoles)] },
        dashboardController.getChartData
    )
}
