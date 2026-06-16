<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import PharmacyOrder from './PharmacyOrder.vue'
import BedHistory from './BedHistory.vue'
import PatientCharge from './PatientCharge.vue'
import DoctorCharges from './DoctorCharges.vue'
import PatientFiles from './PatientFIles.vue'
import Test from './Test.vue'
import { useIpdWardStore } from '../../../stores/ipdWardStore'

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

const loading = ref(true)
const admission = ref(null)
const activeTab = ref('charges') // charges, pharmacy, doctor_charges, files, bed_history

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
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateOnly = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
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

// Mock Data for Tabs
const mockCharges = computed(() => {
  if (!admission.value) return []
  const dailyRate = admission.value.bedId?.dailyRate || 1200
  const admitDate = new Date(admission.value.admissionDate)
  const days = Math.max(1, Math.ceil((new Date() - admitDate) / (1000 * 60 * 60 * 24)))
  
  return [
    {
      date: formatDateOnly(admission.value.admissionDate),
      item: `IPD Bed Rental (Bed ${admission.value.bedId?.bedNo || 'N/A'} - ${admission.value.bedId?.wardId?.name || 'General Ward'})`,
      category: 'Room/Bed Charge',
      rate: dailyRate,
      qty: days,
      amount: dailyRate * days
    },
    {
      date: formatDateOnly(admission.value.admissionDate),
      item: `Initial Admission Charges`,
      category: 'Registration',
      rate: 350,
      qty: 1,
      amount: 350
    },
    {
      date: formatDateOnly(new Date()),
      item: `Consultant Visit (Dr. ${admission.value.consultantDoctorId?.fullName || 'N/A'})`,
      category: 'Professional Fees',
      rate: 500,
      qty: Math.max(1, days),
      amount: 500 * Math.max(1, days)
    },
    {
      date: formatDateOnly(new Date()),
      item: `Nursing Care Charges (Daily)`,
      category: 'Nursing Charges',
      rate: 250,
      qty: days,
      amount: 250 * days
    }
  ]
})

const totalChargesAmount = computed(() => {
  return mockCharges.value.reduce((sum, charge) => sum + charge.amount, 0)
})

const mockPharmacyOrders = ref([
  {
    orderNo: 'RX-IPD-0254',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      { name: 'Paracetamol 650mg', qty: 10, frequency: 'TDS (Three times a day)', status: 'ISSUED' },
      { name: 'Pantoprazole 40mg', qty: 5, frequency: 'OD (Once daily - Empty stomach)', status: 'ISSUED' }
    ],
    priority: 'NORMAL',
    status: 'ISSUED'
  },
  {
    orderNo: 'RX-IPD-0279',
    date: new Date().toISOString(),
    items: [
      { name: 'Amoxicillin 500mg', qty: 15, frequency: 'TDS', status: 'PENDING' },
      { name: 'Cough Syrup 100ml', qty: 1, frequency: 'BD (Twice a day)', status: 'PENDING' }
    ],
    priority: 'URGENT',
    status: 'PENDING'
  }
])

const mockNotes = computed(() => [
  {
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'CLINICAL_NOTE',
    content: 'Patient admitted with complaints of acute abdominal pain. Preliminary checkups done. Vital parameters are stable. Advised ultrasound scan and basic hematology profiles.',
    author: admission.value?.consultantDoctorId?.fullName ? 'Dr. ' + admission.value.consultantDoctorId.fullName : 'Consultant Doctor'
  },
  {
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: 'PROGRESS_NOTE',
    content: 'Administered IV fluids and pain management drugs. Patient reports reduction in pain intensity. Urine output is normal. Checked BP (120/80 mmHg) and Temperature (98.6°F) at regular intervals.',
    author: 'Nurse Administrator'
  },
  {
    date: new Date().toISOString(),
    type: 'CLINICAL_NOTE',
    content: 'Reviewed lab profiles. Mild leukocytosis noted. Continue with antibiotic therapy. Patient is allowed liquids only. To be kept under close observations.',
    author: admission.value?.consultantDoctorId?.fullName ? 'Dr. ' + admission.value.consultantDoctorId.fullName : 'Consultant Doctor'
  }
])



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
      <div v-if="admission" class="flex items-center gap-2">
        <span 
          class="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border"
          :class="getStatusColor(admission.status)"
        >
          {{ admission.status }}
        </span>
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
              <p class="font-bold text-slate-800 text-sm">Dr. {{ admission.consultantDoctorId?.fullName || 'N/A' }}</p>
              <p class="text-xs text-slate-500">{{ admission.consultantDoctorId?.specializationId?.name || 'General Consultant' }}</p>
            </div>
          </div>
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
          @click="activeTab = 'doctor_charges'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'doctor_charges' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Doctor Charges
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
          @click="activeTab = 'files'"
          class="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'files' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Patient Files
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

        <!-- Tab: Patient Files -->
        <div v-else-if="activeTab === 'files'" class="space-y-4 animate-in fade-in duration-200">
          <PatientFiles :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Test & Diagnostics -->
        <div v-else-if="activeTab === 'tests'" class="space-y-4 animate-in fade-in duration-200">
          <Test :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Doctor Charges -->
        <div v-else-if="activeTab === 'doctor_charges'" class="space-y-4 animate-in fade-in duration-200">
          <DoctorCharges :admissionId="admission._id" :admission="admission" />
        </div>

        <!-- Tab: Bed History -->
        <div v-else-if="activeTab === 'bed_history'" class="space-y-4 animate-in fade-in duration-200">
          <BedHistory :admissionId="admission._id" :admission="admission" />
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
        <!-- Select Ward -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Ward</label>
          <select 
            v-model="transferForm.wardId"
            @change="onWardChange"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
          >
            <option value="">Select Ward...</option>
            <option 
              v-for="ward in wardStore.wards" 
              :key="ward._id" 
              :value="ward._id"
            >
              {{ ward.name }} (Floor: {{ ward.floor || '-' }})
            </option>
          </select>
        </div>

        <!-- Select Bed -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Bed</label>
          <select 
            v-model="transferForm.bedId"
            :disabled="!transferForm.wardId"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white disabled:bg-slate-50 font-medium text-xs transition-all"
          >
            <option value="">Select Bed...</option>
            <option 
              v-for="bed in availableBeds" 
              :key="bed._id" 
              :value="bed._id"
            >
              Bed {{ bed.bedNo }} ({{ bed.bedType }} - ₹{{ bed.dailyRate }}/day)
            </option>
          </select>
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
  </div>
</template>
