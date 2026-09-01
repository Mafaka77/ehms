const dashboardService = require('./dashboard.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.getAdminStats = async (req, reply) => {
    try {
        const stats = await dashboardService.getAdminDashboardStats()
        return reply.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Dashboard stats fetched successfully',
            data: stats
        })
    } catch (error) {
        return reply.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            success: false,
            message: error.message || 'Failed to fetch dashboard stats'
        })
    }
}

exports.getDefaultDashboard = async (req, reply) => {
    try {
        const data = await dashboardService.getDefaultDashboardData()
        return reply.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Default dashboard data fetched successfully',
            data
        })
    } catch (error) {
        return reply.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            success: false,
            message: error.message || 'Failed to fetch default dashboard data'
        })
    }
}

exports.getRecentActivity = async (req, reply) => {
    try {
        const activity = await dashboardService.getRecentActivity()
        return reply.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Recent activity fetched successfully',
            data: activity
        })
    } catch (error) {
        return reply.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            success: false,
            message: error.message || 'Failed to fetch recent activity'
        })
    }
}

exports.getChartData = async (req, reply) => {
    try {
        const chartData = await dashboardService.getMonthlyChartData()
        return reply.code(STATUS_CODES.OK).send({
            success: true,
            message: 'Chart data fetched successfully',
            data: chartData
        })
    } catch (error) {
        return reply.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            success: false,
            message: error.message || 'Failed to fetch chart data'
        })
    }
}
