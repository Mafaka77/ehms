const Patient = require('./patient.model');
const STATUS_CODES = require('../../utils/statuscode');

exports.getAllPatients = async (query = {}) => {
    try {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = query.search || '';
        const gender = query.gender || '';
        const bloodGroup = query.bloodGroup || '';

        const filter = {};

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobileNo: { $regex: search, $options: 'i' } },
                { patientCode: { $regex: search, $options: 'i' } },
                { alternateMobileNo: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (gender) {
            filter.gender = gender;
        }

        if (bloodGroup) {
            filter.bloodGroup = bloodGroup;
        }

        const total = await Patient.countDocuments(filter);
        const patients = await Patient.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            patients,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1
            }
        };
    } catch (error) {
        throw error;
    }
};

exports.searchPatients = async (query) => {
    try {
        const { search = '', limit = 10 } = query;
        const queryObj = {};

        if (search) {
            queryObj.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobileNo: { $regex: search, $options: 'i' } },
                { patientCode: { $regex: search, $options: 'i' } }
            ];
        }

        const patients = await Patient.find(queryObj)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        return patients;
    } catch (error) {
        throw error;
    }
};

exports.getPatientById = async (id) => {
    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            const error = new Error('Patient not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        return patient;
    } catch (error) {
        throw error;
    }
};

exports.createPatient = async (data) => {
    try {
        if (!data.fullName || !data.fullName.trim()) {
            const error = new Error('Full Name is required');
            error.status = STATUS_CODES.BAD_REQUEST;
            throw error;
        }
        if (!data.mobileNo || !data.mobileNo.trim()) {
            const error = new Error('Mobile Number is required');
            error.status = STATUS_CODES.BAD_REQUEST;
            throw error;
        }

        const patientData = {
            fullName: data.fullName.trim(),
            fathersName: data.fathersName ? data.fathersName.trim() : null,
            mothersName: data.mothersName ? data.mothersName.trim() : null,
            maritalStatus: data.maritalStatus || null,
            religion: data.religion ? data.religion.trim() : null,
            husbandwifeName: data.husbandwifeName ? data.husbandwifeName.trim() : null,
            contactPerson: data.contactPerson ? data.contactPerson.trim() : null,
            contactPersonRelation: data.contactPersonRelation ? data.contactPersonRelation.trim() : null,
            contactPersonAddress: data.contactPersonAddress ? data.contactPersonAddress.trim() : null,
            contactPersonMobile: data.contactPersonMobile ? data.contactPersonMobile.trim() : null,
            occupation: data.occupation || null,
            gender: data.gender,
            mobileNo: data.mobileNo.trim(),
            dateOfBirth: data.dateOfBirth || null,
            age: data.age != null ? Number(data.age) : null,
            bloodGroup: data.bloodGroup || null,
            alternateMobileNo: data.alternateMobileNo ? data.alternateMobileNo.trim() : '',
            email: data.email ? data.email.trim() : '',
            address: data.address ? data.address.trim() : '',
            allergies: Array.isArray(data.allergies)
                ? data.allergies
                : (typeof data.allergies === 'string' && data.allergies.trim() ? data.allergies.split(',').map(s => s.trim()) : []),
            remarks: data.remarks ? data.remarks.trim() : '',
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        };

        const patient = await Patient.create(patientData);
        return patient;
    } catch (error) {
        throw error;
    }
};

exports.updatePatient = async (id, data) => {
    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            const error = new Error('Patient not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }

        if (data.fullName !== undefined) patient.fullName = data.fullName.trim();
        if (data.fathersName !== undefined) patient.fathersName = data.fathersName ? data.fathersName.trim() : null;
        if (data.mothersName !== undefined) patient.mothersName = data.mothersName ? data.mothersName.trim() : null;
        if (data.maritalStatus !== undefined) patient.maritalStatus = data.maritalStatus || null;
        if (data.religion !== undefined) patient.religion = data.religion ? data.religion.trim() : null;
        if (data.husbandwifeName !== undefined) patient.husbandwifeName = data.husbandwifeName ? data.husbandwifeName.trim() : null;
        if (data.contactPerson !== undefined) patient.contactPerson = data.contactPerson ? data.contactPerson.trim() : null;
        if (data.contactPersonRelation !== undefined) patient.contactPersonRelation = data.contactPersonRelation ? data.contactPersonRelation.trim() : null;
        if (data.contactPersonAddress !== undefined) patient.contactPersonAddress = data.contactPersonAddress ? data.contactPersonAddress.trim() : null;
        if (data.contactPersonMobile !== undefined) patient.contactPersonMobile = data.contactPersonMobile ? data.contactPersonMobile.trim() : null;
        if (data.occupation !== undefined) patient.occupation = data.occupation || null;
        if (data.gender !== undefined) patient.gender = data.gender;
        if (data.mobileNo !== undefined) patient.mobileNo = data.mobileNo.trim();
        if (data.dateOfBirth !== undefined) patient.dateOfBirth = data.dateOfBirth || null;
        if (data.age !== undefined) patient.age = data.age != null ? Number(data.age) : null;
        if (data.bloodGroup !== undefined) patient.bloodGroup = data.bloodGroup || null;
        if (data.alternateMobileNo !== undefined) patient.alternateMobileNo = data.alternateMobileNo.trim();
        if (data.email !== undefined) patient.email = data.email.trim();
        if (data.address !== undefined) patient.address = data.address.trim();
        if (data.allergies !== undefined) {
            patient.allergies = Array.isArray(data.allergies)
                ? data.allergies
                : (typeof data.allergies === 'string' && data.allergies.trim() ? data.allergies.split(',').map(s => s.trim()) : []);
        }
        if (data.remarks !== undefined) patient.remarks = data.remarks.trim();
        if (data.isActive !== undefined) patient.isActive = Boolean(data.isActive);

        await patient.save();
        return patient;
    } catch (error) {
        throw error;
    }
};

exports.deletePatient = async (id) => {
    try {
        const patient = await Patient.findByIdAndDelete(id);
        if (!patient) {
            const error = new Error('Patient not found');
            error.status = STATUS_CODES.NOT_FOUND;
            throw error;
        }
        return patient;
    } catch (error) {
        throw error;
    }
};