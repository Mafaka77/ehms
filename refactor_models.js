const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'modules/clinical/ipd/ipd.services.js',
  'modules/emergency/emergency.services.js',
  'modules/dental/dental.services.js',
  'modules/laboratory/lab.services.js',
  'modules/radiology/radiology.services.js',
  'modules/pharmacy/pharmacy.services.js'
];

for (const filePath of filesToUpdate) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replacements
  // IPD
  content = content.replace(/require\(['"]\.\/ipd_patient_charge\.model['"]\)/g, "require('../../common/patient_charge.model')");
  content = content.replace(/require\(['"]\.\/ipd_patient_charge_addon\.model['"]\)/g, "require('../../common/patient_charge_addon.model')");
  content = content.replace(/require\(['"]\.\.\/clinical\/ipd\/ipd_patient_charge\.model['"]\)/g, "require('../common/patient_charge.model')");
  content = content.replace(/require\(['"]\.\.\/clinical\/ipd\/ipd_patient_charge_addon\.model['"]\)/g, "require('../common/patient_charge_addon.model')");
  
  // Emergency
  content = content.replace(/require\(['"]\.\/emergency_patient_charge\.model['"]\)/g, "require('../common/patient_charge.model')");
  content = content.replace(/require\(['"]\.\/emergency_patient_charge_addon\.model['"]\)/g, "require('../common/patient_charge_addon.model')");
  
  // Dental
  content = content.replace(/require\(['"]\.\/dental_patient_charge\.model['"]\)/g, "require('../common/patient_charge.model')");
  content = content.replace(/require\(['"]\.\/dental_patient_charge_addon\.model['"]\)/g, "require('../common/patient_charge_addon.model')");
  
  // Variable name updates
  content = content.replace(/IpdPatientChargeAddon/g, 'PatientChargeAddon');
  content = content.replace(/IpdPatientCharge/g, 'PatientCharge');
  
  content = content.replace(/EmergencyPatientChargeAddon/g, 'PatientChargeAddon');
  content = content.replace(/EmergencyPatientCharge/g, 'PatientCharge');
  
  content = content.replace(/DentalPatientChargeAddon/g, 'PatientChargeAddon');
  content = content.replace(/DentalPatientCharge/g, 'PatientCharge');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}
