<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import PharmacyOrder from './PharmacyOrder.vue'
import BedHistory from './BedHistory.vue'
import PatientCharge from './PatientCharge.vue'

import DischargeSummary from './DischargeSummary.vue'
import Test from './Test.vue'
import Transactions from './Transactions.vue'
import { useIpdWardStore } from '../../../stores/ipdWardStore'
import { useDoctorStore } from '../../../stores/doctorStore'
import SearchableSelect from '../../../components/SearchableSelect.vue'
import EditPatientModal from '../../master/patient/Edit.vue'
import logoUrl from '../../../assets/logo_final.png'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()
const wardStore = useIpdWardStore()
const doctorStore = useDoctorStore()
const authStore = useAuthStore()

const canViewTransactions = computed(() => {
  const role = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return ['SuperAdmin', 'HospitalAdmin'].includes(role)
})

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return roleName === 'SuperAdmin' || roleName === 'Super Admin'
})

const wardOptions = computed(() => {
  return (wardStore.wards || []).map(ward => ({
    value: ward._id,
    label: `${ward.name} (Floor: ${ward.floor || '-'})`
  }))
})

const bedOptions = computed(() => {
  return (availableBeds.value || []).map(bed => ({
    value: bed._id,
    label: `Bed ${bed.bedNo} (${bed.bedType} - ₹${bed.dailyRate}/day)`
  }))
})

const loading = ref(true)
const admission = ref(null)
const activeTab = ref('charges') // charges, pharmacy, doctor_charges, files, bed_history, transactions
const transactionsRef = ref(null)

// Change Consultant Doctor Modal States
const showDoctorModal = ref(false)
const doctorSubmitting = ref(false)
const selectedDoctorId = ref('')

const doctorOptions = computed(() => {
  return doctorStore.doctors.map(doc => ({
    value: doc._id,
    label: `${doc.fullName} - ${doc.specializationId?.name || 'General'}`
  }))
})

const openDoctorModal = async () => {
  selectedDoctorId.value = admission.value?.consultantDoctorId?._id || admission.value?.consultantDoctorId || ''
  showDoctorModal.value = true
  await doctorStore.fetchDoctors(1, 500)
}

const submitDoctorChange = async () => {
  if (!selectedDoctorId.value) {
    snackbarStore.show({ message: 'Please select a consultant doctor.', type: 'warning' })
    return
  }
  doctorSubmitting.value = true
  const res = await admissionStore.updateAdmission(admission.value._id, {
    consultantDoctorId: selectedDoctorId.value
  })

  if (res.success) {
    snackbarStore.show({ message: 'Consultant doctor updated successfully.', type: 'success' })
    showDoctorModal.value = false
    await fetchAdmissionDetails()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to update consultant doctor.', type: 'error' })
  }
  doctorSubmitting.value = false
}

// Transfer Bed Modal States
const showTransferModal = ref(false)
const transferSubmitting = ref(false)
const transferForm = ref({
  wardId: '',
  bedId: '',
  transferReason: ''
})
const availableBeds = ref([])

const openTransferModal = async () => {
  transferForm.value = {
    wardId: '',
    bedId: '',
    transferReason: ''
  }
  availableBeds.value = []
  showTransferModal.value = true
  await wardStore.fetchWards()
}

const onWardChange = async () => {
  transferForm.value.bedId = ''
  if (!transferForm.value.wardId) {
    availableBeds.value = []
    return
  }
  const beds = await wardStore.fetchBeds(transferForm.value.wardId, 'AVAILABLE')
  availableBeds.value = beds
}

watch(() => transferForm.value.wardId, () => {
  onWardChange()
})

const submitTransfer = async () => {
  if (!transferForm.value.bedId) {
    snackbarStore.show({ message: 'Please select a new bed for transfer.', type: 'warning' })
    return
  }
  transferSubmitting.value = true
  const res = await admissionStore.updateAdmission(admission.value._id, {
    bedId: transferForm.value.bedId,
    transferReason: transferForm.value.transferReason
  })

  if (res.success) {
    snackbarStore.show({ message: 'Patient transferred successfully.', type: 'success' })
    showTransferModal.value = false
    await fetchAdmissionDetails() // refresh parent admission data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  transferSubmitting.value = false
}

// Add Advance Modal States
const showAdvanceModal = ref(false)
const advanceSubmitting = ref(false)
const advanceForm = ref({
  amount: null,
  paymentMode: 'CASH',
  referenceNo: '',
  remarks: ''
})

const openAdvanceModal = () => {
  advanceForm.value = {
    amount: null,
    paymentMode: 'CASH',
    referenceNo: '',
    remarks: ''
  }
  showAdvanceModal.value = true
}

const submitAdvance = async () => {
  if (!advanceForm.value.amount || advanceForm.value.amount <= 0) {
    snackbarStore.show({ message: 'Please enter a valid amount.', type: 'warning' })
    return
  }
  advanceSubmitting.value = true
  const res = await admissionStore.addAdmissionAdvance(admission.value._id, advanceForm.value)

  if (res.success) {
    snackbarStore.show({ message: 'Advance payment recorded successfully.', type: 'success' })
    showAdvanceModal.value = false
    await fetchAdmissionDetails()
    if (transactionsRef.value) {
      transactionsRef.value.refresh()
    }
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  advanceSubmitting.value = false
}

// Fetch Admission details
const fetchAdmissionDetails = async () => {
  loading.value = true
  const res = await admissionStore.getAdmissionById(props.id)
  if (res.success) {
    admission.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Format Date helpers
const getLocalDatetimeString = (date = new Date()) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  const formatter = new Intl.DateTimeFormat('en-CA', options)
  const parts = formatter.formatToParts(d)
  
  const year = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  let hour = parts.find(p => p.type === 'hour').value
  if (hour === '24') hour = '00'
  const minute = parts.find(p => p.type === 'minute').value
  
  return `${year}-${month}-${day}T${hour}:${minute}`
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  })
}




// Badge styling helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'ADMITTED': return 'bg-sky-50 border-sky-100 text-sky-700'
    case 'DISCHARGED': return 'bg-emerald-50 border-emerald-100 text-emerald-700'
    case 'CANCELLED': return 'bg-rose-50 border-rose-100 text-rose-700'
    default: return 'bg-slate-50 border-slate-100 text-slate-700'
  }
}

const getAdmissionTypeColor = (type) => {
  switch (type) {
    case 'EMERGENCY': return 'bg-rose-100/60 text-rose-700 border-rose-200'
    case 'TRANSFER': return 'bg-amber-100/60 text-amber-700 border-amber-200'
    default: return 'bg-slate-100/60 text-slate-700 border-slate-200'
  }
}

const getPayerTypeLabel = (type) => {
  switch (type) {
    case 'MUHCS': return 'MUHCS'
    case 'MR_STATE': return 'MR (STATE)'
    case 'MR_CENTRAL': return 'MR (CENTRAL)'
    case 'HEALTH_INSURANCE': return 'HEALTH INSURANCE'
    case 'NORMAL':
    default: return 'NORMAL'
  }
}

// Edit Admission Modal State & Handlers
const showEditAdmissionModal = ref(false)
const editAdmissionSubmitting = ref(false)
const editAdmissionForm = ref({
  admissionDate: '',
  admissionType: 'NORMAL',
  payerType: 'NORMAL',
  diagnosis: '',
  remarks: ''
})

const openEditAdmissionModal = () => {
  if (!admission.value) return
  const formattedDate = admission.value.admissionDate 
    ? getLocalDatetimeString(admission.value.admissionDate) 
    : getLocalDatetimeString()

  editAdmissionForm.value = {
    admissionDate: formattedDate,
    admissionType: admission.value.admissionType || 'NORMAL',
    payerType: admission.value.payerType || 'NORMAL',
    diagnosis: admission.value.diagnosis || '',
    remarks: admission.value.remarks || ''
  }
  showEditAdmissionModal.value = true
}

const submitEditAdmission = async () => {
  editAdmissionSubmitting.value = true
  let utcAdmissionDate = ''
  if (editAdmissionForm.value.admissionDate) {
    const raw = editAdmissionForm.value.admissionDate
    const dateStr = raw.includes('+') || raw.endsWith('Z') ? raw : `${raw}+05:30`
    const d = new Date(dateStr)
    utcAdmissionDate = !isNaN(d.getTime()) ? d.toISOString() : ''
  }

  const payload = {
    ...editAdmissionForm.value,
    admissionDate: utcAdmissionDate
  }
  const res = await admissionStore.updateAdmission(admission.value._id, payload)
  editAdmissionSubmitting.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Admission details updated successfully', type: 'success' })
    showEditAdmissionModal.value = false
    await fetchAdmissionDetails()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to update admission details', type: 'error' })
  }
}

// Discharge Modal State & Handlers
const showDischargeModal = ref(false)
const isProcessingDischarge = ref(false)
const dischargeForm = ref({
  status: 'DISCHARGED',
  remarks: ''
})

const openDischargeModal = () => {
  dischargeForm.value = {
    status: 'DISCHARGED',
    remarks: admission.value?.remarks || ''
  }
  showDischargeModal.value = true
}

const handleDischarge = async () => {
  if (!admission.value) return
  isProcessingDischarge.value = true
  const res = await admissionStore.updateAdmission(admission.value._id, {
    status: dischargeForm.value.status,
    remarks: dischargeForm.value.remarks
  })
  isProcessingDischarge.value = false

  if (res.success) {
    snackbarStore.show({ 
      message: dischargeForm.value.status === 'DISCHARGED' ? 'Patient discharged successfully!' : 'Admission cancelled successfully!', 
      type: 'success' 
    })
    showDischargeModal.value = false
    await fetchAdmissionDetails()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to discharge patient', type: 'error' })
  }
}

// Update Patient Modal States
const showUpdatePatientModal = ref(false)

const openUpdatePatientModal = () => {
  showUpdatePatientModal.value = true
}

const onPatientUpdated = async () => {
  showUpdatePatientModal.value = false
  await fetchAdmissionDetails()
}

const printPatientInfo = () => {
  if (!admission.value?.patientId) return
  const p = admission.value.patientId
  const adm = admission.value
  const doc = adm.consultantDoctorId || {}
  const bed = adm.bedId || {}
  const ward = bed.wardId || {}

  const allergiesText = Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || 'None Known')
  const dobFormatted = p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'
  const admitDateFormatted = adm.admissionDate ? new Date(adm.admissionDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '—'
  const printTime = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patient File Record - ${p.fullName || 'Patient'} (${p.patientCode || ''})</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #fff; font-size: 12px; line-height: 1.4; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-area h1 { font-size: 20px; color: #1e3a8a; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .logo-area p { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
          .badge-area { text-align: right; }
          .code-tag { display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 13px; font-family: monospace; }
          
          .section-heading { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 6px 10px; font-weight: 700; font-size: 11px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 8px 0; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 16px; }

          .field-group { margin-bottom: 4px; }
          .field-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .field-value { font-size: 12px; color: #0f172a; font-weight: 700; }
          .field-value-light { font-size: 12px; color: #334155; font-weight: 500; }

          .box-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #fafafa; }
          .alert-box { border: 1px solid #fecdd3; background: #fff1f2; color: #be123c; border-radius: 6px; padding: 8px 12px; font-weight: 600; margin-top: 6px; }

          .footer-sign { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sign-line { border-top: 1.5px dashed #94a3b8; width: 180px; text-align: center; padding-top: 5px; font-size: 11px; font-weight: 700; color: #475569; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        
        <!-- Header Logo -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px;">
          <img src="${logoUrl}" alt="Hospital Logo" style="height: 60px; width: auto; object-fit: contain;" />
          <div style="text-align: right;">
            <div class="code-tag">${p.patientCode || 'EH-PATIENT'}</div>
            <p style="font-size: 10px; color: #64748b; margin: 4px 0 0 0; font-weight: 700;">IPD No: <strong style="color: #4f46e5;">${adm.admissionNo || 'N/A'}</strong></p>
          </div>
        </div>

        <!-- Section 1: Patient Personal Details -->
        <div class="section-heading">1. Patient Demographic &amp; Personal Information</div>
        <div class="box-container">
          <div class="grid-3" style="margin-bottom: 8px;">
            <div class="field-group">
              <div class="field-label">Full Name</div>
              <div class="field-value" style="font-size: 14px; color: #1e3a8a;">${p.fullName || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Gender / Age</div>
              <div class="field-value">${p.gender || '—'}, ${p.age ? p.age + ' Yrs' : '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Date of Birth</div>
              <div class="field-value">${dobFormatted}</div>
            </div>
          </div>

          <div class="grid-3" style="margin-bottom: 8px;">
            <div class="field-group">
              <div class="field-label">Mobile Number</div>
              <div class="field-value">${p.mobileNo || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Alternate Contact</div>
              <div class="field-value-light">${p.alternateMobileNo || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Blood Group</div>
              <div class="field-value" style="color: #e11d48;">${p.bloodGroup || '—'}</div>
            </div>
          </div>

          <div class="grid-3" style="margin-bottom: 8px;">
            <div class="field-group">
              <div class="field-label">Marital Status</div>
              <div class="field-value-light">${p.maritalStatus || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Occupation</div>
              <div class="field-value-light">${p.occupation || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Religion</div>
              <div class="field-value-light">${p.religion || '—'}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="field-group">
              <div class="field-label">Email Address</div>
              <div class="field-value-light">${p.email || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Permanent Residential Address</div>
              <div class="field-value-light">${p.address || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Family & Emergency Contact -->
        <div class="section-heading">2. Family Background &amp; Next of Kin (Emergency Contact)</div>
        <div class="box-container">
          <div class="grid-3" style="margin-bottom: 8px;">
            <div class="field-group">
              <div class="field-label">Father's Name</div>
              <div class="field-value-light">${p.fathersName || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Mother's Name</div>
              <div class="field-value-light">${p.mothersName || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Spouse Name</div>
              <div class="field-value-light">${p.husbandwifeName || '—'}</div>
            </div>
          </div>

          <div class="grid-3">
            <div class="field-group">
              <div class="field-label">Emergency Contact Person</div>
              <div class="field-value" style="color: #0369a1;">${p.contactPerson || '—'} (${p.contactPersonRelation || 'Kin'})</div>
            </div>
            <div class="field-group">
              <div class="field-label">Emergency Phone</div>
              <div class="field-value">${p.contactPersonMobile || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Contact Person Address</div>
              <div class="field-value-light">${p.contactPersonAddress || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Current IPD Admission Context -->
        <div class="section-heading">3. Current Admission &amp; Location Context</div>
        <div class="box-container">
          <div class="grid-3" style="margin-bottom: 8px;">
            <div class="field-group">
              <div class="field-label">IPD Admission Number</div>
              <div class="field-value" style="color: #4f46e5;">${adm.admissionNo || '—'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Admission Date &amp; Time</div>
              <div class="field-value">${admitDateFormatted}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Admission Type / Status</div>
              <div class="field-value">${adm.admissionType || 'REGULAR'} (${adm.status || 'ADMITTED'})</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="field-group">
              <div class="field-label">Location (Ward &amp; Bed)</div>
              <div class="field-value" style="color: #0284c7;">Bed ${bed.bedNo || 'N/A'} - ${ward.name || 'Ward'}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Attending / Consultant Doctor</div>
              <div class="field-value" style="color: #0f172a;">${doc.fullName || 'Consultant Doctor'} (${doc.specializationId?.name || 'General Medical'})</div>
            </div>
          </div>
        </div>

        <!-- Section 4: Allergies & Clinical Remarks -->
        <div class="section-heading">4. Known Allergies &amp; Clinical Remarks</div>
        <div class="box-container">
          <div class="field-group" style="margin-bottom: 6px;">
            <div class="field-label">Known Allergies / Sensitivities</div>
            <div class="${allergiesText !== 'None Known' ? 'alert-box' : 'field-value-light'}">
              ${allergiesText}
            </div>
          </div>
          <div class="field-group" style="margin-top: 6px;">
            <div class="field-label">Remarks / Special Notes</div>
            <div class="field-value-light">${p.remarks || 'No additional file remarks recorded.'}</div>
          </div>
        </div>

        <!-- Footer Signatures -->
        <div class="footer-sign">
          <div>
            <p style="font-size: 10px; color: #94a3b8; margin: 0;">Printed Date: ${printTime}</p>
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">System File Reference: ${p._id || ''}</p>
          </div>
          <div class="sign-line">
            Medical Records Officer / Nurse
          </div>
          <div class="sign-line">
            Consultant Doctor Signature
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `
  const printWin = window.open('', '_blank')
  printWin.document.write(content)
  printWin.document.close()
}

onMounted(async () => {
  await fetchAdmissionDetails()
})
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto space-y-6">
    <!-- Back Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button 
          @click="router.push({ name: 'ipd-my-patient' })"
          class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all focus:outline-none bg-slate-50/50 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
          <p class="text-slate-500 mt-1 text-sm">Monitored patient inpatient files, pharmacy requests, and hospital charges.</p>
        </div>
      </div>
      <div v-if="admission" class="flex items-center gap-3">
        <span 
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-2xs"
          :class="getStatusColor(admission.status)"
        >
          {{ admission.status }}
        </span>
        <button 
          v-if="isSuperAdmin && admission.status === 'ADMITTED'"
          @click="openDischargeModal"
          class="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Discharge Patient
        </button>
      </div>
    </div>

    <!-- Main Detail Loading view -->
    <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Retrieving patient records...
    </div>

    <div v-else-if="!admission" class="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500">
      <p class="font-semibold text-slate-700">Admission file not found.</p>
      <button @click="router.push({ name: 'ipd-my-patient' })" class="text-indigo-600 font-semibold hover:underline mt-2">Back to patients directory</button>
    </div>

    <div v-else class="space-y-6">
      <!-- Patient & Location Header Card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        
        <!-- Column 1: Patient details -->
        <div class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              {{ admission.patientId?.fullName?.charAt(0) || 'P' }}
            </div>
            <div>
              <h3 class="font-bold text-slate-900 leading-tight">{{ admission.patientId?.fullName || 'N/A' }}</h3>
              <p class="text-slate-400 font-mono text-xs mt-0.5">{{ admission.patientId?.patientCode || '-' }}</p>
            </div>
          </div>
          <div class="mt-4 space-y-1 text-xs text-slate-500">
            <p><span class="font-semibold text-slate-700">Gender / Age:</span> {{ admission.patientId?.gender || 'Unknown' }}, {{ admission.patientId?.age || '?' }} Years</p>
            <p><span class="font-semibold text-slate-700">Mobile:</span> {{ admission.patientId?.mobileNo || '-' }}</p>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <button 
              @click="openUpdatePatientModal"
              class="flex-1 py-1.5 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Update Patient
            </button>

            <button 
              @click="printPatientInfo"
              title="Print Patient Physical File Slip"
              class="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <!-- Column 2: Admission info -->
        <div class="p-6">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admission Context</h4>
          <div class="space-y-1.5 text-xs text-slate-600">
            <p><span class="font-semibold text-slate-500">IPD No:</span> <strong class="font-mono text-indigo-600 font-bold">{{ admission.admissionNo }}</strong></p>
            <p><span class="font-semibold text-slate-500">Admit Date:</span> {{ formatDate(admission.admissionDate) }}</p>
            <p>
              <span class="font-semibold text-slate-500">Type:</span> 
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border ml-1" :class="getAdmissionTypeColor(admission.admissionType)">
                {{ admission.admissionType }}
              </span>
            </p>
            <p><span class="font-semibold text-slate-500">Payer Type:</span> <strong class="text-slate-800 font-bold ml-1">{{ getPayerTypeLabel(admission.payerType) }}</strong></p>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <button 
              @click="openEditAdmissionModal"
              class="flex-1 py-1.5 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Edit admission details"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
            <button 
              v-if="isSuperAdmin"
              @click="openAdvanceModal"
              class="flex-1 py-1.5 border border-emerald-100 hover:border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Advance
            </button>
          </div>
        </div>

        <!-- Column 3: Bed & Location -->
        <div class="p-6">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location & Bed</h4>
          <div class="flex items-center gap-3 mt-1">
            <div class="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <div>
              <p class="font-bold text-slate-800 text-sm">Bed {{ admission.bedId?.bedNo || 'N/A' }}</p>
              <p class="text-xs text-slate-500">{{ admission.bedId?.wardId?.name || 'Ward Location' }}</p>
            </div>
          </div>
          <p class="text-[10px] text-slate-400 mt-2">Rate: ₹{{ admission.bedId?.dailyRate }}/day • Type: {{ admission.bedId?.bedType }}</p>
          <button 
            @click="openTransferModal"
            class="mt-3 w-full py-1.5 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer Bed
          </button>
        </div>

        <!-- Column 4: Consultant doctor -->
        <div class="p-6">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consultant Doctor</h4>
          <div class="flex items-center gap-3 mt-1">
            <div class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="font-bold text-slate-800 text-sm">{{ admission.consultantDoctorId?.fullName || 'N/A' }}</p>
              <p class="text-xs text-slate-500">{{ admission.consultantDoctorId?.qualification || 'General Consultant' }}</p>
            </div>
          </div>
          <button 
            @click="openDoctorModal"
            class="mt-3 w-full py-1.5 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Doctor
          </button>
        </div>

      </div>

      <!-- Tabbar Selector -->
      <div class="border-b border-slate-200 flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
        <button 
          @click="activeTab = 'charges'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'charges' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Patient Charges
        </button>
        <button 
          @click="activeTab = 'pharmacy'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'pharmacy' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Pharmacy Order
        </button>

        <button 
          @click="activeTab = 'tests'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'tests' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Test
        </button>
        <button 
          @click="activeTab = 'discharge_summary'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'discharge_summary' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Discharge Summary
        </button>
        <button 
          @click="activeTab = 'bed_history'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'bed_history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Bed History
        </button>
        <button 
          v-if="canViewTransactions"
          @click="activeTab = 'transactions'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Transactions
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <!-- Tab: Patient Charges -->
        <div v-if="activeTab === 'charges'" class="space-y-4">
          <PatientCharge :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Pharmacy Order -->
        <div v-else-if="activeTab === 'pharmacy'" class="space-y-4 animate-in fade-in duration-200">
          <PharmacyOrder :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Discharge Summary -->
        <div v-else-if="activeTab === 'discharge_summary'" class="space-y-4 animate-in fade-in duration-200">
          <DischargeSummary :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Test & Diagnostics -->
        <div v-else-if="activeTab === 'tests'" class="space-y-4 animate-in fade-in duration-200">
          <Test :admissionId="admission._id" :admission="admission" />
        </div>



        <!-- Tab: Bed History -->
        <div v-else-if="activeTab === 'bed_history'" class="space-y-4 animate-in fade-in duration-200">
          <BedHistory :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Transactions -->
        <div v-else-if="activeTab === 'transactions' && canViewTransactions" class="space-y-4 animate-in fade-in duration-200">
          <Transactions ref="transactionsRef" :admissionId="admission._id" :admission="admission" />
        </div>

      </div>
    </div>
  </div>

  <!-- Transfer Bed Modal -->
  <div 
    v-if="showTransferModal" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
  >
    <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Title Header -->
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-800 text-base">Transfer Bed</h3>
          <p class="text-xs text-slate-400 mt-0.5">Transfer the patient to a different bed or ward (e.g. ICU).</p>
        </div>
        <button 
          @click="showTransferModal = false"
          class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body Form -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <!-- Select Ward (Searchable) -->
        <div>
          <SearchableSelect
            v-model="transferForm.wardId"
            id="target-ward-select"
            label="Target Ward"
            placeholder="Search & select target ward..."
            :options="wardOptions"
            :required="true"
          />
        </div>

        <!-- Select Bed (Searchable) -->
        <div>
          <SearchableSelect
            v-model="transferForm.bedId"
            id="target-bed-select"
            label="Target Bed"
            placeholder="Search & select target bed..."
            :options="bedOptions"
            :disabled="!transferForm.wardId"
            :required="true"
          />
          <p v-if="transferForm.wardId && availableBeds.length === 0" class="text-[10px] text-rose-500 font-semibold mt-1">
            No available beds in the selected ward.
          </p>
        </div>

        <!-- Transfer Reason -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Transfer Reason / Notes</label>
          <textarea 
            v-model="transferForm.transferReason"
            rows="3"
            placeholder="E.g. Transferred to ICU due to clinical condition, returning to General Ward post-surgery..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
          ></textarea>
        </div>
      </div>

      <!-- Modal Actions Footer -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button 
          type="button"
          @click="showTransferModal = false"
          class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="button"
          @click="submitTransfer"
          :disabled="transferSubmitting"
          class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg v-if="transferSubmitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Confirm Transfer
        </button>
      </div>
    </div>
  </div>
    
    <!-- Add Advance Modal -->
    <div v-if="showAdvanceModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Record Advance Payment
          </h3>
          <button @click="showAdvanceModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <!-- Amount -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Amount (₹) *</label>
            <input 
              v-model="advanceForm.amount" 
              type="number"
              min="1"
              placeholder="0.00"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            >
          </div>

          <!-- Payment Mode -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Payment Mode *</label>
            <select 
              v-model="advanceForm.paymentMode"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <!-- Reference Number -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Reference No. (Optional)</label>
            <input 
              v-model="advanceForm.referenceNo" 
              type="text"
              placeholder="e.g. UTR or Cheque Number"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase placeholder:normal-case"
            >
          </div>

          <!-- Remarks -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Remarks (Optional)</label>
            <textarea 
              v-model="advanceForm.remarks" 
              rows="2"
              placeholder="Any additional notes..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            ></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            @click="showAdvanceModal = false"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="submitAdvance"
            :disabled="advanceSubmitting"
            class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="advanceSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>Save Advance</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Update Patient Modal -->
    <EditPatientModal 
      :show="showUpdatePatientModal"
      :patient="admission?.patientId"
      @close="showUpdatePatientModal = false"
      @updated="onPatientUpdated"
    />

    <!-- Change Consultant Doctor Modal -->
    <div v-if="showDoctorModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 relative overflow-visible">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Consultant Doctor
          </h3>
          <button @click="showDoctorModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 space-y-4 min-h-[220px]">
          <div>
            <SearchableSelect
              v-model="selectedDoctorId"
              id="consultant-doctor-select"
              label="Select Consultant Doctor"
              placeholder="Search & select doctor..."
              :options="doctorOptions"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            @click="showDoctorModal = false"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="submitDoctorChange"
            :disabled="doctorSubmitting"
            class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <svg v-if="doctorSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Admission Modal -->
    <div 
      v-if="showEditAdmissionModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Edit Admission Details</h3>
            <p class="text-xs text-slate-400 mt-0.5">Modify admission info in case of entry errors.</p>
          </div>
          <button 
            @click="showEditAdmissionModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <form @submit.prevent="submitEditAdmission" class="p-6 overflow-y-auto space-y-4 flex-1">
          <!-- Admission Date & Time -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Admission Date & Time</label>
            <input 
              v-model="editAdmissionForm.admissionDate"
              type="datetime-local"
              required
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium text-xs transition-all"
            />
          </div>

          <!-- Admission Type & Payer Type Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Admission Type</label>
              <select 
                v-model="editAdmissionForm.admissionType"
                required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Payer Type</label>
              <select 
                v-model="editAdmissionForm.payerType"
                required
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="MUHCS">MUHCS</option>
                <option value="MR_STATE">MR (STATE)</option>
                <option value="MR_CENTRAL">MR (CENTRAL)</option>
                <option value="HEALTH_INSURANCE">HEALTH INSURANCE</option>
              </select>
            </div>
          </div>

          <!-- Diagnosis -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Preliminary Diagnosis</label>
            <input 
              v-model="editAdmissionForm.diagnosis"
              type="text"
              placeholder="e.g. Acute Appendicitis"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium text-xs transition-all"
            />
          </div>

          <!-- Remarks -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Admission Remarks / Notes</label>
            <textarea 
              v-model="editAdmissionForm.remarks"
              rows="3"
              placeholder="Any specific instructions or notes..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium text-xs transition-all"
            ></textarea>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button"
              @click="showEditAdmissionModal = false"
              class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="editAdmissionSubmitting"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg v-if="editAdmissionSubmitting" class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Discharge Admission Modal Overlay -->
    <div v-if="showDischargeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Discharge Patient</h3>
            <p class="text-xs text-slate-400 mt-0.5">Discharge patient and release bed allocation.</p>
          </div>
          <button @click="showDischargeModal = false" class="text-slate-400 hover:text-slate-600 rounded-xl p-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleDischarge" class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Action / Status</label>
            <select 
              v-model="dischargeForm.status"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            >
              <option value="DISCHARGED">DISCHARGE PATIENT (Frees bed allocation)</option>
              <option value="CANCELLED">CANCEL ADMISSION</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Discharge Remarks / Notes</label>
            <textarea 
              v-model="dischargeForm.remarks"
              rows="3"
              placeholder="e.g. Patient recovered well and discharged with medication instructions..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              @click="showDischargeModal = false" 
              class="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="isProcessingDischarge"
              class="px-5 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              :class="dischargeForm.status === 'DISCHARGED' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-slate-700 hover:bg-slate-800'"
            >
              <svg v-if="isProcessingDischarge" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ dischargeForm.status === 'DISCHARGED' ? 'Discharge Patient' : 'Confirm Cancel' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
