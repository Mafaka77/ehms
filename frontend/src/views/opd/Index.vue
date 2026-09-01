<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOpdStore } from '../../stores/opdStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import { useAuthStore } from '../../stores/authStore'
import OpdCard from '../../components/OpdCard.vue'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import SearchableSelect from '../../components/SearchableSelect.vue'

const router = useRouter()
const opdStore = useOpdStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const loading = ref(true)

// Print Modal State
const showCardModal = ref(false)
const selectedAppointmentForPrint = ref(null)
const pdfPreviewUrl = ref(null)
const currentFilename = ref('')
const printingPDF = ref(false)

// Filters State
const filters = ref({
  page: 1,
  limit: 10,
  status: '',
  doctorId: '',
  date: ''
})

const stats = computed(() => {
  const appointments = opdStore.appointments || []
  const booked = appointments.filter(a => a.status === 'Booked').length
  const draft = appointments.filter(a => a.status === 'Draft').length
  const total = opdStore.pagination.total || appointments.length
  return { booked, draft, total }
})

const fetchAppointments = async () => {
  loading.value = true
  const res = await opdStore.fetchAppointments(filters.value)
  if (!res.success) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Watch filters (except page) to reset page to 1
watch(() => [filters.value.status, filters.value.doctorId, filters.value.date], () => {
  filters.value.page = 1
  fetchAppointments()
})

// Watch page separately
watch(() => filters.value.page, () => {
  fetchAppointments()
})

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    status: '',
    doctorId: '',
    date: ''
  }
}

const isSyncing = ref(false)
const syncAppointmentDates = async () => {
  if (confirm('Are you sure you want to sync all appointment dates with their creation dates?')) {
    isSyncing.value = true
    const res = await opdStore.syncAppointmentDates()
    isSyncing.value = false
    if (res.success) {
      snackbarStore.show({ message: res.message || 'Appointment dates synced successfully', type: 'success' })
      fetchAppointments()
    } else {
      snackbarStore.show({ message: res.message || 'Failed to sync appointment dates', type: 'error' })
    }
  }
}

onMounted(async () => {
  opdStore.fetchOpdDoctors() // Non-blocking preload
  await fetchAppointments()
})

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
    const res = await opdStore.deleteAppointment(id);
    if (res.success) {
      snackbarStore.show({ message: res.message, type: 'success' });
      // Re-fetch to ensure pagination stays accurate
      fetchAppointments();
    } else {
      snackbarStore.show({ message: res.message, type: 'error' });
    }
  }
}

const openPrintModal = async (app) => {
  selectedAppointmentForPrint.value = app
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
    selectedAppointmentForPrint.value = null
  }, 200)
}

const generateCardPDF = async () => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
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
    
    const patientName = selectedAppointmentForPrint.value?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const filename = `OPD_Card_${patientName}.pdf`
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Booked': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
    case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200/80'
    case 'Draft': return 'bg-amber-50 text-amber-700 border-amber-200/80'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/80'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Report Modal State
const showReportModal = ref(false)
const generatingReport = ref(false)
const reportFilters = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  doctorId: ''
})

const handleGenerateReport = async () => {
  generatingReport.value = true
  try {
    const res = await opdStore.fetchAppointmentsReport(reportFilters.value)
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
    'Appointment ID', 'Appointment Date', 'Patient Code', 'Patient Name', 'Age/Gender', 'Contact',
    'Consulting Doctor', 'Status', 'Consultation Fee', 'Bill Number', 'Bill Date', 'Bill Gross',
    'Bill Discount', 'Bill Net Amount', 'Bill Paid', 'Bill Balance', 'Bill Status',
    'Bill Item Description', 'Bill Item Net Amount', 'Payments Details'
  ]

  const rows = [headers]

  reportData.forEach(({ appointment, bill, billItems, payments }) => {
    const apptId = appointment.appointmentId || ''
    const apptDate = appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN') : ''
    const patientCode = appointment.patientId?.patientCode || ''
    const patientName = appointment.patientId?.fullName || ''
    const patientAgeGender = `${appointment.patientId?.age || ''} / ${appointment.patientId?.gender || ''}`
    const patientContact = appointment.patientId?.mobileNo || ''
    const docName = appointment.doctorId ? appointment.doctorId.fullName : ''
    const status = appointment.status || ''
    const fee = appointment.consultationFee || 0

    const billNo = bill?.billNo || ''
    const billDate = bill?.generatedAt ? new Date(bill.generatedAt).toLocaleDateString('en-IN') : ''
    const billGross = bill?.grossAmount || 0
    const billDiscount = bill?.discountAmount || 0
    const billNet = bill?.netAmount || 0
    const billPaid = bill?.paidAmount || 0
    const billBal = bill?.balanceAmount || 0
    const billStatus = bill?.status || ''

    const paymentsSummary = payments && payments.length > 0 
      ? payments.map(p => `${p.paymentNo} (${p.paymentMode}: ₹${p.amount})`).join('; ')
      : 'No Payments'

    if (billItems && billItems.length > 0) {
      billItems.forEach((item, idx) => {
        rows.push([
          idx === 0 ? apptId : '',
          idx === 0 ? apptDate : '',
          idx === 0 ? patientCode : '',
          idx === 0 ? patientName : '',
          idx === 0 ? patientAgeGender : '',
          idx === 0 ? patientContact : '',
          idx === 0 ? docName : '',
          idx === 0 ? status : '',
          idx === 0 ? fee : '',
          idx === 0 ? billNo : '',
          idx === 0 ? billDate : '',
          idx === 0 ? billGross : '',
          idx === 0 ? billDiscount : '',
          idx === 0 ? billNet : '',
          idx === 0 ? billPaid : '',
          idx === 0 ? billBal : '',
          idx === 0 ? billStatus : '',
          item.description || '',
          item.netAmount || 0,
          idx === 0 ? paymentsSummary : ''
        ])
      })
    } else {
      rows.push([
        apptId, apptDate, patientCode, patientName, patientAgeGender, patientContact,
        docName, status, fee, billNo, billDate, billGross,
        billDiscount, billNet, billPaid, billBal, billStatus,
        'No Bill Items', 0, paymentsSummary
      ])
    }
  })

  // Prepend Byte Order Mark (BOM) to support UTF-8 in Excel
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
  link.setAttribute("download", `OPD_Appointments_Report_${new Date().toISOString().split('T')[0]}.csv`)
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
  appointmentDate: '',
  notes: '',
  consultationFee: 0,
  hasBill: false,
  patientName: ''
})

const doctorOptions = computed(() => {
  return opdStore.opdDoctors.map(doctor => ({
    value: doctor._id,
    label: `${doctor.fullName} - ${doctor.specializationId?.name || 'General'}`
  }))
})

const openEditModal = (app) => {
  editForm.value = {
    _id: app._id,
    doctorId: app.doctorId?._id || app.doctorId || '',
    appointmentDate: app.appointmentDate ? app.appointmentDate.split('T')[0] : '',
    notes: app.notes || '',
    consultationFee: app.consultationFee || 0,
    hasBill: !!app.billId,
    patientName: app.patientId?.fullName || ''
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!editForm.value.doctorId || !editForm.value.appointmentDate || !editForm.value.patientName) {
    snackbarStore.show({ message: 'Patient Name, Doctor, and Date are required', type: 'error' })
    return
  }
  isUpdating.value = true
  const res = await opdStore.updateAppointment(editForm.value._id, {
    doctorId: editForm.value.doctorId,
    appointmentDate: editForm.value.appointmentDate,
    consultationFee: editForm.value.consultationFee,
    notes: editForm.value.notes,
    patientName: editForm.value.patientName
  })
  isUpdating.value = false
  if (res.success) {
    snackbarStore.show({ message: 'Appointment updated successfully!', type: 'success' })
    showEditModal.value = false
    fetchAppointments()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to update appointment', type: 'error' })
  }
}

// Watch doctor to auto-fill fee
watch(() => editForm.value.doctorId, (newDocId) => {
  if (editForm.value.hasBill) return // Do not change fee if bill already generated
  const doctor = opdStore.opdDoctors.find(d => d._id === newDocId)
  if (doctor) {
    editForm.value.consultationFee = doctor.opdFee || 0
  }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-900 tracking-tight">OPD Appointments</h1>
            <span class="px-2.5 py-0.5 text-xs font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {{ opdStore.pagination.total }} Total
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Manage outpatient consultations, patient files, and schedule registers.</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <!-- <button 
          @click="syncAppointmentDates"
          :disabled="isSyncing"
          class="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer disabled:opacity-50"
        >
          <svg class="w-4 h-4 text-slate-500" :class="{ 'animate-spin': isSyncing }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isSyncing ? 'Syncing...' : 'Sync Dates' }}
        </button> -->

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
          @click="router.push({ name: 'opd-create' })"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Book Appointment
        </button>
      </div>
    </div>

    <!-- Table Card Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Filters Toolbar -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Status Filter -->
          <div class="relative">
            <select 
              v-model="filters.status" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[140px] cursor-pointer shadow-2xs transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <!-- Doctor Filter -->
          <div class="relative">
            <select 
              v-model="filters.doctorId" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[180px] cursor-pointer shadow-2xs transition-all"
            >
              <option value="">All Doctors</option>
              <option v-for="doc in opdStore.opdDoctors" :key="doc._id" :value="doc._id">
                {{ doc.fullName }}
              </option>
            </select>
          </div>

          <!-- Date Filter -->
          <div>
            <input 
              type="date" 
              v-model="filters.date" 
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 cursor-pointer shadow-2xs transition-all"
            />
          </div>

          <!-- Clear Filters -->
          <button 
            v-if="filters.status || filters.doctorId || filters.date"
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
          Showing <span class="text-slate-800 font-extrabold">{{ opdStore.appointments.length }}</span> of <span class="text-slate-800 font-extrabold">{{ opdStore.pagination.total }}</span> appointments
        </div>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead class="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
            <tr>
              <th class="px-6 py-3.5">Appointment ID</th>
              <th class="px-6 py-3.5">Patient Details</th>
              <th class="px-6 py-3.5">Consulting Doctor</th>
              <th class="px-6 py-3.5">Date</th>
              <th class="px-6 py-3.5">Status</th>
              <th class="px-6 py-3.5 text-right">Fee</th>
              <th class="px-6 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                  <div class="h-3 bg-slate-200 rounded w-20"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                  <div class="h-3 bg-slate-200 rounded w-24"></div>
                </td>
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                <td class="px-6 py-4"><div class="h-6 bg-slate-200 rounded w-20"></div></td>
                <td class="px-6 py-4 text-right"><div class="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                <td class="px-6 py-4 text-center"><div class="h-8 mx-auto bg-slate-200 rounded w-24"></div></td>
              </tr>
            </template>

            <tr v-else-if="opdStore.appointments.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <div class="w-12 h-12 mx-auto bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p class="font-bold text-slate-600 text-sm">No appointments found.</p>
                <p class="text-xs text-slate-400 mt-1">Try adjusting your filters or book a new appointment.</p>
              </td>
            </tr>

            <tr 
              v-else
              v-for="app in opdStore.appointments" 
              :key="app._id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-6 py-4">
                <router-link :to="`/opd/view/${app._id}`" class="font-mono text-indigo-600 font-bold hover:underline bg-indigo-50/70 border border-indigo-100/80 px-2 py-0.5 rounded-md text-xs inline-block">
                  {{ app.appointmentId }}
                </router-link>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {{ app.patientId?.fullName?.charAt(0) || 'P' }}
                  </div>
                  <div>
                    <router-link :to="`/opd/view/${app._id}`" class="font-bold text-slate-800 hover:text-indigo-600 hover:underline block leading-tight text-xs">
                      {{ app.patientId?.fullName || 'N/A' }}
                    </router-link>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                      {{ app.patientId?.patientCode || '-' }} • {{ app.patientId?.mobileNo }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800 text-xs">{{ app.doctorId?.fullName || 'N/A' }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">{{ app.doctorId?.specializationId?.name || 'General' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-slate-700 text-xs">{{ formatDate(app.appointmentDate) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
                  :class="getStatusColor(app.status)"
                >
                  {{ app.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="font-mono font-bold text-slate-800 text-xs">₹{{ (app.consultationFee || 0).toLocaleString() }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- View Dashboard Button -->
                  <router-link
                    v-if="app.status === 'Booked'"
                    :to="`/opd/view/${app._id}`"
                    class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-100"
                    title="View Patient Dashboard"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </router-link>

                  <!-- Print OPD Card Button -->
                  <button 
                    v-if="app.status === 'Booked' && authStore.hasPermission('opd.print')"
                    @click.stop="openPrintModal(app)"
                    class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                    title="Print OPD Card"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  
                  <!-- Edit Appointment Button -->
                  <button 
                    v-if="authStore.hasPermission('opd.update')"
                    @click.stop="openEditModal(app)"
                    class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-amber-100"
                    title="Edit Appointment"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  
                  <!-- Delete Appointment Button -->
                  <button 
                    v-if="['SuperAdmin', 'Super Admin'].includes(authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role)"
                    @click.stop="handleDelete(app._id)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-100"
                    title="Delete Appointment"
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
      <div v-if="opdStore.pagination.pages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <button 
          @click="filters.page--" 
          :disabled="filters.page === 1"
          class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Previous
        </button>
        <span class="text-xs font-bold text-slate-600">
          Page {{ filters.page }} of {{ opdStore.pagination.pages }}
        </span>
        <button 
          @click="filters.page++" 
          :disabled="filters.page === opdStore.pagination.pages"
          class="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
        >
          Next
        </button>
      </div>

    </div>
    
    <!-- Print Modal Overlay -->
    <div v-if="showCardModal && selectedAppointmentForPrint" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div>
            <h2 class="text-base font-bold text-slate-800">OPD Card Preview</h2>
            <p class="text-xs text-slate-500">Preview and print the OPD Card for this appointment.</p>
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
              class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
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
              <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></span>
              <span class="text-white font-medium shadow-sm text-xs">Generating PDF Preview...</span>
            </div>
          </div>

          <!-- Hidden DOM for html2canvas -->
          <div v-show="!pdfPreviewUrl" class="absolute inset-0 overflow-y-auto bg-slate-200 p-8 flex justify-center z-0" style="opacity: 0; pointer-events: none;">
             <div class="print-card-wrapper bg-white">
               <OpdCard :appointment="selectedAppointmentForPrint" />
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
            <h2 class="text-base font-bold text-slate-800">Generate OPD Report</h2>
            <p class="text-xs text-slate-500 mt-0.5">Filter by date range and doctor to export data.</p>
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
                class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">End Date</label>
              <input 
                type="date" 
                v-model="reportFilters.endDate"
                class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Doctor (Optional)</label>
            <select 
              v-model="reportFilters.doctorId" 
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all cursor-pointer"
            >
              <option value="">All Doctors</option>
              <option v-for="doc in opdStore.opdDoctors" :key="doc._id" :value="doc._id">
                {{ doc.fullName }}
              </option>
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
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            <h2 class="text-base font-bold text-slate-800">Edit Appointment</h2>
            <p class="text-xs text-slate-500 mt-0.5">Update details of the OPD appointment.</p>
          </div>
          <button 
            @click="showEditModal = false"
            class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 space-y-4">
          <!-- Info Alert if Billed -->
          <div v-if="editForm.hasBill" class="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex gap-2.5 text-xs text-amber-800">
            <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <p class="font-bold">Bill Generated</p>
              <p class="mt-0.5">A bill is already generated for this appointment. Modifying the doctor or fee is disabled.</p>
            </div>
          </div>
          <!-- Patient Name Selection -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Name</label>
            <input 
              type="text" 
              v-model="editForm.patientName"
              placeholder="Enter correct patient name"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
            />
          </div>

          <!-- Doctor Selection -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Doctor <span class="text-rose-500">*</span></label>
            <SearchableSelect 
              v-model="editForm.doctorId"
              :options="doctorOptions"
              placeholder="Search or select doctor..."
              :disabled="editForm.hasBill"
              required
            />
          </div>

          <!-- Date Selector -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Appointment Date</label>
            <input 
              type="date" 
              v-model="editForm.appointmentDate"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
            />
          </div>

          <!-- Consultation Fee -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultation Fee (₹)</label>
            <input 
              type="number" 
              v-model.number="editForm.consultationFee"
              :disabled="editForm.hasBill"
              class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 font-mono disabled:bg-slate-100 disabled:text-slate-500 transition-all"
            />
          </div>

          <!-- Notes -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes / Remarks</label>
            <textarea 
              v-model="editForm.notes"
              rows="3"
              placeholder="e.g. Follow-up patient, check reports..."
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
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
            class="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-amber-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isUpdating" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Save Changes
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
