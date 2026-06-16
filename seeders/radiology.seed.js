const Radiology = require('../modules/radiology/radiology.model')

const radiologies = [
  {
    code: 'XRAY',
    name: 'X-Ray',
    description: 'Conventional X-Ray Imaging'
  },
  {
    code: 'USG',
    name: 'Ultrasound',
    description: 'Ultrasound Imaging'
  },
  {
    code: 'CT',
    name: 'CT Scan',
    description: 'Computed Tomography'
  },
  {
    code: 'MRI',
    name: 'MRI',
    description: 'Magnetic Resonance Imaging'
  },
  {
    code: 'CARDIAC',
    name: 'Cardiac Diagnostics',
    description: 'ECG, Echo, TMT'
  },
  {
    code: 'NEURO',
    name: 'Neuro Diagnostics',
    description: 'EEG and Neurological Tests'
  },
  {
    code: 'PFT',
    name: 'Pulmonary Function Test',
    description: 'Respiratory Function Tests'
  }
]

async function seedRadiologies() {

  try {

    for (const radiology of radiologies) {

      await Radiology.updateOne(
        {
          code: radiology.code
        },
        {
          $set: {
            name: radiology.name,
            description: radiology.description,
            isActive: true
          }
        },
        {
          upsert: true
        }
      )

    }

    console.log(
      'Radiologies seeded successfully'
    )

  } catch (error) {

    console.error(
      'Radiology seeding failed:',
      error
    )

  }

}

module.exports = seedRadiologies