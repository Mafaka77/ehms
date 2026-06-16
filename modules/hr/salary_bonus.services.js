const EmployeeSalaryBonus = require('./employee_salary_bonus.model')
const STATUS_CODES = require('../../utils/statuscode')

exports.upsertSalaryBonus = async (data) => {
    try {
        const { employeeId, month, year, bonus, bonusType, remarks, recurring, userId } = data

        const monthDate = new Date(month)
        monthDate.setUTCHours(0, 0, 0, 0)
        
        const isRecurring = recurring === true || recurring === 'true'

        let existingBonus = await EmployeeSalaryBonus.findOne({
            employeeId,
            ...(isRecurring ? { recurring: true } : { month: monthDate, year: parseInt(year), recurring: false })
        })

        if (existingBonus) {
            existingBonus.bonus = parseFloat(bonus)
            existingBonus.bonusType = bonusType
            existingBonus.remarks = remarks
            existingBonus.updatedBy = userId
            await existingBonus.save()
            return existingBonus
        } else {
            const newBonus = await EmployeeSalaryBonus.create({
                employeeId,
                month: monthDate,
                year: parseInt(year),
                bonus: parseFloat(bonus),
                bonusType,
                remarks,
                recurring: isRecurring,
                createdBy: userId,
                updatedBy: userId
            })
            return newBonus
        }
    } catch (error) {
        throw error
    }
}

exports.getSalaryBonusesByMonth = async (query = {}) => {
    try {
        const { month, year, employeeId } = query
        const filter = { isActive: true }

        if (employeeId) {
            filter.employeeId = employeeId
        }

        if (month && year) {
            const monthDate = new Date(month)
            monthDate.setUTCHours(0, 0, 0, 0)
            filter.$or = [
                { recurring: true },
                { month: monthDate, year: parseInt(year), recurring: false }
            ]
        } else if (month) {
            const monthDate = new Date(month)
            monthDate.setUTCHours(0, 0, 0, 0)
            filter.month = monthDate
        } else if (year) {
            filter.year = parseInt(year)
        }

        const bonuses = await EmployeeSalaryBonus.find(filter)
            .populate('employeeId')
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName')

        return bonuses
    } catch (error) {
        throw error
    }
}

exports.deleteSalaryBonus = async (id) => {
    try {
        const bonus = await EmployeeSalaryBonus.findByIdAndDelete(id)
        if (!bonus) {
            const error = new Error('Salary bonus record not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return bonus
    } catch (error) {
        throw error
    }
}
