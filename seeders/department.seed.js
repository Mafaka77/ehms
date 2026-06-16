const Department = require('../modules/master/department.model')
const departments = [
  {
    name: 'Administration',
    description: 'Hospital administration and management'
  },
  {
    name: 'Medical Services',
    description: 'Doctors and medical practitioners'
  },
  {
    name: 'Nursing Services',
    description: 'Nursing staff and patient care'
  },
  {
    name: 'Front Office',
    description: 'Reception, registration and appointments'
  },
  {
    name: 'Accounts & Billing',
    description: 'Billing, cashier and accounts'
  },
  {
    name: 'Laboratory',
    description: 'Laboratory and pathology services'
  },
  {
    name: 'Pharmacy',
    description: 'Pharmacy and medicine dispensing'
  },
  {
    name: 'Radiology',
    description: 'X-Ray, Ultrasound, CT and MRI services'
  },
  {
    name: 'Operation Theatre',
    description: 'Operation theatre and surgical services'
  },
  {
    name: 'Emergency & Casualty',
    description: 'Emergency and casualty services'
  },
  {
    name: 'Housekeeping',
    description: 'Cleaning and sanitation services'
  },
  {
    name: 'Maintenance & IT',
    description: 'Maintenance, electrical and IT support'
  },
  {
    name: 'Security',
    description: 'Security and access control'
  }
]

async function seedDepartments() {

  for (const department of departments) {

    await Department.updateOne(
      { name: department.name },
      { $set: department },
      { upsert: true }
    )

  }

  console.log('Departments seeded successfully')
}

module.exports = seedDepartments