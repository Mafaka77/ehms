const employeeService = require('./employee.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.createEmployee = async (req, res) => {
    try {
        const result = await employeeService.createEmployee(req.body)
        const message = result.autoUserCreated
            ? 'Employee registered successfully. A nurse login account has been automatically created (default password: mobile number).'
            : 'Employee created successfully'
        return res.code(STATUS_CODES.CREATED).send({
            message,
            data: result.employee,
            autoUserCreated: result.autoUserCreated,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllEmployees = async (req, res) => {
    try {
        const { page, limit, search, departmentId, employmentType, isActive } = req.query
        const result = await employeeService.getAllEmployees({ page, limit, search, departmentId, employmentType, isActive });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Employees fetched successfully', 
            data: result.employees, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.deleteEmployee(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Employee deleted successfully', data: employee, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await employeeService.updateEmployee(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Employee updated successfully', data: employee, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}
