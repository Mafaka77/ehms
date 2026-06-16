const departmentService = require('./master.services');
const STATUS_CODES = require('../../utils/statuscode')

exports.createDepartment = async (req, res) => {
    try {
        const department = await departmentService.createDepartment(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Department created successfully', data: department, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({message:error.message,status:error.status || STATUS_CODES.INTERNAL_SERVER_ERROR})
    }
}

exports.getAllDepartment = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await departmentService.getAllDepartment({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Departments fetched successfully', 
            data: result.departments, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await departmentService.deleteDepartment(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Department deleted successfully', data: department, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await departmentService.updateDepartment(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Department updated successfully', data: department, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.createDesignation = async (req, res) => {
    try {
        const designation = await departmentService.createDesignation(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Designation created successfully', data: designation, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllDesignations = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await departmentService.getAllDesignations({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Designations fetched successfully', 
            data: result.designations, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const designation = await departmentService.deleteDesignation(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Designation deleted successfully', data: designation, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const designation = await departmentService.updateDesignation(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Designation updated successfully', data: designation, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.createSpecialization = async (req, res) => {
    try {
        const specialization = await departmentService.createSpecialization(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Specialization created successfully', data: specialization, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({message:error.message,status:error.status || STATUS_CODES.INTERNAL_SERVER_ERROR})
    }
}

exports.getAllSpecializations = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await departmentService.getAllSpecializations({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Specializations fetched successfully', 
            data: result.specializations, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const specialization = await departmentService.deleteSpecialization(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Specialization deleted successfully', data: specialization, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const specialization = await departmentService.updateSpecialization(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Specialization updated successfully', data: specialization, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

