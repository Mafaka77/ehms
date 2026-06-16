const Designation = require('../modules/master/designation.model')

const designations = [

  // Administration
  'Hospital Administrator',
  'Deputy Administrator',
  'HR Manager',
  'HR Executive',

  // Medical
  'Consultant',
  'Specialist',
  'Medical Officer',
  'Senior Medical Officer',
  'Resident Doctor',

  // Nursing
  'Nursing Superintendent',
  'Ward Sister',
  'Nursing Officer',
  'Nursing Assistant',

  // Laboratory
  'Lab Technologist',
  'Lab Technician',
  'Phlebotomist',
  'Lab Assistant',

  // Pharmacy
  'Pharmacist',
  'Assistant Pharmacist',

  // Radiology
  'Radiologist',
  'Radiographer',
  'X-Ray Technician',
  'CT Technician',
  'MRI Technician',
  'Ultrasound Technician',

  // Front Office
  'Front Office Manager',
  'Receptionist',
  'Registration Clerk',

  // Accounts
  'Accounts Manager',
  'Accountant',
  'Cashier',
  'Billing Executive',

  // OT
  'OT In-Charge',
  'OT Nurse',
  'OT Technician',
  'Anaesthesia Technician',

  // Emergency
  'Emergency Nurse',
  'Emergency Technician',

  // IT
  'IT Assistant',

  // Support
  'Housekeeping Supervisor',
  'Housekeeping Staff',
  'Security Officer',
  'Security Guard',
  'Maintenance Technician'
]

async function seedDesignations() {

  try {

    for (const designationName of designations) {

      await Designation.updateOne(
        { designationName },
        {
          $set: {
            designationName,
            isActive: true
          }
        },
        {
          upsert: true
        }
      )

    }

    console.log(
      'Designations seeded successfully'
    )

  } catch (error) {

    console.error(
      'Designation seeding failed:',
      error
    )

  }

}

module.exports = seedDesignations