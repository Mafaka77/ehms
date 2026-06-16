const auth = require('../../middleware/auth')
const authorizeRole = require('../../middleware/authorize')
const salaryBonusController = require('./salary_bonus.controller')

module.exports = async (fastify, options) => {
    fastify.post('/salary-bonus', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, salaryBonusController.upsertSalaryBonus);
    fastify.get('/salary-bonuses', { onRequest: [auth] }, salaryBonusController.getSalaryBonusesByMonth);
    fastify.delete('/salary-bonus/:id', { onRequest: [auth, authorizeRole(['SuperAdmin', 'HospitalAdmin'])] }, salaryBonusController.deleteSalaryBonus);
}
