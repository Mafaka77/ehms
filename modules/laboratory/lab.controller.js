const labService = require('./lab.services');
const STATUS_CODES = require('../../utils/statuscode')

// --- Lab Category ---

exports.createLabCategory = async (req, res) => {
    try {
        const category = await labService.createLabCategory(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab category created successfully', data: category, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabCategories = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await labService.getAllLabCategories({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab categories fetched successfully', 
            data: result.categories, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await labService.getLabCategoryById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab category fetched successfully', data: category, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await labService.updateLabCategory(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab category updated successfully', data: category, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await labService.deleteLabCategory(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab category deleted successfully', data: category, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// --- Lab Sample Type ---
exports.createLabSampleType = async (req, res) => {
    try {
        const sampleType = await labService.createLabSampleType(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab sample type created successfully', data: sampleType, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabSampleTypes = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await labService.getAllLabSampleTypes({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab sample types fetched successfully', 
            data: result.sampleTypes, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabSampleTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const sampleType = await labService.getLabSampleTypeById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab sample type fetched successfully', data: sampleType, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabSampleType = async (req, res) => {
    try {
        const { id } = req.params;
        const sampleType = await labService.updateLabSampleType(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab sample type updated successfully', data: sampleType, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabSampleType = async (req, res) => {
    try {
        const { id } = req.params;
        const sampleType = await labService.deleteLabSampleType(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab sample type deleted successfully', data: sampleType, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// --- Lab Test ---
exports.createLabTest = async (req, res) => {
    try {
        const test = await labService.createLabTest(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab test created successfully', data: test, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabTests = async (req, res) => {
    try {
        const { page, limit, search, sampleTypeId } = req.query
        const result = await labService.getAllLabTests({ page, limit, search, sampleTypeId });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab tests fetched successfully', 
            data: result.data || result.tests, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await labService.getLabTestById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test fetched successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await labService.updateLabTest(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test updated successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await labService.deleteLabTest(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test deleted successfully', data: test, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// --- Lab Test Parameter ---
exports.createLabTestParameter = async (req, res) => {
    try {
        const param = await labService.createLabTestParameter(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab test parameter created successfully', data: param, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabTestParameters = async (req, res) => {
    try {
        const { page, limit, search, testId } = req.query
        const result = await labService.getAllLabTestParameters({ page, limit, search, testId });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab test parameters fetched successfully', 
            data: result.data || result.parameters, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabTestParameterById = async (req, res) => {
    try {
        const { id } = req.params;
        const param = await labService.getLabTestParameterById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test parameter fetched successfully', data: param, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabTestParameter = async (req, res) => {
    try {
        const { id } = req.params;
        const param = await labService.updateLabTestParameter(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test parameter updated successfully', data: param, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabTestParameter = async (req, res) => {
    try {
        const { id } = req.params;
        const param = await labService.deleteLabTestParameter(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab test parameter deleted successfully', data: param, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.createLabOrder = async (req, res) => { 
    try {
        const order = await labService.createLabOrder(req.body, req.user?._id);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab order created successfully', data: order, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabOrders = async (req, res) => { 
    try {
        const { page, limit, search, paymentStatus, admissionId, patientId } = req.query
        const result = await labService.getAllLabOrders({ page, limit, search, paymentStatus, admissionId, patientId });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab orders fetched successfully', 
            data: result.data || result.orders, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabOrderById = async (req, res) => { 
    try {
        const { id } = req.params;
        const order = await labService.getLabOrderById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab order fetched successfully', data: order, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabOrder = async (req, res) => { 
    try {
        const { id } = req.params;
        const order = await labService.updateLabOrder(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab order updated successfully', data: order, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabOrder = async (req, res) => { 
    try {
        const { id } = req.params;
        const order = await labService.deleteLabOrder(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab order deleted successfully', data: order, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabStats = async (req, res) => {
    try {
        const stats = await labService.getLabStats();
        return res.code(STATUS_CODES.OK).send({ message: 'Lab stats fetched successfully', data: stats, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabOrderResults = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await labService.getLabOrderResults(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab order results fetched successfully', data: results, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.saveLabOrderResults = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await labService.saveLabOrderResults(id, req.body.results, req.user._id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab order results saved successfully', data: result, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

// --- Lab Instrument ---

exports.createLabInstrument = async (req, res) => {
    try {
        const instrument = await labService.createLabInstrument(req.body);
        return res.code(STATUS_CODES.CREATED).send({ message: 'Lab instrument created successfully', data: instrument, status: STATUS_CODES.CREATED })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getAllLabInstruments = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await labService.getAllLabInstruments({ page, limit, search });
        return res.code(STATUS_CODES.OK).send({ 
            message: 'Lab instruments fetched successfully', 
            data: result.instruments, 
            pagination: result.pagination,
            status: STATUS_CODES.OK 
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.getLabInstrumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const instrument = await labService.getLabInstrumentById(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab instrument fetched successfully', data: instrument, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.updateLabInstrument = async (req, res) => {
    try {
        const { id } = req.params;
        const instrument = await labService.updateLabInstrument(id, req.body);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab instrument updated successfully', data: instrument, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}

exports.deleteLabInstrument = async (req, res) => {
    try {
        const { id } = req.params;
        const instrument = await labService.deleteLabInstrument(id);
        return res.code(STATUS_CODES.OK).send({ message: 'Lab instrument deleted successfully', data: instrument, status: STATUS_CODES.OK })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: error.message, status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR })
    }
}
