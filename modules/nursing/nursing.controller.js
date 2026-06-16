const nursingService = require('./nursing.services')
const STATUS_CODES = require('../../utils/statuscode')

exports.generateStationCode = async (req, res) => {
    try {
        const code = await nursingService.generateStationCode()
        return res.code(STATUS_CODES.OK).send({
            message: 'Code generated',
            data: { code },
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}


exports.createNursingStation = async (req, res) => {
    try {
        const station = await nursingService.createNursingStation(req.body)
        return res.code(STATUS_CODES.CREATED).send({
            message: 'Nursing Station created successfully',
            data: station,
            status: STATUS_CODES.CREATED
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllNursingStations = async (req, res) => {
    try {
        const { page, limit, search } = req.query
        const result = await nursingService.getAllNursingStations({ page, limit, search })
        return res.code(STATUS_CODES.OK).send({
            message: 'Nursing Stations fetched successfully',
            data: result.stations,
            pagination: result.pagination,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getNursingStationById = async (req, res) => {
    try {
        const { id } = req.params
        const station = await nursingService.getNursingStationById(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Nursing Station fetched successfully',
            data: station,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.updateNursingStation = async (req, res) => {
    try {
        const { id } = req.params
        const station = await nursingService.updateNursingStation(id, req.body)
        return res.code(STATUS_CODES.OK).send({
            message: 'Nursing Station updated successfully',
            data: station,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.deleteNursingStation = async (req, res) => {
    try {
        const { id } = req.params
        const station = await nursingService.deleteNursingStation(id)
        return res.code(STATUS_CODES.OK).send({
            message: 'Nursing Station deleted successfully',
            data: station,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getAllWards = async (req, res) => {
    try {
        const wards = await nursingService.getAllWards()
        return res.code(STATUS_CODES.OK).send({
            message: 'Wards fetched successfully',
            data: wards,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
// --- NURSING CONTROLLER ---
exports.getMyStation = async (req, res) => {
  try {
    // req.user._id comes from your Fastify JWT Auth Middleware
    const station = await nursingService.getStationByNurse(req.user._id);

    return res.code(STATUS_CODES.OK).send({
      message: 'Your Nursing Station fetched successfully',
      data: station,
      status: STATUS_CODES.OK
    });

  } catch (error) {
    // Fastify handles this beautifully
    return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
      message: error.message,
      status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
    });
  }
};

exports.getNursesByRole = async (req, res) => {
    try {
        const nurses = await nursingService.getNursesByRole()
        return res.code(STATUS_CODES.OK).send({
            message: 'Nurses fetched successfully',
            data: nurses,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}

exports.getStationByNurse = async (req, res) => {
    try {
        const nurseId = req.query.nurseId || req.user._id
        const station = await nursingService.getStationByNurse(nurseId)
        return res.code(STATUS_CODES.OK).send({
            message: 'Nursing Station fetched successfully',
            data: station,
            status: STATUS_CODES.OK
        })
    } catch (error) {
        return res.code(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).send({
            message: error.message,
            status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        })
    }
}
