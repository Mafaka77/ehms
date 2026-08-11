<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { usePatientStore } from '../../../stores/patientStore'
import { useDoctorStore } from '../../../stores/doctorStore'
import { useIpdWardStore } from '../../../stores/ipdWardStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import BaseInput from '../../../components/BaseInput.vue'
import BaseSelect from '../../../components/BaseSelect.vue'
import BaseTextarea from '../../../components/BaseTextarea.vue'
import SearchableSelect from '../../../components/SearchableSelect.vue'

const router = useRouter()
const admissionStore = useIpdAdmissionStore()
const patientStore = usePatientStore()
const doctorStore = useDoctorStore()
const ipdWardStore = useIpdWardStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return roleName === 'SuperAdmin' || roleName === 'Super Admin'
})

const loading = ref(false)

// Wizard Modal State for New Admission
const showAdmitModal = ref(false)
const currentStep = ref(1)

// STEP 1: Patient Selection/Quick Registration
const searchQuery = ref('')
const searchTimeout = ref(null)
const isSearching = ref(false)
const selectedPatient = ref(null)
const showNewPatientForm = ref(false)
const newPatient = ref({
  fullName: '',
  mobileNo: '',
  gender: 'Male',
  dateOfBirth: '',
  address: ''
})
const isCreatingPatient = ref(false)

const getLocalDatetimeString = () => {
  const d = new Date()
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

// STEP 2: Doctor, Ward & Bed Selection
const admissionForm = ref({
  consultantDoctorId: '',
  wardId: '',
  bedId: '',
  admissionType: 'NORMAL',
  payerType: 'NORMAL',
  admissionDate: getLocalDatetimeString(),
  diagnosis: '',
  remarks: ''
})

const payerTypeOptions = [
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'MUHCS', label: 'MUHCS' },
  { value: 'MR_STATE', label: 'MR (STATE)' },
  { value: 'MR_CENTRAL', label: 'MR (CENTRAL)' },
  { value: 'HEALTH_INSURANCE', label: 'HEALTH INSURANCE' }
]
const availableBeds = ref([])
const loadingBeds = ref(false)
const isSubmittingAdmission = ref(false)

// Filters State
const filters = ref({
  page: 1,
  limit: 10,
  status: '',
  consultantDoctorId: '',
  date: '',
  search: ''
})

// Fetch Admissions from Store
const fetchAdmissions = async () => {
  loading.value = true
  const res = await admissionStore.fetchAdmissions(filters.value)
  if (!res.success) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Watch filters
watch(() => [filters.value.status, filters.value.consultantDoctorId, filters.value.date, filters.value.search], () => {
  filters.value.page = 1
  fetchAdmissions()
})

watch(() => filters.value.page, () => {
  fetchAdmissions()
})

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    status: '',
    consultantDoctorId: '',
    date: '',
    search: ''
  }
}

// Preload required data on load
onMounted(async () => {
  await fetchAdmissions()
  await doctorStore.fetchDoctors(1, 100)
  await ipdWardStore.fetchWards(1, 100)
})

// Patient Search
const handlePatientSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (!searchQuery.value || searchQuery.value.length < 3) {
    patientStore.searchResults = []
    return
  }
  
  isSearching.value = true
  searchTimeout.value = setTimeout(async () => {
    await patientStore.searchPatients(searchQuery.value)
    isSearching.value = false
  }, 400)
}

const selectPatient = (patient) => {
  selectedPatient.value = patient
  searchQuery.value = ''
  patientStore.searchResults = []
  currentStep.value = 2 // Move to next step (Doctor & Bed selection)
}

const toggleNewPatient = () => {
  showNewPatientForm.value = !showNewPatientForm.value
  if (showNewPatientForm.value) {
    if (/^\d{10}$/.test(searchQuery.value)) {
      newPatient.value = { fullName: '', mobileNo: searchQuery.value, gender: 'Male', dateOfBirth: '', address: '' }
    } else {
      newPatient.value = { fullName: searchQuery.value, mobileNo: '', gender: 'Male', dateOfBirth: '', address: '' }
    }
  }
}

const saveNewPatient = async () => {
  isCreatingPatient.value = true
  const res = await patientStore.createPatient(newPatient.value)
  isCreatingPatient.value = false
  
  if (res.success) {
    snackbarStore.show({ message: 'Patient registered successfully!', type: 'success' })
    selectPatient(res.data)
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Watch selected Ward to load its available beds
watch(() => admissionForm.value.wardId, async (newWardId) => {
  admissionForm.value.bedId = ''
  if (!newWardId) {
    availableBeds.value = []
    return
  }
  loadingBeds.value = true
  try {
    const bedsData = await ipdWardStore.fetchBeds(newWardId, 'AVAILABLE')
    availableBeds.value = bedsData || []
  } catch (err) {
    console.error('Failed to load beds:', err)
  } finally {
    loadingBeds.value = false
  }
})

// Open modal & reset states
const openAdmitModal = () => {
  currentStep.value = 1
  selectedPatient.value = null
  searchQuery.value = ''
  showNewPatientForm.value = false
  newPatient.value = { fullName: '', mobileNo: '', gender: 'Male', dateOfBirth: '', address: '' }
  admissionForm.value = {
    consultantDoctorId: '',
    wardId: '',
    bedId: '',
    admissionType: 'NORMAL',
    payerType: 'NORMAL',
    admissionDate: getLocalDatetimeString(),
    diagnosis: '',
    remarks: ''
  }
  showAdmitModal.value = true
}

const closeAdmitModal = () => {
  showAdmitModal.value = false
}

const goBackToPatient = () => {
  currentStep.value = 1
  selectedPatient.value = null
}

const submitAdmission = async () => {
  if (!selectedPatient.value) return
  if (!admissionForm.value.consultantDoctorId || !admissionForm.value.bedId) {
    snackbarStore.show({ message: 'Doctor and Bed allocation are required', type: 'warning' })
    return
  }
  if (admissionForm.value.admissionDate > getLocalDatetimeString()) {
    snackbarStore.show({ message: 'Future dates (postdating) are not allowed.', type: 'warning' })
    return
  }

  isSubmittingAdmission.value = true
  const payload = {
    patientId: selectedPatient.value._id,
    ...admissionForm.value
  }

  const res = await admissionStore.createAdmission(payload)
  isSubmittingAdmission.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Patient admitted successfully!', type: 'success' })
    showAdmitModal.value = false
    fetchAdmissions()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Discharge Modal State
const showDischargeModal = ref(false)
const selectedAdmissionForAction = ref(null)
const dischargeForm = ref({
  remarks: '',
  status: 'DISCHARGED'
})
const isProcessingDischarge = ref(false)

const openDischargeModal = (admission) => {
  selectedAdmissionForAction.value = admission
  dischargeForm.value.remarks = ''
  dischargeForm.value.status = 'DISCHARGED'
  showDischargeModal.value = true
}

const handleDischarge = async () => {
  if (!selectedAdmissionForAction.value) return
  isProcessingDischarge.value = true
  const res = await admissionStore.updateAdmission(selectedAdmissionForAction.value._id, {
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
    selectedAdmissionForAction.value = null
    fetchAdmissions()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Delete Admission Action
const deletingId = ref(null)

const handleDeleteAdmission = async (admission) => {
  const confirmInput = prompt(
    `WARNING: Permanently deleting this admission will also delete all associated bills, patient charges, pharmacy orders, lab/radiology orders, and medical histories.\n\nTo confirm, please type the Admission Number "${admission.admissionNo}":`
  )
  if (confirmInput !== admission.admissionNo) {
    if (confirmInput !== null) {
      snackbarStore.show({ message: 'Incorrect Admission Number. Deletion cancelled.', type: 'warning' })
    }
    return
  }

  deletingId.value = admission._id
  const res = await admissionStore.deleteAdmission(admission._id)
  deletingId.value = null

  if (res.success) {
    snackbarStore.show({ message: res.message || 'Admission deleted successfully!', type: 'success' })
    fetchAdmissions()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'ADMITTED': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'DISCHARGED': return 'bg-slate-100 border-slate-200 text-slate-700'
    case 'CANCELLED': return 'bg-rose-50 border-rose-200 text-rose-700'
    default: return 'bg-slate-50 border-slate-200 text-slate-700'
  }
}

const getAdmissionTypeColor = (type) => {
  switch (type) {
    case 'EMERGENCY': return 'bg-rose-100/70 text-rose-800 border-rose-200 font-bold'
    case 'TRANSFER': return 'bg-amber-100/70 text-amber-800 border-amber-200 font-bold'
    default: return 'bg-slate-100/70 text-slate-700 border-slate-200'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const dateObj = new Date(dateString)
  if (isNaN(dateObj.getTime())) return String(dateString)

  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  })
}

const doctorOptions = computed(() => {
  return doctorStore.doctors.map(doc => ({
    value: doc._id,
    label: `${doc.fullName} - ${doc.specializationId?.name || 'General'}`
  }))
})
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Header Banner & Action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-xs">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">IPD Inpatient Admissions</h1>
          <p class="text-xs font-semibold text-slate-500 mt-0.5">Manage patient bed allocations, ward transfers, consultant assignments, and discharges.</p>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button 
          v-if="authStore.hasPermission('ipd.admit')"
          @click="openAdmitModal"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer transform active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
          Admit New Patient
        </button>
      </div>
    </div>

    <!-- Main Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      
      <!-- Filters Header Bar -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col lg:flex-row justify-between items-center gap-3">
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <!-- Text Search -->
          <div class="relative min-w-[220px]">
            <input 
              v-model="filters.search"
              type="text" 
              placeholder="Search name, code, IPD no..." 
              class="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 shadow-2xs"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <select 
            v-model="filters.status" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <!-- Doctor Filter -->
          <select 
            v-model="filters.consultantDoctorId" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[170px]"
          >
            <option value="">All Doctors</option>
            <option v-for="doc in doctorStore.doctors" :key="doc._id" :value="doc._id">
              {{ doc.fullName }}
            </option>
          </select>

          <!-- Date Filter -->
          <input 
            type="date" 
            v-model="filters.date" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700"
          />

          <!-- Clear Filters -->
          <button 
            v-if="filters.status || filters.consultantDoctorId || filters.date || filters.search"
            @click="clearFilters"
            class="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer transition-all"
          >
            Clear Filters
          </button>
        </div>

        <div class="text-xs font-bold text-slate-500 whitespace-nowrap self-end lg:self-center">
          Total Admissions: <span class="text-slate-800 font-mono text-sm font-black">{{ admissionStore.pagination.total }}</span>
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
            <tr>
              <th class="px-5 py-3.5">IPD No / Date</th>
              <th class="px-5 py-3.5">Patient Details</th>
              <th class="px-5 py-3.5">Bed / Ward Location</th>
              <th class="px-5 py-3.5">Consultant Doctor</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-16 text-center text-slate-400">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="text-xs font-semibold">Loading IPD admissions list...</span>
              </td>
            </tr>
            <tr v-else-if="admissionStore.admissions.length === 0">
              <td colspan="6" class="px-6 py-16 text-center text-slate-500">
                <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
                </div>
                <p class="font-bold text-slate-700 text-sm">No IPD Admissions Found</p>
                <p class="text-xs text-slate-400 mt-0.5">Try modifying filters or admit a new patient.</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="adm in admissionStore.admissions" 
              :key="adm._id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <!-- IPD No & Date -->
              <td class="px-5 py-3.5">
                <span class="font-mono text-indigo-700 font-bold block text-xs">{{ adm.admissionNo }}</span>
                <span class="text-slate-400 text-[11px] mt-0.5 block">{{ formatDate(adm.admissionDate) }}</span>
              </td>
              
              <!-- Patient Details -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                    {{ (adm.patientId?.fullName || 'P')[0] }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 leading-snug">{{ adm.patientId?.fullName || 'N/A' }}</p>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ adm.patientId?.patientCode || '-' }} • {{ adm.patientId?.gender || '-' }}, {{ adm.patientId?.age || '?' }}y</p>
                  </div>
                </div>
              </td>
              
              <!-- Location Ward & Bed -->
              <td class="px-5 py-3.5">
                <p class="font-bold text-slate-800">Bed {{ adm.bedId?.bedNo || 'N/A' }}</p>
                <p class="text-[11px] text-slate-500 font-medium">{{ adm.bedId?.wardId?.name || 'Unknown Ward' }} <span v-if="adm.bedId?.bedType" class="text-slate-400">({{ adm.bedId.bedType }})</span></p>
              </td>
              
              <!-- Doctor -->
              <td class="px-5 py-3.5">
                <p class="font-bold text-slate-800">{{ adm.consultantDoctorId?.fullName || 'N/A' }}</p>
                <p class="text-[11px] text-slate-400">{{ adm.consultantDoctorId?.specializationId?.name || 'General Consultant' }}</p>
              </td>
              
              <!-- Status -->
              <td class="px-5 py-3.5">
                <span 
                  class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                  :class="getStatusColor(adm.status)"
                >
                  {{ adm.status }}
                </span>
              </td>
              
              <!-- Actions -->
              <td class="px-5 py-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button 
                    v-if="isSuperAdmin"
                    @click="router.push({ name: 'ipd-patient-view', params: { id: adm._id } })"
                    class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 transition-all border border-blue-100 cursor-pointer"
                    title="View Patient Medical Details"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <button 
                    v-if="isSuperAdmin && adm.status === 'ADMITTED'"
                    @click="openDischargeModal(adm)"
                    class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg font-bold text-[11px] transition-all border border-indigo-100 cursor-pointer"
                  >
                    Discharge / Cancel
                  </button>

                  <button 
                    v-if="authStore.user?.roleName === 'SuperAdmin' || authStore.user?.roleName === 'HospitalAdmin' || authStore.user?.role?.name === 'SuperAdmin' || authStore.user?.role?.name === 'HospitalAdmin'"
                    @click="handleDeleteAdmission(adm)"
                    :disabled="deletingId === adm._id"
                    class="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg font-bold text-[11px] transition-all border border-rose-100 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Delete Admission Record"
                  >
                    <svg v-if="deletingId === adm._id" class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="admissionStore.pagination.pages > 1" class="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
        <span class="text-slate-500 font-semibold">
          Page <strong class="text-slate-800">{{ filters.page }}</strong> of <strong class="text-slate-800">{{ admissionStore.pagination.pages }}</strong>
        </span>
        <div class="flex gap-1.5">
          <button 
            @click="filters.page--" 
            :disabled="filters.page === 1"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            Previous
          </button>
          <button 
            @click="filters.page++" 
            :disabled="filters.page === admissionStore.pagination.pages"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>

    </div>

    <!-- Wizard Admission Modal Overlay -->
    <div v-if="showAdmitModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] border border-slate-100">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 class="text-lg font-bold text-slate-900">New Patient Admission (IPD)</h2>
            <p class="text-xs text-slate-500 mt-0.5">Register or select a patient to allocate an available hospital bed.</p>
          </div>
          <button @click="closeAdmitModal" class="text-slate-400 hover:text-slate-600 rounded-xl p-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Stepper Indicators -->
        <div class="px-6 py-3.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-center gap-8 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'">1</span>
            <span class="text-xs font-bold" :class="currentStep === 1 ? 'text-indigo-600' : 'text-slate-500'">Select Patient</span>
          </div>
          <div class="w-12 h-0.5 bg-slate-200"></div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'">2</span>
            <span class="text-xs font-bold" :class="currentStep === 2 ? 'text-indigo-600' : 'text-slate-500'">Assign Bed & Doctor</span>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="p-6 flex-grow overflow-y-auto">
          
          <!-- STEP 1: Search and Select / Quick Registration -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div v-if="!showNewPatientForm" class="space-y-5">
              <div class="max-w-md mx-auto text-center">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Find Existing Patient Record</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg class="w-5 h-5" :class="isSearching ? 'text-indigo-500 animate-pulse' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    v-model="searchQuery"
                    @input="handlePatientSearch"
                    type="text" 
                    placeholder="Enter phone number or patient name..." 
                    class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <!-- Dropdown Results -->
              <div v-if="patientStore.searchResults.length > 0" class="border border-slate-200 rounded-xl overflow-hidden shadow-md bg-white max-h-60 overflow-y-auto text-xs">
                <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>SEARCH RESULTS</span>
                  <span>{{ patientStore.searchResults.length }} found</span>
                </div>
                <ul class="divide-y divide-slate-100">
                  <li 
                    v-for="p in patientStore.searchResults" 
                    :key="p._id"
                    @click="selectPatient(p)"
                    class="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <p class="text-sm font-bold text-slate-800">{{ p.fullName }} <span class="text-xs font-semibold text-slate-400">({{ p.gender }}, {{ p.age || '?' }}y)</span></p>
                      <p class="text-xs text-slate-500 font-mono mt-0.5">{{ p.patientCode }} • {{ p.mobileNo }}</p>
                    </div>
                    <button class="text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs">
                      Select
                    </button>
                  </li>
                </ul>
              </div>

              <!-- Empty Results -->
              <div v-if="searchQuery.length >= 3 && !isSearching && patientStore.searchResults.length === 0" class="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p class="font-bold text-slate-700">No patient found matching "{{ searchQuery }}"</p>
                <p class="text-slate-400 mt-0.5">Check spelling or proceed to register profile below.</p>
              </div>

              <div class="flex items-center justify-center py-1">
                <div class="w-1/3 border-t border-slate-200"></div>
                <span class="mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or</span>
                <div class="w-1/3 border-t border-slate-200"></div>
              </div>

              <div class="text-center">
                <button 
                  @click="toggleNewPatient"
                  class="bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-2xs"
                >
                  <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Register New Patient Profile
                </button>
              </div>
            </div>

            <!-- New Patient Registration Form -->
            <div v-else class="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 relative text-xs">
              <button @click="toggleNewPatient" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-lg p-1.5 shadow-2xs border border-slate-200 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <h3 class="text-sm font-bold text-slate-800 mb-0.5">Quick Registration</h3>
              <p class="text-xs text-slate-500 mb-4">Create a basic patient profile for IPD admission.</p>
              
              <form @submit.prevent="saveNewPatient" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BaseInput v-model="newPatient.fullName" id="fullName" label="Full Name" placeholder="e.g. Emily Brown" required />
                  <BaseInput v-model="newPatient.mobileNo" id="mobileNo" label="Mobile Number" placeholder="e.g. 9876543210" required />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BaseSelect
                    v-model="newPatient.gender"
                    id="gender"
                    label="Gender"
                    :options="['Male', 'Female', 'Other']"
                    required
                  />
                  <BaseInput v-model="newPatient.dateOfBirth" type="date" id="dob" label="Date of Birth" />
                </div>
                <BaseInput v-model="newPatient.address" id="address" label="Address" placeholder="e.g. 123 Main St" />
                
                <div class="pt-2 flex justify-end">
                  <button 
                    type="submit" 
                    :disabled="isCreatingPatient"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    <span v-if="isCreatingPatient" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                    <span>Save & Select</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- STEP 2: Allocating Bed and Consultant -->
          <div v-else class="space-y-5 text-xs">
            <!-- Selected Patient Card -->
            <div class="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Selected Patient</p>
                <p class="text-sm font-bold text-indigo-950">{{ selectedPatient?.fullName }}</p>
                <p class="text-xs text-indigo-700 font-mono mt-0.5">{{ selectedPatient?.patientCode }} • {{ selectedPatient?.mobileNo }}</p>
              </div>
              <button 
                @click="goBackToPatient"
                class="text-indigo-700 hover:text-indigo-900 text-xs font-bold bg-white shadow-2xs border border-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Change Patient
              </button>
            </div>

            <!-- Admission Details Form -->
            <form @submit.prevent="submitAdmission" class="space-y-4">
              <!-- Consultant Doctor Searchable select -->
              <div>
                <SearchableSelect
                  v-model="admissionForm.consultantDoctorId"
                  id="doctor-select"
                  label="Consulting Doctor"
                  placeholder="Select a consulting doctor..."
                  :options="doctorOptions"
                  :required="true"
                />
              </div>

              <!-- Ward and Bed Allocation -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BaseSelect
                  v-model="admissionForm.wardId"
                  id="ward-select"
                  label="Select Ward / Floor"
                  required
                >
                  <option value="" disabled>Choose a Ward...</option>
                  <option v-for="w in ipdWardStore.wards" :key="w._id" :value="w._id">
                    {{ w.name }} ({{ w.wardType }})
                  </option>
                </BaseSelect>

                <BaseSelect
                  v-model="admissionForm.bedId"
                  id="bed-select"
                  label="Assign Available Bed"
                  :disabled="loadingBeds || !admissionForm.wardId"
                  required
                >
                  <option value="" disabled>{{ loadingBeds ? 'Loading beds...' : 'Select a Bed...' }}</option>
                  <option v-for="b in availableBeds" :key="b._id" :value="b._id">
                    Bed {{ b.bedNo }} (₹{{ b.dailyRate }}/day - {{ b.bedType }})
                  </option>
                </BaseSelect>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BaseSelect
                  v-model="admissionForm.admissionType"
                  id="type-select"
                  label="Admission Type"
                  :options="['NORMAL', 'EMERGENCY', 'TRANSFER']"
                  required
                />

                <BaseSelect
                  v-model="admissionForm.payerType"
                  id="payer-type-select"
                  label="Payer Type"
                  required
                >
                  <option v-for="pt in payerTypeOptions" :key="pt.value" :value="pt.value">
                    {{ pt.label }}
                  </option>
                </BaseSelect>
                
                <BaseInput 
                  v-model="admissionForm.admissionDate"
                  type="datetime-local"
                  id="admissionDate"
                  label="Admission Date & Time"
                  :max="getLocalDatetimeString()"
                  required
                />
              </div>

              <div>
                <BaseInput 
                  v-model="admissionForm.diagnosis"
                  id="diagnosis"
                  label="Preliminary Diagnosis"
                  placeholder="e.g. Acute Appendicitis"
                />
              </div>

              <div>
                <BaseTextarea 
                  v-model="admissionForm.remarks"
                  id="remarks"
                  label="Admission Remarks / Notes"
                  placeholder="Any specific care instructions or notes..."
                  :rows="2"
                />
              </div>
            </form>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            @click="closeAdmitModal"
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button 
            v-if="currentStep === 2"
            @click="submitAdmission"
            :disabled="isSubmittingAdmission || !admissionForm.bedId || !admissionForm.consultantDoctorId"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isSubmittingAdmission" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
            <span>Confirm Admission</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Discharge & Cancel Admission Modal Overlay -->
    <div v-if="showDischargeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 class="text-base font-bold text-slate-900">Discharge / Cancel Admission</h2>
            <p class="text-xs text-slate-400 mt-0.5">Patient: <strong class="text-slate-700">{{ selectedAdmissionForAction?.patientId?.fullName }}</strong></p>
          </div>
          <button @click="showDischargeModal = false" class="text-slate-400 hover:text-slate-600 rounded-xl p-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4 text-xs">
          <BaseSelect
            v-model="dischargeForm.status"
            id="action-status"
            label="Select Action Status"
            required
          >
            <option value="DISCHARGED">Patient Discharged (Free Bed)</option>
            <option value="CANCELLED">Cancel Admission (Revert/Void)</option>
          </BaseSelect>

          <BaseTextarea 
            v-model="dischargeForm.remarks"
            id="action-remarks"
            label="Discharge Summary / Cancellation Reason"
            placeholder="Add final notes, diagnosis summary or cancellation reason here..."
            :rows="3"
            required
          />
        </div>

        <!-- Action Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            @click="showDischargeModal = false"
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="handleDischarge"
            :disabled="isProcessingDischarge || !dischargeForm.remarks.trim()"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isProcessingDischarge" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
            <span>Confirm Action</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
