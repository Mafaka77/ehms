const bcrypt = require('bcrypt')

const User = require('../modules/auth/user.model')
const Role = require('../modules/auth/role.model')
const Permission = require('../modules/auth/permission.model')

async function seedRBAC() {

  // ==========================
  // CREATE PERMISSIONS
  // ==========================

const permissions = [

  // =========================
  // USER
  // =========================

  'user.view',
  'user.create',
  'user.update',
  'user.delete',

  // =========================
  // PATIENT
  // =========================

  'patient.view',
  'patient.create',
  'patient.update',
  'patient.delete',

  // =========================
  // EMPLOYEE
  // =========================

  'employee.view',
  'employee.create',
  'employee.update',
  'employee.delete',

  // =========================
  // DOCTOR MASTER
  // =========================

  'doctor.view',
  'doctor.create',
  'doctor.update',
  'doctor.delete',

  // =========================
  // OPD
  // =========================

  'opd.view',
  'opd.create',
  'opd.update',
  'opd.close',
  'opd.payment',

  // =========================
  // EMERGENCY
  // =========================

  'emergency.view',
  'emergency.create',
  'emergency.update',
  'emergency.delete',
  'emergency.payment',

  // =========================
  // CONSULTATION
  // =========================

  'consultation.create',
  'prescription.create',

  // =========================
  // IPD
  // =========================

  'ipd.view',
  'ipd.admit',
  'ipd.update',
  'ipd.transfer',
  'ipd.discharge',
  'ipd.cancel',

  // =========================
  // WARD
  // =========================

  'ward.view',
  'ward.create',
  'ward.update',
  'ward.delete',

  //CHARGES
  'ipd.charges.view',
  'ipd.charges.create',
  'ipd.charges.update',
  'ipd.charges.delete',

  // =========================
  // ROOM
  // =========================

  'room.view',
  'room.create',
  'room.update',
  'room.delete',

  // =========================
  // BED
  // =========================

  'bed.view',
  'bed.create',
  'bed.update',
  'bed.delete',

  // =========================
  // NURSING STATION
  // =========================

  'nursing_station.view',
  'nursing_station.create',
  'nursing_station.update',
  'nursing_station.delete',

  // =========================
  // NURSING ASSIGNMENT
  // =========================

  'nursing_assignment.view',
  'nursing_assignment.create',
  'nursing_assignment.update',
  'nursing_assignment.delete',

   // =========================
  // MY STATION
  // =========================

  'my_station.view',
  'my_station.update',

  // =========================
  // SHIFT
  // =========================

  'shift.view',
  'shift.create',
  'shift.update',
  'shift.delete',

  // =========================
  // DUTY ROSTER
  // =========================

  'nursing_roster.view',
  'nursing_roster.create',
  'nursing_roster.update',
  'nursing_roster.publish',

  // =========================
  // NURSING NOTES
  // =========================

  'nursing_note.view',
  'nursing_note.create',
  'nursing_note.update',

  // =========================
  // VITAL SIGNS
  // =========================

  'vital.view',
  'vital.create',
  'vital.update',

  // =========================
  // LABORATORY
  // =========================

  'lab.view',
  'lab.create',
  'lab.update',
  'lab.delete',

  'lab.order',
  'lab.sample.collect',
  'lab.result',
  'lab.verify',
  'lab.print',
  'lab.payment',

  // =========================
  // RADIOLOGY
  // =========================

  'radiology.view',
  'radiology.create',
  'radiology.update',
  'radiology.delete',

  'radiology.order',
  'radiology.result',
  'radiology.verify',
  'radiology.print',

  // =========================
  // PHARMACY
  // =========================

  'pharmacy.view',

  'pharmacy.sale',
  'pharmacy.purchase',
  'pharmacy.return',

  'pharmacy.stock.view',
  'pharmacy.stock.update',

  // =========================
  // BILLING
  // =========================

  'billing.view',
  'billing.create',
  'billing.update',
  'billing.cancel',
  'billing.discount',

  // =========================
  // PAYMENT
  // =========================

  'payment.view',
  'payment.receive',
  'payment.refund',

  // =========================
  // PROCEDURE
  // =========================

  'procedure.view',
  'procedure.create',
  'procedure.update',
  'procedure.delete',

  // =========================
  // PACKAGE
  // =========================

  'package.view',
  'package.create',
  'package.update',
  'package.delete',

  // =========================
  // PAYROLL
  // =========================

  'payroll.view',
  'payroll.create',
  'payroll.process',

  // =========================
  // REMUNERATION
  // =========================

  'remuneration.view',
  'remuneration.create',
  'remuneration.process',

  // =========================
  // REPORTS
  // =========================

  'report.view',
  'report.export',

  // =========================
  // SETTINGS
  // =========================

  'setting.view',
  'setting.update',

  // =========================
  // MASTER DATA
  // =========================

  'department.view',
  'department.create',
  'department.update',
  'department.delete',

  'designation.view',
  'designation.create',
  'designation.update',
  'designation.delete',

  'specialization.view',
  'specialization.create',
  'specialization.update',
  'specialization.delete',

  // =========================
  // PHARMACY SUPPLIER
  // =========================

  'supplier.view',
  'supplier.create',
  'supplier.update',
  'supplier.delete',

]

  const capitalize = (str) => {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  for (const permission of permissions) {
    let permissionObj = permission
    if (typeof permission === 'string') {
      const parts = permission.split('.')
      if (parts.length >= 2) {
        const moduleStr = parts[0]
        const actionStr = parts[1]
        const moduleName = capitalize(moduleStr)
        const actionName = capitalize(actionStr)
        permissionObj = {
          code: permission,
          name: `${actionName} ${moduleName}`,
          module: moduleName
        }
      } else {
        continue
      }
    }

    await Permission.updateOne(
      { code: permissionObj.code },
      permissionObj,
      { upsert: true }
    )
  }

  // ==========================
  // CREATE ROLES
  // ==========================

 const roleNames = [
  'SuperAdmin',
  'HospitalAdmin',
  'Doctor',
  'Receptionist',
  'NursingManager',
  'Nurse',
  'LabManager',
  'LabTechnician',
  'PharmacyManager',
  'Pharmacist',
  'Cashier',
  'Accountant'
]

  for (const roleName of roleNames) {

    await Role.updateOne(
      { name: roleName },
      { name: roleName },
      { upsert: true }
    )

  }

  // ==========================
  // ASSIGN ALL PERMISSIONS
  // TO SUPER ADMIN
  // ==========================

  const superAdminRole =
    await Role.findOne({
      name: 'SuperAdmin'
    })

  const allPermissions =
    await Permission.find()

  superAdminRole.permissions =
    allPermissions.map(
      permission => permission._id
    )

  await superAdminRole.save()

  // ==========================
  // CREATE SUPER ADMIN USER
  // ==========================

  const existingAdmin =
    await User.findOne({
      email: 'admin@hms.com'
    })

  if (!existingAdmin) {

    const hashedPassword =
      await bcrypt.hash(
        'password',
        10
      )

    await User.create({
      fullName: 'System Administrator',

      email: 'admin@hms.com',

      password: hashedPassword,

      role: superAdminRole._id
    })

    console.log(
      'Super Admin Created'
    )

  }

}

module.exports = seedRBAC