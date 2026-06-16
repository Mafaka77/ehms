<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useEmergencyStore } from '../../stores/emergencyStore'
import { usePatientStore } from '../../stores/patientStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import BaseInput from '../../components/BaseInput.vue'
import BaseSelect from '../../components/BaseSelect.vue'
import BaseTextarea from '../../components/BaseTextarea.vue'
import SearchableSelect from '../../components/SearchableSelect.vue'
import EmergencyCard from '../../components/EmergencyCard.vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const emergencyStore = useEmergencyStore()
const patientStore = usePatientStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)

// Print Modal State
const showCardModal = ref(false)
const selectedVisitForPrint = ref(null)

// Create Visit Modal State
const showRegisterModal = ref(false)
const currentStep = ref(1) // 1: Select/Create Patient, 2: Visit details

// -- STEP 1: PATIENT SELECTION --
const searchQuery = ref('')
const searchTimeout = ref(null)
const isSearching = ref(false)
const selectedPatient = ref(null)

// For Creating New Patient
const showNewPatientForm = ref(false)
const newPatient = ref({
  fullName: '',
  mobileNo: '',
  gender: 'Male',
  dateOfBirth: ''
})
const isCreatingPatient = ref(false)

// -- STEP 2: REGISTER VISIT --
const visitForm = ref({
  doctorId: '',
  arrivalDateTime: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
  chiefComplaint: '',
  priority: 'MEDIUM',
  notes: ''
})
const isRegistering = ref(false)

// Filters State
const filters = ref({
  page: 1,
  limit: 10,
  priority: '',
  doctorId: '',
  date: ''
})

const fetchVisits = async () => {
  loading.value = true
  const res = await emergencyStore.fetchVisits(filters.value)
  if (!res.success) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Watch filters (except page) to reset page to 1
watch(() => [filters.value.priority, filters.value.doctorId, filters.value.date], () => {
  filters.value.page = 1
  fetchVisits()
})

// Watch page separately
watch(() => filters.value.page, () => {
  fetchVisits()
})

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    priority: '',
    doctorId: '',
    date: ''
  }
}

onMounted(async () => {
  await emergencyStore.fetchEmergencyDoctors() // Preload doctors for filter/select
  await fetchVisits()
})

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this emergency visit? This action cannot be undone.')) {
    const res = await emergencyStore.deleteVisit(id);
    if (res.success) {
      snackbarStore.show({ message: res.message, type: 'success' });
      fetchVisits();
    } else {
      snackbarStore.show({ message: res.message, type: 'error' });
    }
  }
}

const openPrintModal = (visit) => {
  if (visit.paymentStatus !== 'Paid') {
    snackbarStore.show({
      message: 'Please collect payment at Cashier counter before printing ER Card.',
      type: 'error'
    })
    return
  }
  selectedVisitForPrint.value = visit
  showCardModal.value = true
}

const closeModal = () => {
  showCardModal.value = false
  setTimeout(() => {
    selectedVisitForPrint.value = null
  }, 200)
}

// Open Register Modal
const openRegisterModal = () => {
  selectedPatient.value = null
  searchQuery.value = ''
  patientStore.searchResults = []
  showNewPatientForm.value = false
  currentStep.value = 1
  visitForm.value = {
    doctorId: '',
    arrivalDateTime: new Date().toISOString().slice(0, 16),
    chiefComplaint: '',
    priority: 'MEDIUM',
    notes: '',
    consultationFee: 250
  }
  showRegisterModal.value = true
}

// Handle Patient Search
const handleSearch = () => {
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
  currentStep.value = 2 // Move to next step
}

const toggleNewPatient = () => {
  showNewPatientForm.value = !showNewPatientForm.value
  if (showNewPatientForm.value) {
    if (/^\d{10}$/.test(searchQuery.value)) {
      newPatient.value = { fullName: '', mobileNo: searchQuery.value, gender: 'Male', dateOfBirth: '' }
    } else {
      newPatient.value = { fullName: searchQuery.value, mobileNo: '', gender: 'Male', dateOfBirth: '' }
    }
  }
}

const saveNewPatient = async () => {
  isCreatingPatient.value = true
  const res = await patientStore.createPatient(newPatient.value)
  isCreatingPatient.value = false
  
  if (res.success) {
    snackbarStore.show({ message: 'Patient Registered Successfully!', type: 'success' })
    selectPatient(res.data)
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const doctorOptions = computed(() => {
  return emergencyStore.emergencyDoctors.map(doctor => ({
    value: doctor._id,
    label: `Dr. ${doctor.fullName} - ${doctor.specializationId?.name || 'Emergency Medicine'}`
  }))
})

const submitVisit = async () => {
  if (!selectedPatient.value) return
  
  isRegistering.value = true
  const payload = {
    ...visitForm.value,
    patientId: selectedPatient.value._id
  }

  const res = await emergencyStore.registerVisit(payload)
  isRegistering.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Emergency Visit Registered Successfully!', type: 'success' })
    showRegisterModal.value = false
    await fetchVisits()
    // Instantly open the print modal for the newly registered visit card
    if (res.data) {
      openPrintModal(res.data)
    }
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Print/PDF Generation Logic
const printingPDF = ref(false)

const handlePrintCard = () => {
  window.print()
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'MEDIUM': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'LOW': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

// Report Modal State
const showReportModal = ref(false)
const generatingReport = ref(false)
const reportFilters = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  doctorId: '',
  priority: ''
})

const handleGenerateReport = async () => {
  generatingReport.value = true
  try {
    const res = await emergencyStore.fetchVisitsReport(reportFilters.value)
    if (res.success && res.data) {
      if (res.data.length === 0) {
        snackbarStore.show({ message: 'No records found for the selected filters', type: 'warning' })
        return
      }
      exportToExcel(res.data)
      showReportModal.value = false
    } else {
      snackbarStore.show({ message: res.message || 'Failed to fetch report data', type: 'error' })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    snackbarStore.show({ message: 'Error generating report', type: 'error' })
  } finally {
    generatingReport.value = false
  }
}

const exportToExcel = (reportData) => {
  const headers = [
    'Visit No', 'Arrival Date/Time', 'Patient Code', 'Patient Name', 'Age/Gender', 'Contact',
    'Consulting Doctor', 'Priority', 'Chief Complaint', 'Notes'
  ]

  const rows = [headers]

  reportData.forEach((visit) => {
    const visitNo = visit.visitNo || ''
    const arrivalTime = visit.arrivalDateTime ? new Date(visit.arrivalDateTime).toLocaleString('en-IN') : ''
    const patientCode = visit.patientId?.patientCode || ''
    const patientName = visit.patientId?.fullName || ''
    const patientAgeGender = `${visit.patientId?.age || ''} / ${visit.patientId?.gender || ''}`
    const patientContact = visit.patientId?.mobileNo || ''
    const docName = visit.doctorId ? `Dr. ${visit.doctorId.fullName}` : 'On Duty'
    const priority = visit.priority || ''
    const complaint = visit.chiefComplaint || ''
    const notes = visit.notes || ''

    rows.push([
      visitNo, arrivalTime, patientCode, patientName, patientAgeGender, patientContact,
      docName, priority, complaint, notes
    ])
  })

  const csvContent = "\uFEFF" + rows.map(e => e.map(val => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'string') {
      let clean = val.replace(/"/g, '""')
      if (clean.includes(',') || clean.includes('\n') || clean.includes(';') || clean.includes('\r')) {
        clean = `"${clean}"`
      }
      return clean
    }
    return val
  }).join(",")).join("\n")

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", blobUrl)
  link.setAttribute("download", `Emergency_Visits_Report_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Emergency Visits</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage emergency room registrations, triage, and arrival logs.</p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button 
          @click="showReportModal = true"
          class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
        >
          <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Generate Report
        </button>
        <button 
          @click="openRegisterModal"
          class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
          Register ER Visit
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Filters -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Priority Filter -->
          <select 
            v-model="filters.priority" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 min-w-[140px]"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          
          <!-- Doctor Filter -->
          <select 
            v-model="filters.doctorId" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 min-w-[180px]"
          >
            <option value="">All Triage Doctors</option>
            <option v-for="doc in emergencyStore.emergencyDoctors" :key="doc._id" :value="doc._id">
              Dr. {{ doc.fullName }}
            </option>
          </select>

          <!-- Date Filter -->
          <input 
            type="date" 
            v-model="filters.date" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700"
          />

          <!-- Clear Filters -->
          <button 
            v-if="filters.priority || filters.doctorId || filters.date"
            @click="clearFilters"
            class="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2"
          >
            Clear Filters
          </button>
        </div>

        <div class="text-sm font-semibold text-slate-600 whitespace-nowrap">
          Total: {{ emergencyStore.pagination.total }}
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
            <tr>
              <th class="px-6 py-4">Visit No</th>
              <th class="px-6 py-4">Patient</th>
              <th class="px-6 py-4">Triage Doctor</th>
              <th class="px-6 py-4">Arrival Date/Time</th>
              <th class="px-6 py-4">Priority</th>
              <th class="px-6 py-4">Chief Complaint</th>
              <th class="px-6 py-4 text-center">Payment</th>
              <th class="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                <svg class="animate-spin h-8 w-8 mx-auto text-rose-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading ER Visits...
              </td>
            </tr>
            <tr v-else-if="emergencyStore.visits.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p class="font-medium text-slate-600">No emergency visits found.</p>
                <p class="text-xs text-slate-400 mt-1">Try adjusting your filters or register a new visit.</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="v in emergencyStore.visits" 
              :key="v._id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="font-mono text-rose-600 font-semibold">{{ v.visitNo }}</span>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800">{{ v.patientId?.fullName || 'N/A' }}</p>
                <p class="text-xs text-slate-500">{{ v.patientId?.patientCode || '-' }} • {{ v.patientId?.mobileNo }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800">Dr. {{ v.doctorId?.fullName || 'On Duty' }}</p>
                <p class="text-xs text-slate-500">{{ v.doctorId?.specializationId?.name || 'Emergency Services' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-slate-700">{{ formatDate(v.arrivalDateTime) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border"
                  :class="getPriorityColor(v.priority)"
                >
                  {{ v.priority }}
                </span>
              </td>
              <td class="px-6 py-4 max-w-[200px] truncate">
                <span class="text-slate-600">{{ v.chiefComplaint || 'None' }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  class="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                  :class="v.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'"
                >
                  {{ v.paymentStatus || 'Unpaid' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- Print Button -->
                  <button 
                    @click.stop="openPrintModal(v)"
                    class="p-2 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Print Emergency Card"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
                  
                  <!-- Delete Button -->
                  <button 
                    @click.stop="handleDelete(v._id)"
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Visit Record"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="emergencyStore.pagination.pages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
        <button 
          @click="filters.page--" 
          :disabled="filters.page === 1"
          class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span class="text-sm font-semibold text-slate-600">
          Page {{ filters.page }} of {{ emergencyStore.pagination.pages }}
        </span>
        <button 
          @click="filters.page++" 
          :disabled="filters.page === emergencyStore.pagination.pages"
          class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

    </div>
    
    <!-- Register ER Visit Modal Overlay -->
    <div v-if="showRegisterModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-800">Register Emergency Visit</h2>
            <p class="text-xs text-slate-500 mt-0.5">Quickly register patient and triage logs for emergency arrival.</p>
          </div>
          <button @click="showRegisterModal = false" class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Stepper indicators -->
          <div class="flex items-center justify-center gap-6 pb-2">
            <span class="text-xs font-semibold px-2.5 py-1.5 rounded-full" :class="currentStep === 1 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'">1. Select Patient</span>
            <span class="text-slate-300">→</span>
            <span class="text-xs font-semibold px-2.5 py-1.5 rounded-full" :class="currentStep === 2 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'">2. Triage Details</span>
          </div>

          <!-- STEP 1: PATIENT SELECTION -->
          <div v-if="currentStep === 1" class="space-y-4">
            <div v-if="!showNewPatientForm" class="space-y-4">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Find Patient</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5" :class="isSearching ? 'text-rose-600 animate-pulse' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="searchQuery"
                  @input="handleSearch"
                  type="text" 
                  placeholder="Enter mobile number or name... (min 3 chars)" 
                  class="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 focus:bg-white transition-all"
                />
              </div>

              <!-- Search Results Dropdown -->
              <div v-if="patientStore.searchResults.length > 0" class="border border-slate-150 rounded-xl overflow-hidden shadow bg-white">
                <ul class="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  <li 
                    v-for="patient in patientStore.searchResults" 
                    :key="patient._id"
                    @click="selectPatient(patient)"
                    class="px-4 py-2.5 hover:bg-rose-50/50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p class="text-sm font-bold text-slate-800">{{ patient.fullName }} <span class="text-xs text-slate-500 font-medium">({{ patient.gender }}, {{ patient.age || '?' }}y)</span></p>
                      <p class="text-xs text-slate-500"><span class="font-mono">{{ patient.patientCode }}</span> • {{ patient.mobileNo }}</p>
                    </div>
                    <button class="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
                  </li>
                </ul>
              </div>

              <!-- No Results / Not Found -->
              <div v-if="searchQuery.length >= 3 && !isSearching && patientStore.searchResults.length === 0" class="text-center py-4">
                <p class="text-slate-500 text-xs font-semibold">No patient found matching your query.</p>
              </div>

              <div class="flex items-center pt-2">
                <div class="flex-grow border-t border-slate-200"></div>
                <span class="mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or</span>
                <div class="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                type="button"
                @click="toggleNewPatient"
                class="w-full bg-white border border-slate-200 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Register New Patient
              </button>
            </div>

            <!-- New Patient Form -->
            <div v-else class="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Registration</h3>
                <button type="button" @click="toggleNewPatient" class="text-xs text-rose-600 font-bold hover:underline">Cancel</button>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <BaseInput v-model="newPatient.fullName" id="fullName" label="Full Name" placeholder="e.g. John Doe" required />
                <BaseInput v-model="newPatient.mobileNo" id="mobileNo" label="Mobile Number" placeholder="e.g. 9876543210" required />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <BaseSelect
                  v-model="newPatient.gender"
                  id="gender"
                  label="Gender"
                  :options="['Male', 'Female', 'Other']"
                  required
                />
                <BaseInput v-model="newPatient.dateOfBirth" type="date" id="dob" label="Date of Birth" />
              </div>
              <button 
                type="button" 
                @click="saveNewPatient"
                :disabled="isCreatingPatient"
                class="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <svg v-if="isCreatingPatient" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Save & Proceed
              </button>
            </div>
          </div>

          <!-- STEP 2: TRIAGE VISIT DETAILS -->
          <div v-else class="space-y-4">
            <div class="bg-rose-50 border border-rose-100 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p class="text-xs font-bold text-rose-900">{{ selectedPatient?.fullName }}</p>
                <p class="text-[10px] text-rose-700 font-semibold">{{ selectedPatient?.patientCode }} • {{ selectedPatient?.mobileNo }}</p>
              </div>
              <button type="button" @click="currentStep = 1" class="text-[10px] text-rose-600 font-bold uppercase tracking-wider hover:underline">Change</button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <SearchableSelect
                  v-model="visitForm.doctorId"
                  id="doctor-select"
                  label="Triage Doctor on Duty (Optional)"
                  placeholder="Select a doctor..."
                  :options="doctorOptions"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <BaseSelect
                v-model="visitForm.priority"
                id="priority"
                label="Priority Level"
                :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
                required
              />
              <BaseInput 
                v-model="visitForm.arrivalDateTime"
                type="datetime-local"
                id="arrivalDateTime"
                label="Arrival Date/Time"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <BaseInput 
                v-model.number="visitForm.consultationFee"
                type="number"
                id="consultationFee"
                label="Emergency Rate (₹)"
                required
              />
              <BaseInput 
                v-model="visitForm.chiefComplaint" 
                id="chiefComplaint" 
                label="Chief Complaint" 
                placeholder="e.g. Severe chest pain, head injury..." 
              />
            </div>
            <BaseTextarea v-model="visitForm.notes" id="notes" label="Assigned Notes / Instructions" placeholder="Brief assessment notes..." :rows="2" />

            <button 
              type="button" 
              @click="submitVisit"
              :disabled="isRegistering"
              class="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <svg v-if="isRegistering" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Confirm ER Registration
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Print Modal Overlay -->
    <div v-if="showCardModal && selectedVisitForPrint" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-white print:hidden">
          <div>
            <h2 class="text-lg font-bold text-slate-800">Print Emergency Card</h2>
            <p class="text-sm text-slate-500">Preview and print the Emergency Department Triage Card.</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="closeModal"
              class="px-4 py-2 text-sm font-semibold text-slate-650 bg-slate-150 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button 
              @click="handlePrintCard"
              :disabled="printingPDF"
              class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span v-if="printingPDF" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Card
            </button>
          </div>
        </div>

        <!-- Scrollable Print Area -->
        <div class="flex-grow overflow-y-auto p-4 sm:p-8 bg-slate-200 print:p-0 print:bg-white print:overflow-visible">
          <!-- Render the Card Component -->
          <EmergencyCard :visit="selectedVisitForPrint" />
        </div>
        
      </div>
    </div>

    <!-- Report Modal Overlay -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showReportModal = false"></div>
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 class="text-lg font-bold text-slate-800">Generate Emergency Report</h2>
            <p class="text-xs text-slate-500 mt-0.5">Filter by date range, priority, or doctor to export data.</p>
          </div>
          <button 
            @click="showReportModal = false"
            class="text-slate-400 hover:text-slate-650 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Start Date</label>
              <input 
                type="date" 
                v-model="reportFilters.startDate"
                class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">End Date</label>
              <input 
                type="date" 
                v-model="reportFilters.endDate"
                class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-600">Filter by Doctor (Optional)</label>
            <select 
              v-model="reportFilters.doctorId" 
              class="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700"
            >
              <option value="">All Doctors</option>
              <option v-for="doc in emergencyStore.emergencyDoctors" :key="doc._id" :value="doc._id">
                Dr. {{ doc.fullName }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-600">Filter by Priority (Optional)</label>
            <select 
              v-model="reportFilters.priority" 
              class="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            @click="showReportModal = false"
            class="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleGenerateReport"
            :disabled="generatingReport"
            class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="generatingReport" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export to Excel
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
