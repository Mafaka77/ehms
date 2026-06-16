const Ward = require('../clinical/ipd/ward.model')
const NursingStation = require('./nursing_station.model')
const Bed = require('../clinical/ipd/bed.model')
const Employee = require('../hr/employee.model')
const User = require('../auth/user.model')
const Role = require('../auth/role.model')
const Counter = require('../common/counter.model')
const STATUS_CODES = require('../../utils/statuscode')
const NursingAssignment = require('./nursing_assignment.model')

exports.generateStationCode = async () => {
    try {
        // Peek at the current counter to show next code (read-only, no increment)
        const counter = await Counter.findById('nursingStationCode')
        const nextSeq = counter ? counter.seq + 1 : 1
        return `NS-${String(nextSeq).padStart(3, '0')}`
    } catch (error) {
        throw error
    }
}


exports.getAllWards = async () => {
    try {
        let wards = await Ward.find({})
        if (wards.length === 0) {
            const defaultWards = [
                { code: 'GEN-MALE', name: 'General Ward - Male', wardType: 'GENERAL', floor: '1st Floor' },
                { code: 'GEN-FEMALE', name: 'General Ward - Female', wardType: 'GENERAL', floor: '1st Floor' },
                { code: 'ICU-A', name: 'Intensive Care Unit A', wardType: 'ICU', floor: '2nd Floor' },
                { code: 'PVT-DELUXE', name: 'Private Deluxe Ward', wardType: 'DELUXE', floor: '3rd Floor' }
            ]
            wards = await Ward.insertMany(defaultWards)
        }
        return wards
    } catch (error) {
        throw error
    }
}

exports.createNursingStation = async (data) => {
    try {
        // Remove code from data — the model pre-save hook auto-generates NS-XXX
        const { code, bedIds, ...stationData } = data
        if (stationData.wardId === '') {
            stationData.wardId = null
        }
        const station = await NursingStation.create(stationData)
        // Create alias assignment for incharge nurse if provided
        if (stationData.inchargeNurseId) {
          await NursingAssignment.create({
            nursingStationId: station._id,
            nurseId: stationData.inchargeNurseId,
            assignmentType: 'INCHARGE'
          })
        }
        
        if (bedIds && Array.isArray(bedIds) && bedIds.length > 0) {
            await Bed.updateMany(
                { _id: { $in: bedIds } },
                { $set: { nursingStationId: station._id } }
            )
        }

        return await NursingStation.findById(station._id)
            .populate('wardId', 'name code')
            .populate('inchargeNurseId', 'fullName email')
            .populate({
                path: 'assignedBeds',
                select: 'bedNo bedType status dailyRate floor wardId',
                populate: { path: 'wardId', select: 'name code' }
            })
    } catch (error) {
        throw error
    }
}

exports.getAllNursingStations = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const search = query.search || ''
        const skip = (page - 1) * limit

        let filter = {}
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ]
            }
        }

        const total = await NursingStation.countDocuments(filter)
        const stations = await NursingStation.find(filter)
            .populate('wardId', 'name code')
            .populate('inchargeNurseId', 'fullName email')
            .populate({
                path: 'assignedBeds',
                select: 'bedNo bedType status dailyRate floor wardId',
                populate: { path: 'wardId', select: 'name code' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        return {
            stations,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        throw error
    }
}

exports.getNursingStationById = async (id) => {
    try {
        const station = await NursingStation.findById(id)
            .populate('wardId', 'name code')
            .populate('inchargeNurseId', 'fullName email')
            .populate({
                path: 'assignedBeds',
                select: 'bedNo bedType status dailyRate floor wardId',
                populate: { path: 'wardId', select: 'name code' }
            })
        if (!station) {
            const error = new Error('Nursing Station not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return station
    } catch (error) {
        throw error
    }
}

exports.updateNursingStation = async (id, data) => {
    try {
        if (data.code) {
            const existing = await NursingStation.findOne({ 
                code: data.code.toUpperCase(), 
                _id: { $ne: id } 
            })
            if (existing) {
                const error = new Error('Nursing Station with this code already exists')
                error.status = STATUS_CODES.BAD_REQUEST
                throw error
            }
        }
        
        const { bedIds, ...stationData } = data
        if (stationData.wardId === '') {
            stationData.wardId = null
        }
        const station = await NursingStation.findByIdAndUpdate(id, stationData, { new: true, runValidators: true })
        if (!station) {
            const error = new Error('Nursing Station not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }

        if (bedIds && Array.isArray(bedIds)) {
            // First unassign all beds currently assigned to this station
            await Bed.updateMany(
                { nursingStationId: id },
                { $set: { nursingStationId: null } }
            )
            // Then assign the new beds
            if (bedIds.length > 0) {
                await Bed.updateMany(
                    { _id: { $in: bedIds } },
                    { $set: { nursingStationId: id } }
                )
            }
        }

        return await NursingStation.findById(id)
            .populate('wardId', 'name code')
            .populate('inchargeNurseId', 'fullName email')
            .populate({
                path: 'assignedBeds',
                select: 'bedNo bedType status dailyRate floor wardId',
                populate: { path: 'wardId', select: 'name code' }
            })
    } catch (error) {
        throw error
    }
}

exports.deleteNursingStation = async (id) => {
    try {
        // Unassign all beds assigned to this station
        await Bed.updateMany(
            { nursingStationId: id },
            { $set: { nursingStationId: null } }
        )
        // Delete related nursing assignments (alias)
        await NursingAssignment.deleteMany({ nursingStationId: id })
        const station = await NursingStation.findByIdAndDelete(id)
        if (!station) {
            const error = new Error('Nursing Station not found')
            error.status = STATUS_CODES.NOT_FOUND
            throw error
        }
        return station
    } catch (error) {
        throw error
    }
}

// --- NURSING SERVICE ---
exports.getStationByNurse = async (nurseId) => {
  // 1. Fetch the assignment (using .lean() for performance)
  const assignment = await NursingAssignment.findOne({
    nurseId,
    isActive: true
  })
  .populate({
    path: 'nursingStationId',
    populate: [
      { path: 'wardId', select: 'name code' },
      { path: 'inchargeNurseId', select: 'fullName email employeeCode' },
      { 
        path: 'assignedBeds', 
        populate: { path: 'wardId', select: 'name code floor' } 
      }
    ]
  })
  .lean(); // Returns a plain JS object, much faster than .toObject()

  if (!assignment) {
    const error = new Error('No active nursing station found for this nurse');
    error.status = STATUS_CODES.NOT_FOUND;
    throw error; // Bubbles straight up to the controller
  }

  const station = assignment.nursingStationId;

  // 2. Fetch all active co-workers at this exact station
  const nurses = await NursingAssignment.find({
    nursingStationId: station._id,
    isActive: true
  })
  .populate({
    path: 'nurseId',
    select: 'fullName email employeeCode'
  })
  .sort({ assignmentType: 1, createdAt: 1 })
  .lean(); 

  // 3. Attach the coworker data to the station payload
  station.nurses = nurses;
  station.nurseCount = nurses.length;

  return station;
};

// ---------------------------------------------------------------------------
// List all users that have a “nurse” role (used for assigning nurses to a
// station, populating the Assign‑Nurse dropdown, etc.).
// ---------------------------------------------------------------------------
exports.getNursesByRole = async () => {
    try {
        // Find all roles whose name contains 'Nurse' (case-insensitive)
        const nurseRoles = await Role.find({ name: { $regex: 'nurs', $options: 'i' } })
        const nurseRoleIds = nurseRoles.map(r => r._id)

        // Find users who have at least one nurse role
        const nurses = await User.find({
            $or: [
                { role: { $in: nurseRoleIds } },
                { roles: { $elemMatch: { $in: nurseRoleIds } } }
            ]
        })
        .select('_id fullName email role roles')
        .populate('role', 'name')
        .populate('roles', 'name')

        return nurses
    } catch (error) {
        throw error
    }
}
