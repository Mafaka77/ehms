<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import logoUrl from '../../../assets/logo_final.png'

const props = defineProps({
  admissionId: {
    type: String,
    required: true
  },
  admission: {
    type: Object,
    required: true
  }
})

const snackbarStore = useSnackbarStore()
const admissionStore = useIpdAdmissionStore()

const loading = ref(false)
const saving = ref(false)

const getNowDateTimeString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const form = ref({
  admissionId: props.admissionId,
  patientId: props.admission?.patientId?._id || props.admission?.patientId,
  consultantId: props.admission?.consultantDoctorId?._id || props.admission?.consultantDoctorId,
  dischargeDate: getNowDateTimeString(),
  dischargeType: 'NORMAL',
  finalDiagnosis: '',
  chiefComplaints: '',
  vitalsOnAdmission: {
    temperature: '',
    pulse: '',
    respiration: '',
    bp: '',
    oxygenSaturation: ''
  },
  historyOfPresentIllness: '',
  pastHistory: '',
  clinicalFindings: '',
  investigationSummary: '',
  conditionAtDischarge: '',
  dischargeAdvice: '',
  followUpAdvice: '',
  remarks: '',
  status: 'DRAFT'
})

const loadSummary = async () => {
  loading.value = true
  try {
    const res = await admissionStore.fetchDischargeSummary(props.admissionId)
    if (res.success && res.data) {
      const d = res.data
      form.value.dischargeType = d.dischargeType || 'NORMAL'
      form.value.finalDiagnosis = d.finalDiagnosis || ''
      form.value.chiefComplaints = d.chiefComplaints || ''
      form.value.vitalsOnAdmission = {
        temperature: d.vitalsOnAdmission?.temperature || '',
        pulse: d.vitalsOnAdmission?.pulse || '',
        respiration: d.vitalsOnAdmission?.respiration || '',
        bp: d.vitalsOnAdmission?.bp || '',
        oxygenSaturation: d.vitalsOnAdmission?.oxygenSaturation || ''
      }
      form.value.historyOfPresentIllness = d.historyOfPresentIllness || ''
      form.value.pastHistory = d.pastHistory || ''
      form.value.clinicalFindings = d.clinicalFindings || ''
      form.value.investigationSummary = d.investigationSummary || ''
      form.value.conditionAtDischarge = d.conditionAtDischarge || ''
      form.value.dischargeAdvice = d.dischargeAdvice || ''
      form.value.followUpAdvice = d.followUpAdvice || ''
      form.value.remarks = d.remarks || ''
      form.value.status = d.status || 'DRAFT'

      if (d.dischargeDate) {
        form.value.dischargeDate = new Date(d.dischargeDate).toISOString().slice(0, 16)
      }
    }
  } catch (error) {
    console.error('Failed to load discharge summary record:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSummary()
})

watch(() => props.admissionId, () => {
  loadSummary()
})

const saveSummary = async (targetStatus = null) => {
  saving.value = true
  if (targetStatus) {
    form.value.status = targetStatus
  }
  try {
    const res = await admissionStore.saveDischargeSummary(props.admissionId, form.value)
    if (res.success) {
      snackbarStore.show({ message: 'Discharge summary saved successfully!', type: 'success' })
      if (res.data) {
        form.value.status = res.data.status
      }
    } else {
      snackbarStore.show({ message: res.message || 'Failed to save discharge summary', type: 'error' })
    }
  } catch (error) {
    console.error(error)
    snackbarStore.show({ message: 'Failed to save discharge summary', type: 'error' })
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const printSummary = () => {
  const patient = props.admission?.patientId || {}
  const doctor = props.admission?.consultantDoctorId || {}
  const bed = props.admission?.bedId || {}
  const ward = bed?.wardId || {}
  const f = form.value
  const v = f.vitalsOnAdmission || {}

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Discharge Summary - ${patient.fullName || 'Patient'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px; color: #0f172a; line-height: 1.5; font-size: 12px; }
          
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
          .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
          .logo-container { text-align: left; }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          .address-container { text-align: right; font-size: 10px; color: #475569; line-height: 1.4; }
          .hospital-name { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 2px 0; }
          .hospital-addr, .hospital-contact { margin: 0; font-weight: 500; }
          .header-title { text-align: center; margin-top: 4px; }
          .title-badge { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; background-color: #f1f5f9; padding: 4px 20px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; margin: 0; }
          
          .patient-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 15px; }
          .info-block { font-size: 11px; }
          .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 9px; margin-bottom: 1px; }
          .info-value { font-size: 12px; font-weight: 600; color: #0f172a; }

          .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; background: #fff; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 12px; text-align: center; }
          .vital-item { background: #f1f5f9; padding: 6px; rounded: 4px; }
          .vital-lbl { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .vital-val { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; }

          .section { margin-bottom: 12px; }
          .section-title { font-size: 12px; font-weight: 800; color: #1e293b; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .section-content { font-size: 11px; color: #334155; white-space: pre-wrap; word-wrap: break-word; line-height: 1.5; }

          .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; }
          .highlight-title { font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 3px; }
          .highlight-content { font-size: 12px; font-weight: 700; color: #14532d; white-space: pre-wrap; }

          .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #0f172a; padding-top: 4px; margin-top: 50px; font-weight: bold; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <div class="logo-container">
              <img src="${logoUrl}" alt="Hospital Logo" class="logo-img" />
            </div>
            <div class="address-container">
              <p class="hospital-name">EMMANUEL HOSPITAL</p>
              <p class="hospital-addr">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
              <p class="hospital-contact">Phone: 0389-2913340 / 8974326872</p>
            </div>
          </div>
          <div class="header-title">
            <h1 class="title-badge">DISCHARGE SUMMARY</h1>
          </div>
        </div>
        
        <div class="patient-card">
          <div class="info-block">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${patient.fullName || '-'}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Patient Code</div>
            <div class="info-value">${patient.patientCode || '-'}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Gender / Age</div>
            <div class="info-value">${patient.gender || '-'}, ${patient.age || '-'} Yrs</div>
          </div>
          <div class="info-block">
            <div class="info-label">IPD Admission No</div>
            <div class="info-value">${props.admission.admissionNo || '-'}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Admission Date</div>
            <div class="info-value">${formatDate(props.admission.admissionDate)}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Discharge Date</div>
            <div class="info-value">${formatDate(f.dischargeDate)}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Discharge Type</div>
            <div class="info-value">${f.dischargeType}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Ward / Bed</div>
            <div class="info-value">Bed ${bed.bedNo || '-'} (${ward.name || '-'})</div>
          </div>
          <div class="info-block" style="grid-column: span 2;">
            <div class="info-label">Consultant Doctor</div>
            <div class="info-value">${doctor.fullName || 'Consultant'}</div>
          </div>
          <div class="info-block" style="grid-column: span 2;">
            <div class="info-label">Summary Status</div>
            <div class="info-value">${f.status}</div>
          </div>
        </div>

        <!-- Admission Vitals -->
        <div class="section">
          <div class="section-title">Vitals on Admission</div>
          <div class="vitals-grid">
            <div class="vital-item">
              <div class="vital-lbl">Temperature</div>
              <div class="vital-val">${v.temperature || '—'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-lbl">Pulse Rate</div>
              <div class="vital-val">${v.pulse || '—'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-lbl">Respiration</div>
              <div class="vital-val">${v.respiration || '—'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-lbl">Blood Pressure</div>
              <div class="vital-val">${v.bp || '—'}</div>
            </div>
            <div class="vital-item">
              <div class="vital-lbl">SpO2</div>
              <div class="vital-val">${v.oxygenSaturation || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Final Diagnosis -->
        <div class="highlight-box">
          <div class="highlight-title">Final Diagnosis</div>
          <div class="highlight-content">${f.finalDiagnosis || 'Not specified'}</div>
        </div>

        <!-- Chief Complaints -->
        <div class="section" v-if="f.chiefComplaints">
          <div class="section-title">Chief Complaints</div>
          <div class="section-content">${f.chiefComplaints || '—'}</div>
        </div>

        <!-- History of Present Illness -->
        <div class="section" v-if="f.historyOfPresentIllness">
          <div class="section-title">History of Present Illness (HPI)</div>
          <div class="section-content">${f.historyOfPresentIllness || '—'}</div>
        </div>

        <!-- Past History -->
        <div class="section" v-if="f.pastHistory">
          <div class="section-title">Past History</div>
          <div class="section-content">${f.pastHistory || '—'}</div>
        </div>

        <!-- Clinical Findings -->
        <div class="section" v-if="f.clinicalFindings">
          <div class="section-title">Clinical Findings on Examination</div>
          <div class="section-content">${f.clinicalFindings || '—'}</div>
        </div>

        <!-- Investigation Summary -->
        <div class="section" v-if="f.investigationSummary">
          <div class="section-title">Investigation & Lab/Radiology Summary</div>
          <div class="section-content">${f.investigationSummary || '—'}</div>
        </div>

        <!-- Condition at Discharge -->
        <div class="section" v-if="f.conditionAtDischarge">
          <div class="section-title">Condition at Discharge</div>
          <div class="section-content">${f.conditionAtDischarge || '—'}</div>
        </div>

        <!-- Discharge Advice -->
        <div class="section">
          <div class="section-title">Discharge Advice & Prescribed Treatment</div>
          <div class="section-content">${f.dischargeAdvice || '—'}</div>
        </div>

        <!-- Follow-up Advice & Remarks -->
        <div class="section">
          <div class="section-title">Follow-up Advice & Remarks</div>
          <div class="section-content">${f.followUpAdvice || '—'} ${f.remarks ? '\n\nRemarks: ' + f.remarks : ''}</div>
        </div>
        
        <div class="footer">
          <div>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Report Generated: ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line">${doctor.fullName || 'Consultant Doctor'}<br><span style="font-weight: normal; font-size: 10px; color: #64748b;">(Attending / Authorized Consultant)</span></div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
}
</script>

<template>
  <div class="space-y-6 pb-8">
    
    <!-- Action Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-slate-900 text-base">Inpatient Discharge Summary</h3>
          <span 
            class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
            :class="form.status === 'FINAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
          >
            {{ form.status }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Comprehensive clinical discharge record filled by the attending doctor.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button 
          type="button"
          @click="printSummary"
          class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Summary
        </button>

        <button 
          type="button"
          @click="saveSummary('DRAFT')"
          :disabled="saving"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Save Draft
        </button>

        <button 
          type="button"
          @click="saveSummary('FINAL')"
          :disabled="saving"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Finalize Summary
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400 space-y-2">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xs font-semibold text-slate-600">Loading Discharge Summary...</p>
    </div>

    <!-- Main Doctor Form Container -->
    <div v-else class="space-y-6">

      <!-- Section 1: Discharge Meta & Type -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          1. Discharge Details &amp; Status
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <!-- Discharge Date -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Discharge Date &amp; Time <span class="text-rose-500">*</span></label>
            <input 
              type="datetime-local" 
              v-model="form.dischargeDate"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <!-- Discharge Type -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Discharge Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="form.dischargeType"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50 cursor-pointer"
            >
              <option value="NORMAL">Normal Discharge</option>
              <option value="LAMA">LAMA (Left Against Medical Advice)</option>
              <option value="DAMA">DAMA (Discharge Against Medical Advice)</option>
              <option value="REFERRED">Referred to Higher Center</option>
              <option value="EXPIRED">Expired / Deceased</option>
            </select>
          </div>

          <!-- Document Status -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Document Status</label>
            <select 
              v-model="form.status"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 bg-slate-50/50 cursor-pointer"
            >
              <option value="DRAFT">Draft Mode</option>
              <option value="FINAL">Finalized &amp; Locked</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 2: Vitals on Admission -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          2. Vitals Recorded on Admission
        </h4>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Temperature</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.temperature"
              placeholder="e.g. 98.6 °F"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Pulse Rate</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.pulse"
              placeholder="e.g. 78 bpm"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Respiration</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.respiration"
              placeholder="e.g. 18 /min"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Blood Pressure</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.bp"
              placeholder="e.g. 120/80 mmHg"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="font-semibold text-slate-600">SpO2 (Oxygen)</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.oxygenSaturation"
              placeholder="e.g. 98%"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      <!-- Section 3: Clinical Diagnosis & Complaints -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          3. Diagnosis &amp; Clinical Presentation
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Final Diagnosis -->
          <div class="space-y-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <label class="font-extrabold text-emerald-900 uppercase tracking-wider text-[11px] block">Final Diagnosis <span class="text-rose-500">*</span></label>
            <textarea 
              v-model="form.finalDiagnosis"
              rows="2"
              placeholder="Enter definitive final diagnosis..."
              class="w-full p-3 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-900 bg-white"
            ></textarea>
          </div>

          <!-- Chief Complaints -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Chief Complaints on Admission</label>
            <textarea 
              v-model="form.chiefComplaints"
              rows="2"
              placeholder="Enter chief complaints leading to admission..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- History of Present Illness (HPI) -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">History of Present Illness (HPI)</label>
            <textarea 
              v-model="form.historyOfPresentIllness"
              rows="2"
              placeholder="Detailed history of present illness..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Past History -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Past Medical / Surgical History</label>
            <textarea 
              v-model="form.pastHistory"
              rows="2"
              placeholder="Past medical history, allergies, chronic conditions..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Section 4: Clinical Findings & Hospital Course -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          4. Examination, Investigations &amp; Condition
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Clinical Findings -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Clinical Findings on Examination</label>
            <textarea 
              v-model="form.clinicalFindings"
              rows="3"
              placeholder="Physical examination findings, systemic evaluation..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Investigation Summary -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Investigation &amp; Lab / Radiology Summary</label>
            <textarea 
              v-model="form.investigationSummary"
              rows="3"
              placeholder="Key diagnostic test results, blood work, X-Ray, USG, CT scans..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Condition at Discharge -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Condition of Patient at Discharge</label>
            <textarea 
              v-model="form.conditionAtDischarge"
              rows="2"
              placeholder="e.g. Patient is afebrile, clinically stable, wound clean and intact..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Section 5: Discharge Advice & Follow-up -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          5. Discharge Advice, Medications &amp; Follow-up
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Discharge Advice -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Discharge Advice &amp; Prescribed Treatment / Medications <span class="text-rose-500">*</span></label>
            <textarea 
              v-model="form.dischargeAdvice"
              rows="4"
              placeholder="List discharge medications with dosage, frequency, dietary advice, and activity restrictions..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Follow-up Advice -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Follow-up Advice &amp; Instructions</label>
            <textarea 
              v-model="form.followUpAdvice"
              rows="2"
              placeholder="When to return for OPD follow-up or suture removal..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Remarks -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Special Remarks / Emergency Warning Instructions</label>
            <textarea 
              v-model="form.remarks"
              rows="2"
              placeholder="Emergency contact instructions or special precautions..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
