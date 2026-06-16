const ChargeCategory = require('../modules/clinical/ipd/ipd_charge_category.model')

const chargeCategories = [

  // Accommodation
  {
    code: 'ROOM',
    name: 'Room Charges',
    description: 'Ward, room and bed charges'
  },
  {
    code: 'NURSING',
    name: 'Nursing Charges',
    description: 'General nursing care charges'
  },

  // Doctor & Procedures
  {
    code: 'DOCTOR',
    name: 'Doctor Charges',
    description: 'Consultation and doctor visit charges'
  },
  {
    code: 'PROCEDURE',
    name: 'Procedure Charges',
    description: 'Minor and major procedures'
  },
  {
    code: 'OT',
    name: 'Operation Theatre Charges',
    description: 'Operation theatre charges'
  },
  {
    code: 'ANESTHESIA',
    name: 'Anesthesia Charges',
    description: 'Anesthesia service charges'
  },

  // Diagnostic Modules
  {
    code: 'LAB',
    name: 'Laboratory Charges',
    description: 'Laboratory investigations'
  },
  {
    code: 'RADIOLOGY',
    name: 'Radiology Charges',
    description: 'Radiology investigations'
  },
  {
    code: 'ENDOSCOPY',
    name: 'Endoscopy Charges',
    description: 'Endoscopy procedures'
  },
  {
    code: 'COLONOSCOPY',
    name: 'Colonoscopy Charges',
    description: 'Colonoscopy procedures'
  },
  {
    code: 'BRONCHOSCOPY',
    name: 'Bronchoscopy Charges',
    description: 'Bronchoscopy procedures'
  },
  {
    code: 'ECG',
    name: 'ECG Charges',
    description: 'Electrocardiogram services'
  },
  {
    code: 'ECHO',
    name: 'ECHO Charges',
    description: 'Echocardiography services'
  },
  {
    code: 'TMT',
    name: 'TMT Charges',
    description: 'Treadmill test services'
  },
  {
    code: 'EEG',
    name: 'EEG Charges',
    description: 'Electroencephalography services'
  },

  // Pharmacy
  {
    code: 'PHARMACY',
    name: 'Pharmacy Charges',
    description: 'Medicine and pharmacy charges'
  },

  // Critical Care
  {
    code: 'ICU',
    name: 'ICU Charges',
    description: 'Intensive care unit charges'
  },
  {
    code: 'NICU',
    name: 'NICU Charges',
    description: 'Neonatal intensive care charges'
  },
  {
    code: 'PICU',
    name: 'PICU Charges',
    description: 'Pediatric intensive care charges'
  },

  // Equipment
  {
    code: 'VENTILATOR',
    name: 'Ventilator Charges',
    description: 'Ventilator usage charges'
  },
  {
    code: 'EQUIPMENT',
    name: 'Medical Equipment Charges',
    description: 'Medical equipment usage charges'
  },

  // Special Services
  {
    code: 'DIALYSIS',
    name: 'Dialysis Charges',
    description: 'Dialysis services'
  },
  {
    code: 'BLOOD_BANK',
    name: 'Blood Bank Charges',
    description: 'Blood bank services'
  },
  {
    code: 'AMBULANCE',
    name: 'Ambulance Charges',
    description: 'Ambulance services'
  },

  // Supplies
  {
    code: 'CONSUMABLE',
    name: 'Consumable Charges',
    description: 'Medical consumables'
  },

  // Packages
  {
    code: 'PACKAGE',
    name: 'Package Charges',
    description: 'Hospital treatment packages'
  },

  // Misc
  {
    code: 'CERTIFICATE',
    name: 'Certificate Charges',
    description: 'Medical certificates and reports'
  },
  {
    code: 'MORTUARY',
    name: 'Mortuary Charges',
    description: 'Mortuary services'
  },
  {
    code: 'MISC',
    name: 'Miscellaneous Charges',
    description: 'Other billable services'
  }

]

async function seedChargeCategories() {
  try {

    for (const category of chargeCategories) {

      await ChargeCategory.updateOne(
        { code: category.code },
        { $set: category },
        { upsert: true }
      )

      console.log(`✓ ${category.name}`)
    }

    console.log('Charge Categories Seeded Successfully')

  } catch (error) {

    console.error(error)

  }
}

module.exports = seedChargeCategories