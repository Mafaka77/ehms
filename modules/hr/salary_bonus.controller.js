const salaryBonusService = require('./salary_bonus.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.upsertSalaryBonus = async (req, res) => {
    try {
        const userId = req.user._id
        const bonus = await salaryBonusService.upsertSalaryBonus({
            ...req.body,
            userId
        })
        return res.code(STATUS_CODES.OK).send({
            message: 'Salary bonus registered successfully',
            data: bonus,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getSalaryBonusesByMonth = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query
        const bonuses = await salaryBonusService.getSalaryBonusesByMonth({ month, year, employeeId })
        return res.code(STATUS_CODES.OK).send({
            message: 'Salary bonuses fetched successfully',
            data: bonuses,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteSalaryBonus = async (req, res) => {
    try {
        const { id } = req.params
        const bonus = await salaryBonusService.deleteSalaryBonus(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Salary bonus record deleted successfully',
            data: bonus,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
