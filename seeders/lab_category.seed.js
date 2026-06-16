const LabCategory = require('../modules/laboratory/lab_category.model')

const categories = [
  {
    code: 'HEM',
    name: 'Hematology',
    description: 'Blood cell and blood component analysis'
  },
  {
    code: 'BIO',
    name: 'Biochemistry',
    description: 'Chemical analysis of blood and body fluids'
  },
  {
    code: 'CP',
    name: 'Clinical Pathology',
    description: 'Routine examination of urine, stool and body fluids'
  },
  {
    code: 'SER',
    name: 'Serology',
    description: 'Antigen and antibody testing'
  },
  {
    code: 'MIC',
    name: 'Microbiology',
    description: 'Culture and sensitivity testing'
  },
  {
    code: 'HIS',
    name: 'Histopathology',
    description: 'Tissue examination and biopsy studies'
  },
  {
    code: 'CYT',
    name: 'Cytology',
    description: 'Cell examination and FNAC studies'
  },
  {
    code: 'END',
    name: 'Hormone & Endocrinology',
    description: 'Hormonal and endocrine investigations'
  }
]

async function seedLabCategories() {
  try {

    for (const category of categories) {

      await LabCategory.updateOne(
        { code: category.code },
        {
          $set: {
            name: category.name,
            description: category.description,
            isActive: true
          }
        },
        {
          upsert: true
        }
      )

    }

    console.log(
      'Lab categories seeded successfully'
    )

  } catch (error) {

    console.error(
      'Lab category seeding failed:',
      error
    )

  }
}

module.exports = seedLabCategories