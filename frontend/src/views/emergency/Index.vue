<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useEmergencyStore } from '../../stores/emergencyStore'
import { usePatientStore } from '../../stores/patientStore'
import { useDoctorStore } from '../../stores/doctorStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import { useAuthStore } from '../../stores/authStore'
import BaseInput from '../../components/BaseInput.vue'
import BaseSelect from '../../components/BaseSelect.vue'
import BaseTextarea from '../../components/BaseTextarea.vue'
import SearchableSelect from '../../components/SearchableSelect.vue'
import EmergencyCard from '../../components/EmergencyCard.vue'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

import RegisterVisitModal from './RegisterVisitModal.vue'

const emergencyStore = useEmergencyStore()
const patientStore = usePatientStore()
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const loading = ref(true)

// Print Modal State
const showCardModal = ref(false)
const selectedVisitForPrint = ref(null)
const pdfPreviewUrl = ref(null)
const printingPDF = ref(false)
const currentFilename = ref('')

// Create Visit Modal State
const showRegisterModal = ref(false)

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
  emergencyStore.fetchEmergencyDoctors() // Non-blocking preload
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

const openPrintModal = async (visit) => {
  selectedVisitForPrint.value = visit
  pdfPreviewUrl.value = null
  showCardModal.value = true
  
  await generateCardPDF()
}

const closeModal = () => {
  showCardModal.value = false
  if (pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = null
  }
  setTimeout(() => {
    selectedVisitForPrint.value = null
  }, 200)
}

// Open Register Modal
const openRegisterModal = () => {
  showRegisterModal.value = true
}

const onVisitRegistered = async (registeredVisit) => {
  await fetchVisits()
  if (registeredVisit) {
    const fullVisit = emergencyStore.visits.find(v => v._id === registeredVisit._id) || registeredVisit
    openPrintModal(fullVisit)
  }
}

const doctorOptions = computed(() => {
  return emergencyStore.emergencyDoctors.map(doctor => ({
    value: doctor._id,
    label: ` ${doctor.fullName} - ${doctor.specializationId?.name || 'Emergency Medicine'}`
  }))
})

// Print/PDF Generation Logic
const generateCardPDF = async () => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
    // Wait for the modal and component to render fully
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const element = document.querySelector('.print-card-wrapper')
    if (!element) throw new Error('Card container not found')
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    
    const ratio = pdfWidth / canvas.width
    const imgHeight = canvas.height * ratio
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight)
    
    const patientName = selectedVisitForPrint.value?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const filename = `Emergency_Card_${patientName}.pdf`
    currentFilename.value = filename
    
    const blob = pdf.output('blob')
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = URL.createObjectURL(blob)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    snackbarStore.show({ message: 'Failed to generate PDF Preview', type: 'error' })
  } finally {
    printingPDF.value = false
  }
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200/80'
    case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200/80'
    case 'MEDIUM': return 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
    case 'LOW': return 'bg-slate-50 text-slate-600 border-slate-200/80'
    default: return 'bg-slate-50 text-slate-600 border-slate-200/80'
  }
}

const getPaymentColor = (status) => {
  switch (status) {
    case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
    case 'Partially Paid': return 'bg-amber-50 text-amber-700 border-amber-200/80'
    default: return 'bg-rose-50 text-rose-700 border-rose-200/80'
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
    const docName = visit.doctorId ? ` ${visit.doctorId.fullName}` : 'On Duty'
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

// Edit Modal States & Logic
const showEditModal = ref(false)
const isUpdating = ref(false)
const editForm = ref({
  _id: '',
  doctorId: '',
  arrivalDateTime: '',
  chiefComplaint: '',
  priority: 'MEDIUM',
  notes: '',
  consultationFee: 0,
  hasBill: false,
  patientName: ''
})

const openEditModal = (visit) => {
  editForm.value = {
    _id: visit._id,
    doctorId: visit.doctorId?._id || visit.doctorId || '',
    arrivalDateTime: visit.arrivalDateTime ? new Date(visit.arrivalDateTime).toISOString().slice(0, 16) : '',
    chiefComplaint: visit.chiefComplaint || '',
    priority: visit.priority || 'MEDIUM',
    notes: visit.notes || '',
    consultationFee: visit.consultationFee !== undefined ? visit.consultationFee : 0,
    hasBill: !!(visit.consultationBillId || visit.dischargeBillId || visit.billId),
    patientName: visit.patientId?.fullName || ''
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!editForm.value.doctorId || !editForm.value.arrivalDateTime || !editForm.value.patientName) {
    snackbarStore.show({ message: 'Patient Name, Doctor, and Date/Time are required', type: 'error' })
    return
  }
  isUpdating.value = true
  const res = await emergencyStore.updateVisit(editForm.value._id, {
    doctorId: editForm.value.doctorId,
    arrivalDateTime: editForm.value.arrivalDateTime,
    chiefComplaint: editForm.value.chiefComplaint,
    priority: editForm.value.priority,
    notes: editForm.value.notes,
    consultationFee: Number(editForm.value.consultationFee || 0),
    patientName: editForm.value.patientName
  })
  isUpdating.value = false
  if (res.success) {
    snackbarStore.show({ message: 'Emergency visit updated successfully!', type: 'success' })
    showEditModal.value = false
    fetchVisits()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to update emergency visit', type: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-900 tracking-tight">Emergency Visits</h1>
            <span class="px-2.5 py-0.5 text-xs font-extrabold bg-rose-50 text-rose-700 rounded-full border border-rose-100">
              {{ emergencyStore.pagination.total }} Total
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Manage emergency room registrations, triage levels, and arrival logs.</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <button 
          @click="showReportModal = true"
          class="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Report
        </button>
        <button 
          @click="openRegisterModal"
          class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register ER Visit
        </button>
      </div>
    </div>

    <!-- Table Card Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Filters Toolbar -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Priority Filter -->
          <div class="relative">
            <select 
              v-model="filters.priority" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 min-w-[150px] cursor-pointer shadow-2xs transition-all"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          
          <!-- Doctor Filter -->
          <div class="relative">
            <select 
              v-model="filters.doctorId" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 min-w-[180px] cursor-pointer shadow-2xs transition-all"
            >
              <option value="">All Triage Doctors</option>
              <option v-for="doc in emergencyStore.emergencyDoctors" :key="doc._id" :value="doc._id">
                {{ doc.fullName }}
              </option>
            </select>
          </div>

          <!-- Date Filter -->
          <div>
            <input 
              type="date" 
              v-model="filters.date" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 cursor-pointer shadow-2xs transition-all"
            />
          </div>

          <!-- Clear Filters -->
          <button 
            v-if="filters.priority || filters.doctorId || filters.date"
            @click="clearFilters"
            class="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 transition-all cursor-pointer flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>

        <div class="text-xs font-bold text-slate-500">
          Showing <span class="text-slate-800 font-extrabold">{{ emergencyStore.visits.length }}</span> of <span class="text-slate-800 font-extrabold">{{ emergencyStore.pagination.total }}</span> visits
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead class="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
            <tr>
              <th class="px-6 py-3.5">Visit No</th>
              <th class="px-6 py-3.5">Patient Details</th>
              <th class="px-6 py-3.5">Triage Doctor</th>
              <th class="px-6 py-3.5">Arrival Date/Time</th>
              <th class="px-6 py-3.5">Priority</th>
              <th class="px-6 py-3.5 text-center">Payment</th>
              <th class="px-6 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <!-- Skeleton Loading -->
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                  <div class="h-3 bg-slate-200 rounded w-24"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded w-28 mb-1"></div>
                  <div class="h-3 bg-slate-200 rounded w-20"></div>
                </td>
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-28"></div></td>
                <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded w-16"></div></td>
                <td class="px-6 py-4 text-center"><div class="h-6 bg-slate-200 rounded w-16 mx-auto"></div></td>
                <td class="px-6 py-4 text-center"><div class="h-8 mx-auto bg-slate-200 rounded w-24"></div></td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="emergencyStore.visits.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <div class="w-12 h-12 mx-auto bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p class="font-bold text-slate-600 text-sm">No emergency visits found.</p>
                <p class="text-xs text-slate-400 mt-1">Try adjusting your filters or register a new ER visit.</p>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr 
              v-else
              v-for="v in emergencyStore.visits" 
              :key="v._id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="font-mono text-rose-600 font-bold bg-rose-50/70 border border-rose-100/80 px-2 py-0.5 rounded-md text-xs inline-block">
                  {{ v.visitNo }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-100">
                    {{ v.patientId?.fullName?.charAt(0) || 'P' }}
                  </div>
                  <div>
                    <router-link :to="`/emergency/view/${v._id}`" class="font-bold text-slate-800 hover:text-rose-600 hover:underline block leading-tight text-xs cursor-pointer">
                      {{ v.patientId?.fullName || 'N/A' }}
                    </router-link>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                      {{ v.patientId?.patientCode || '-' }} • {{ v.patientId?.mobileNo }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800 text-xs">{{ v.doctorId?.fullName || 'On Duty' }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">{{ v.doctorId?.specializationId?.name || 'Emergency Services' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-slate-700 text-xs">{{ formatDate(v.createdAt) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
                  :class="getPriorityColor(v.priority)"
                >
                  {{ v.priority }}
                </span>
              </td>

              <td class="px-6 py-4 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
                  :class="getPaymentColor(v.paymentStatus)"
                >
                  {{ v.paymentStatus || 'Unpaid' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- View Button -->
                  <router-link
                    :to="`/emergency/view/${v._id}`"
                    class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-100"
                    title="View Dashboard"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </router-link>

                  <!-- Print Button -->
                  <button 
                    v-if="authStore.hasPermission('emergency.print')"
                    @click.stop="openPrintModal(v)"
                    class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                    title="Print Emergency Card"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>

                  <!-- Edit Button -->
                  <button 
                    v-if="authStore.hasPermission('emergency.update')"
                    @click.stop="openEditModal(v)"
                    class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-amber-100"
                    title="Edit Emergency Visit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  
                  <!-- Delete Button -->
                  <button 
                    v-if="['SuperAdmin', 'Super Admin'].includes(authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role)"
                    @click.stop="handleDelete(v._id)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-100"
                    title="Delete Visit Record"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="emergencyStore.pagination.pages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <button 
          @click="filters.page--" 
          :disabled="filters.page === 1"
          class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Previous
        </button>
        <span class="text-xs font-bold text-slate-600">
          Page {{ filters.page }} of {{ emergencyStore.pagination.pages }}
        </span>
        <button 
          @click="filters.page++" 
          :disabled="filters.page === emergencyStore.pagination.pages"
          class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Next
        </button>
      </div>

    </div>
    
    <!-- Register ER Visit Modal Component -->
    <RegisterVisitModal
      v-model:show="showRegisterModal"
      @registered="onVisitRegistered"
    />
    
    <!-- Print Modal Overlay -->
    <div v-if="showCardModal && selectedVisitForPrint" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div>
            <h2 class="text-base font-bold text-slate-800">Emergency Card Preview</h2>
            <p class="text-xs text-slate-500">Preview and print the Emergency Department Triage Card.</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="closeModal"
              class="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <a 
              v-if="pdfPreviewUrl"
              :href="pdfPreviewUrl"
              :download="currentFilename"
              class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF
            </a>
          </div>
        </div>

        <!-- Scrollable Print Area / PDF Preview -->
        <div class="flex-grow flex flex-col relative bg-slate-600">
          
          <!-- Loading State -->
          <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-20">
            <div class="flex flex-col items-center">
              <span class="animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-t-transparent mb-3"></span>
              <span class="text-white font-medium shadow-sm text-xs">Generating PDF Preview...</span>
            </div>
          </div>

          <!-- Hidden DOM for html2canvas -->
          <div v-show="!pdfPreviewUrl" class="absolute inset-0 overflow-y-auto bg-slate-200 p-8 flex justify-center z-0" style="opacity: 0; pointer-events: none;">
             <div class="print-card-wrapper bg-white">
               <EmergencyCard :visit="selectedVisitForPrint" />
             </div>
          </div>
          
          <!-- PDF Preview Iframe -->
          <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="w-full h-full border-0 z-10 relative" title="PDF Preview"></iframe>
        </div>
        
      </div>
    </div>

    <!-- Report Modal Overlay -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showReportModal = false"></div>
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 class="text-base font-bold text-slate-800">Generate Emergency Report</h2>
            <p class="text-xs text-slate-500 mt-0.5">Filter by date range, priority, or doctor to export data.</p>
          </div>
          <button 
            @click="showReportModal = false"
            class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
              <input 
                type="date" 
                v-model="reportFilters.startDate"
                class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">End Date</label>
              <input 
                type="date" 
                v-model="reportFilters.endDate"
                class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Doctor (Optional)</label>
            <select 
              v-model="reportFilters.doctorId" 
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all cursor-pointer"
            >
              <option value="">All Doctors</option>
              <option v-for="doc in emergencyStore.emergencyDoctors" :key="doc._id" :value="doc._id">
                {{ doc.fullName }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Priority (Optional)</label>
            <select 
              v-model="reportFilters.priority" 
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all cursor-pointer"
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
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="handleGenerateReport"
            :disabled="generatingReport"
            class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="generatingReport" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export to Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal Overlay -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showEditModal = false"></div>
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 class="text-base font-bold text-slate-800">Edit Emergency Visit</h2>
            <p class="text-xs text-slate-500 mt-0.5">Update details of the emergency visit record.</p>
          </div>
          <button 
            @click="showEditModal = false"
            class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <!-- Info Alert if Billed -->
          <div v-if="editForm.hasBill" class="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex gap-2.5 text-xs text-amber-800">
            <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <p class="font-bold">Bill Generated</p>
              <p class="mt-0.5">A bill is already generated for this visit. Modifying the doctor or consultation fee is disabled.</p>
            </div>
          </div>

          <!-- Patient Name Input -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Name</label>
            <input 
              type="text" 
              v-model="editForm.patientName"
              placeholder="Enter correct patient name"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
            />
          </div>

          <!-- Doctor Selection -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">On Duty / Attending Doctor <span class="text-rose-500">*</span></label>
            <SearchableSelect 
              v-model="editForm.doctorId"
              :options="doctorOptions"
              placeholder="Search or select doctor..."
              :disabled="editForm.hasBill"
              required
            />
          </div>

          <!-- Arrival Date / Time -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Arrival Date & Time</label>
            <input 
              type="datetime-local" 
              v-model="editForm.arrivalDateTime"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
            />
          </div>

          <!-- Chief Complaint -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Chief Complaint</label>
            <input 
              type="text" 
              v-model="editForm.chiefComplaint"
              placeholder="e.g. High fever, chest pain"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
            />
          </div>

          <!-- Triage Priority -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Triage Priority</label>
            <select 
              v-model="editForm.priority"
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 cursor-pointer transition-all"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <!-- Consultation Fee -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultation / ER Fee (₹)</label>
            <input 
              type="number" 
              v-model.number="editForm.consultationFee"
              :disabled="editForm.hasBill"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 font-mono disabled:bg-slate-100 disabled:text-slate-500 transition-all"
            />
          </div>

          <!-- Notes -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Clinical Notes</label>
            <textarea 
              v-model="editForm.notes"
              rows="3"
              placeholder="Enter clinical notes..."
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-700 transition-all"
            ></textarea>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            @click="showEditModal = false"
            class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="handleUpdate"
            :disabled="isUpdating"
            class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isUpdating" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Save Changes
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
