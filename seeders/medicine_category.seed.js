const mongoose = require('mongoose')
const MedicineCategory = require('../modules/pharmacy/medicine_category.model')

const medicineCategories = [
  {
    name: 'Antibiotics',
    description: 'Medicines used to treat bacterial infections'
  },
  {
    name: 'Analgesics',
    description: 'Pain relieving medicines'
  },
  {
    name: 'Antipyretics',
    description: 'Medicines used to reduce fever'
  },
  {
    name: 'Anti-inflammatory',
    description: 'Medicines used to reduce inflammation'
  },
  {
    name: 'Antihistamines',
    description: 'Medicines used for allergies'
  },
  {
    name: 'Antacids',
    description: 'Medicines for acidity and gastric disorders'
  },
  {
    name: 'Gastrointestinal',
    description: 'Medicines for digestive system disorders'
  },
  {
    name: 'Cardiovascular',
    description: 'Medicines for heart and blood pressure conditions'
  },
  {
    name: 'Antidiabetic',
    description: 'Medicines for diabetes management'
  },
  {
    name: 'Respiratory',
    description: 'Medicines for respiratory conditions'
  },
  {
    name: 'Neurology',
    description: 'Medicines affecting nervous system'
  },
  {
    name: 'Psychiatric',
    description: 'Medicines for mental health conditions'
  },
  {
    name: 'Dermatology',
    description: 'Skin related medicines'
  },
  {
    name: 'Ophthalmology',
    description: 'Eye medications'
  },
  {
    name: 'ENT',
    description: 'Ear, Nose and Throat medications'
  },
  {
    name: 'Gynecology',
    description: 'Medicines used in gynecological care'
  },
  {
    name: 'Pediatrics',
    description: 'Medicines commonly used in children'
  },
  {
    name: 'Orthopedics',
    description: 'Medicines related to bone and joint disorders'
  },
  {
    name: 'Urology',
    description: 'Medicines for urinary tract disorders'
  },
  {
    name: 'Oncology',
    description: 'Cancer treatment medicines'
  },
  {
    name: 'Injectables',
    description: 'Injectable medicines'
  },
  {
    name: 'IV Fluids',
    description: 'Intravenous fluids and solutions'
  },
  {
    name: 'Vaccines',
    description: 'Vaccination products'
  },
  {
    name: 'Vitamins & Supplements',
    description: 'Nutritional supplements'
  },
  {
    name: 'Surgical Consumables',
    description: 'Syringes, Gloves, Dressings, Sutures etc.'
  },
  {
    name: 'Medical Devices',
    description: 'Medical devices and accessories'
  },
  {
    name: 'Emergency Drugs',
    description: 'Emergency and life-saving medicines'
  },
  {
    name: 'Controlled Drugs',
    description: 'Narcotics and controlled medicines'
  }
]

async function seedMedicineCategories() {
  try {

    await MedicineCategory.deleteMany({})

    await MedicineCategory.insertMany(
      medicineCategories
    )

    console.log(
      `✓ ${medicineCategories.length} medicine categories seeded successfully`
    )

  } catch (error) {

    console.error(
      'Medicine Category Seeder Error:',
      error
    )
    throw error;
  }
}

module.exports =
  seedMedicineCategories