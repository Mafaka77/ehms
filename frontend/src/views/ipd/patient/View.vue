<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import PharmacyOrder from './PharmacyOrder.vue'
import BedHistory from './BedHistory.vue'
import PatientCharge from './PatientCharge.vue'

import PatientFiles from './PatientFIles.vue'
import Test from './Test.vue'
import Transactions from './Transactions.vue'
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
const activeTab = ref('charges') // charges, pharmacy, doctor_charges, files, bed_history, transactions
const transactionsRef = ref(null)

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
          <button 
            @click="openAdvanceModal"
            class="mt-3 w-full py-1.5 border border-emerald-100 hover:border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Advance
          </button>
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
        <button 
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

        <!-- Tab: Patient Files -->
        <div v-else-if="activeTab === 'files'" class="space-y-4 animate-in fade-in duration-200">
          <PatientFiles :admissionId="admission._id" :admission="admission" />
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
        <div v-else-if="activeTab === 'transactions'" class="space-y-4 animate-in fade-in duration-200">
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

  </div>
</template>
