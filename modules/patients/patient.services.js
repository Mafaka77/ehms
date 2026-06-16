const Patient = require('./patient.model');
const STATUS_CODES = require('../../utils/statuscode');

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
}

exports.createPatient = async (data) => {
    try {
        const patientData = {
            fullName: data.fullName,
            gender: data.gender,
            mobileNo: data.mobileNo,
            dateOfBirth: data.dateOfBirth,
            age: data.age,
            bloodGroup: data.bloodGroup,
            alternateMobileNo: data.alternateMobileNo,
            email: data.email,
            address: data.address,
            remarks: data.remarks
        };

        const patient = await Patient.create(patientData);
        return patient;
    } catch (error) {
        throw error;
    }
}