const Specialization = require('../modules/master/specialization.model')

const specializations = [
  'General Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'General Surgery',
  'Orthopedics',
  'Cardiology',
  'Neurology',
  'Neurosurgery',
  'Dermatology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Urology',
  'Nephrology',
  'Pulmonology',
  'Gastroenterology',
  'Endocrinology',
  'Oncology',
  'Anesthesiology',
  'Radiology',
  'Pathology',
  'Emergency Medicine',
  'Critical Care Medicine',
  'Dental Surgery',
  'Plastic Surgery'
]

async function seedSpecializations() {
  try {

    for (const name of specializations) {

      await Specialization.updateOne(
        { name },
        {
          $set: {
            name,
            isActive: true
          }
        },
        {
          upsert: true
        }
      )

    }

    console.log('Specializations seeded successfully')

  } catch (error) {

    console.error(
      'Specialization seeding failed:',
      error
    )

  }
}

module.exports = seedSpecializations