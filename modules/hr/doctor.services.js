const Employee = require('./employee.model')
const Doctor = require('./doctor.model')
const DoctorRemunerationRule = require('./doctor_renumeration_rule.model')
const STATUS_CODES = require('../../utils/statuscode')

exports.createDoctor = async (data) => {
    try {
        let employeeId = null;

        // If the doctor is permanent, we must create an Employee record first
        if (data.doctorType === 'PERMANENT') {
            const employeeData = {
                fullName: data.fullName,
                mobile: data.mobileNo,
                email: data.email,
                departmentId: data.departmentId,
                designationId: data.designationId,
                basicSalary: data.basicSalary || 0,
                employmentType: 'Permanent',
                joiningDate: data.joiningDate || new Date()
            };

            const newEmployee = await Employee.create(employeeData);
            employeeId = newEmployee._id;
        }

        const doctorData = {
            fullName: data.fullName,
            gender: data.gender,
            mobileNo: data.mobileNo,
            email: data.email,
            qualification: data.qualification,
            registrationNo: data.registrationNo,
            specializationId: data.specializationId,
            doctorType: data.doctorType,
            consultationFee: data.consultationFee,
            employeeId: employeeId
        };

        const doctor = await Doctor.create(doctorData);

        // Auto-create User account if requested
        let autoUserCreated = false;
        if (data.createLoginAccount && data.email && data.mobileNo) {
            try {
                const User = require('../auth/user.model');
                const Role = require('../auth/role.model');
                const bcrypt = require('bcrypt');

                const doctorRole = await Role.findOne({ name: { $regex: 'doctor|doc', $options: 'i' } });
                if (!doctorRole) {
                    console.warn('[Doctor] No Doctor role found in DB — skipping auto user creation');
                } else {
                    const existingUser = await User.findOne({ email: data.email });
                    if (existingUser) {
                        console.info(`[Doctor] User already exists for ${data.email} — skipping`);
                    } else {
                        const hashedPassword = await bcrypt.hash(String(data.mobileNo), 10);
                        await User.create({
                            fullName: doctor.fullName,
                            email: doctor.email,
                            password: hashedPassword,
                            role: doctorRole._id,
                            roles: [doctorRole._id]
                        });
                        autoUserCreated = true;
                        console.info(`[Doctor] Auto-created doctor User for ${data.email}`);
                    }
                }
            } catch (userErr) {
                console.error('[Doctor] Failed to auto-create doctor User:', userErr.message);
            }
        }

        return { doctor, autoUserCreated };
    } catch (error) {
        throw error;
    }
}

exports.getDoctors = async (query = {}) => {
    try {
        const { page = 1, limit = 10, search, type, doctorType, specializationId } = query;
        const queryObj = {};

        if (search) {
            queryObj.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { doctorCode: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const filterType = type || doctorType;
        if (filterType) {
            queryObj.doctorType = filterType;
        }

        if (specializationId) {
            queryObj.specializationId = specializationId;
        }

        const skip = (page - 1) * limit;

        const doctors = await Doctor.find(queryObj)
            .populate('specializationId', 'name')
            .populate('employeeId', 'employeeCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Doctor.countDocuments(queryObj);

        return {
            doctors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw error;
    }
}

exports.getDoctorById = async (id) => {
    try {
        const doctor = await Doctor.findById(id)
            .populate('specializationId', 'name')
            .populate('employeeId');
        
        if (!doctor) {
            const error = new Error('Doctor not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        return doctor;
    } catch (error) {
        throw error;
    }
}

// Remuneration Rules Services
exports.getRemunerationRules = async (doctorId) => {
    try {
        const rules = await DoctorRemunerationRule.find({ doctorId })
            .sort({ createdAt: -1 });
        return rules;
    } catch (error) {
        throw error;
    }
}

exports.createRemunerationRule = async (doctorId, data) => {
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            const error = new Error('Doctor not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        const ruleData = {
            ...data,
            doctorId: doctorId
        };

        const rule = await DoctorRemunerationRule.create(ruleData);
        return rule;
    } catch (error) {
        throw error;
    }
}

exports.deleteRemunerationRule = async (ruleId) => {
    try {
        const rule = await DoctorRemunerationRule.findByIdAndDelete(ruleId);
        if (!rule) {
            const error = new Error('Remuneration rule not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        return rule;
    } catch (error) {
        throw error;
    }
}
