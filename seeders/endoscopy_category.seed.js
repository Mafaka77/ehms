require('dotenv').config()
const mongoose = require('mongoose')
const EndoscopyCategory = require('../modules/endoscopy/endoscopy_category.model')

const endoscopyCategories = [
  {
    code: 'UGI',
    name: 'Upper GI Endoscopy',
    description: 'Esophagogastroduodenoscopy (EGD) & Upper Gastrointestinal Endoscopic Procedures',
    displayOrder: 1
  },
  {
    code: 'LGI',
    name: 'Lower GI Endoscopy (Colonoscopy)',
    description: 'Colonoscopy, Sigmoidoscopy & Lower Gastrointestinal Endoscopic Procedures',
    displayOrder: 2
  },
  {
    code: 'ERCP',
    name: 'ERCP Procedures',
    description: 'Endoscopic Retrograde Cholangiopancreatography',
    displayOrder: 3
  },
  {
    code: 'EUS',
    name: 'Endoscopic Ultrasound (EUS)',
    description: 'Diagnostic & Interventional Endoscopic Ultrasound Procedures',
    displayOrder: 4
  },
  {
    code: 'BRONCHO',
    name: 'Bronchoscopy',
    description: 'Flexible Fiberoptic Bronchoscopy & Diagnostic Airway Endoscopy',
    displayOrder: 5
  }
]

async function seedEndoscopyCategories() {
  try {
    for (const cat of endoscopyCategories) {
      await EndoscopyCategory.updateOne(
        { code: cat.code },
        {
          $set: {
            name: cat.name,
            description: cat.description,
            displayOrder: cat.displayOrder,
            isActive: true
          }
        },
        { upsert: true }
      )
    }

    console.log('Endoscopy Categories seeded successfully.')
  } catch (error) {
    console.error('Endoscopy Category seeding failed:', error)
  }
}

module.exports = seedEndoscopyCategories

if (require.main === module) {
  (async () => {
    try {
      console.log('Connecting to database...')
      await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
      console.log('Database connected successfully.')

      await seedEndoscopyCategories()

      await mongoose.disconnect()
      console.log('Disconnected from database.')
      process.exit(0)
    } catch (err) {
      console.error('Error running endoscopy category seeder:', err)
      process.exit(1)
    }
  })()
}
