<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useDoctorStore } from '../../../stores/doctorStore'
import { useEmployeeStore } from '../../../stores/employeeStore'
import { useAuthStore } from '../../../stores/authStore'

const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()
const doctorStore = useDoctorStore()
const employeeStore = useEmployeeStore()
const authStore = useAuthStore()

const loading = ref(false)
const indents = ref([])

const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  status: ''
})

const pagination = ref({ total: 0, page: 1, limit: 10, pages: 1 })

// Modal States
const showDetailsModal = ref(false)
const selectedIndent = ref(null)
const updatingStatus = ref(false)

const showCreateModal = ref(false)
const creatingIndent = ref(false)
const isEditing = ref(false)
const editingIndentId = ref(null)

const newIndentForm = ref({
  sourceType: 'OTHERS',
  priority: 'NORMAL',
  requestedBy: '',
  remarks: '',
  items: []
})

// Search & Batch Selection States
const medSearchQuery = ref('')
const matchingMedicines = ref([])
const selectedMedicine = ref(null)
const availableBatches = ref([])
const selectedBatch = ref(null)
const selectedQty = ref(1)

// Requester Search States
const requesterSearchQuery = ref('')
const matchingRequesters = ref([])
const selectedRequester = ref(null)

const fetchIndents = async (silent = false) => {
  if (!silent) loading.value = true
  const res = await pharmacyStore.fetchIndents(
    filters.value.page,
    filters.value.limit,
    filters.value.search,
    filters.value.status
  )
  if (res.success) {
    indents.value = res.data
    pagination.value = res.pagination || { total: res.data.length, page: 1, limit: 10, pages: 1 }
  } else if (!silent) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  if (!silent) loading.value = false
}

let medDebounce = null
const handleMedicineSearch = () => {
  if (medDebounce) clearTimeout(medDebounce)
  if (!medSearchQuery.value || medSearchQuery.value.length < 2) {
    matchingMedicines.value = []
    return
  }
  medDebounce = setTimeout(async () => {
    // Fetch active medicines matching query
    const res = await pharmacyStore.fetchMedicines(1, 15, medSearchQuery.value, '', '', true)
    matchingMedicines.value = res || []
  }, 300)
}

let requesterDebounce = null
const handleRequesterSearch = () => {
  if (requesterDebounce) clearTimeout(requesterDebounce)
  if (!requesterSearchQuery.value || requesterSearchQuery.value.length < 2) {
    matchingRequesters.value = []
    return
  }
  requesterDebounce = setTimeout(async () => {
    await doctorStore.fetchDoctors(1, 10, requesterSearchQuery.value)
    await employeeStore.fetchEmployees(1, 10, requesterSearchQuery.value)
    
    const docs = (doctorStore.doctors || []).map(d => ({ ...d, type: 'Doctor' }))
    const emps = (employeeStore.employees || []).map(e => ({ ...e, type: 'Employee' }))
    
    matchingRequesters.value = [...docs, ...emps].slice(0, 15)
  }, 300)
}

const selectRequester = (req) => {
  selectedRequester.value = req
  newIndentForm.value.requestedBy = req._id
  requesterSearchQuery.value = ''
  matchingRequesters.value = []
}

const clearRequester = () => {
  selectedRequester.value = null
  newIndentForm.value.requestedBy = ''
}

const selectMedicine = async (med) => {
  selectedMedicine.value = med
  medSearchQuery.value = ''
  matchingMedicines.value = []
  
  // Load batches of this medicine
  try {
    const batches = await pharmacyStore.fetchBatches(med._id)
    // Filter active batches with stock > 0
    availableBatches.value = batches.filter(b => b.isActive && b.currentStock > 0)
    
    if (availableBatches.value.length > 0) {
      selectedBatch.value = availableBatches.value[0]
      selectedQty.value = 1
    } else {
      selectedBatch.value = null
      selectedQty.value = 0
      snackbarStore.show({ message: 'No active stock batches available for this medicine', type: 'warning' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load stock batches', type: 'error' })
  }
}

watch(selectedBatch, (newBatch) => {
  if (newBatch) {
    selectedQty.value = 1
  }
})

const addDraftItem = () => {
  if (!selectedMedicine.value) return
  if (!selectedBatch.value) {
    snackbarStore.show({ message: 'Please select a batch with stock', type: 'error' })
    return
  }
  if (selectedQty.value <= 0) {
    snackbarStore.show({ message: 'Quantity must be at least 1', type: 'error' })
    return
  }
  if (selectedQty.value > selectedBatch.value.currentStock) {
    snackbarStore.show({ message: `Insufficient batch stock. Max available: ${selectedBatch.value.currentStock}`, type: 'error' })
    return
  }

  // Check if item already added in draft
  const exists = newIndentForm.value.items.find(item => item.batchId === selectedBatch.value._id)
  if (exists) {
    if (exists.quantity + selectedQty.value > selectedBatch.value.currentStock) {
      snackbarStore.show({ message: `Total draft quantity exceeds batch stock limit (${selectedBatch.value.currentStock})`, type: 'error' })
      return
    }
    exists.quantity += selectedQty.value
  } else {
    newIndentForm.value.items.push({
      medicineId: selectedMedicine.value._id,
      medicineName: selectedMedicine.value.medicineName,
      batchId: selectedBatch.value._id,
      batchNo: selectedBatch.value.batchNo,
      quantity: selectedQty.value,
      remarks: ''
    })
  }

  // Clear selections
  selectedMedicine.value = null
  availableBatches.value = []
  selectedBatch.value = null
  selectedQty.value = 1
}

const removeDraftItem = (index) => {
  newIndentForm.value.items.splice(index, 1)
}

onMounted(() => {
  fetchIndents()
})

watch(() => [filters.value.status, filters.value.search], () => {
  filters.value.page = 1
  fetchIndents()
})

watch(() => filters.value.page, () => {
  fetchIndents()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'STAT': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'URGENT': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'COMPLETED':
    case 'ISSUED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'PARTIALLY_ISSUED': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'CANCELLED': 
    case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-amber-50 text-amber-700 border-amber-100'
  }
}

const viewDetails = async (indent) => {
  selectedIndent.value = indent
  showDetailsModal.value = true
  
  // Fetch full details if needed, but we populated most things
  const res = await pharmacyStore.getIndentById(indent._id)
  if (res.success) {
    selectedIndent.value = res.data
  }
}

const updateStatus = async (status) => {
  updatingStatus.value = true
  const res = await pharmacyStore.updateIndentStatus(selectedIndent.value._id, { status })
  if (res.success) {
    snackbarStore.show({ message: `Indent marked as ${status}`, type: 'success' })
    fetchIndents(true)
    showDetailsModal.value = false
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  updatingStatus.value = false
}

const openCreateModal = () => {
  isEditing.value = false
  editingIndentId.value = null
  newIndentForm.value = {
    sourceType: 'OTHERS',
    priority: 'NORMAL',
    requestedBy: '',
    remarks: '',
    items: []
  }
  medSearchQuery.value = ''
  matchingMedicines.value = []
  selectedMedicine.value = null
  availableBatches.value = []
  selectedBatch.value = null
  selectedQty.value = 1
  
  requesterSearchQuery.value = ''
  matchingRequesters.value = []
  selectedRequester.value = null
  
  showCreateModal.value = true
}

const openEditModal = async (indent) => {
  if (['COMPLETED', 'ISSUED'].includes(indent.status)) {
    snackbarStore.show({ message: 'Completed or issued indents cannot be edited.', type: 'warning' })
    return
  }

  const res = await pharmacyStore.getIndentById(indent._id)
  if (!res.success) {
    snackbarStore.show({ message: res.message || 'Failed to fetch indent details', type: 'error' })
    return
  }

  const data = res.data
  isEditing.value = true
  editingIndentId.value = indent._id

  newIndentForm.value = {
    sourceType: data.sourceType || 'OTHERS',
    priority: data.priority || 'NORMAL',
    requestedBy: data.requestedBy?._id || data.requestedBy || '',
    remarks: data.remarks || '',
    items: (data.items || []).map(item => ({
      medicineId: item.medicineId?._id || item.medicineId,
      medicineName: item.medicineId?.medicineName || item.medicineName || 'Medicine',
      batchId: item.batchId?._id || item.batchId || null,
      batchNo: item.batchId?.batchNo || item.batchNo || 'N/A',
      quantity: item.quantity || 1,
      remarks: item.remarks || ''
    }))
  }

  if (data.requestedBy) {
    selectedRequester.value = data.requestedBy
    requesterSearchQuery.value = data.requestedBy.fullName || ''
  } else {
    selectedRequester.value = null
    requesterSearchQuery.value = ''
  }

  medSearchQuery.value = ''
  matchingMedicines.value = []
  selectedMedicine.value = null
  availableBatches.value = []
  selectedBatch.value = null
  selectedQty.value = 1

  showCreateModal.value = true
}

const handleDeleteIndent = async (indent) => {
  if (['COMPLETED', 'ISSUED'].includes(indent.status)) {
    snackbarStore.show({ message: 'Completed or issued indents cannot be deleted.', type: 'warning' })
    return
  }

  if (!confirm(`Are you sure you want to delete indent "${indent.indentNo}"?`)) {
    return
  }

  const res = await pharmacyStore.deleteIndent(indent._id)
  if (res.success) {
    snackbarStore.show({ message: 'Indent deleted successfully', type: 'success' })
    fetchIndents()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const submitNewIndent = async () => {
  if (newIndentForm.value.items.length === 0) {
    snackbarStore.show({ message: 'Add at least one medicine', type: 'warning' })
    return
  }

  creatingIndent.value = true
  let res
  if (isEditing.value && editingIndentId.value) {
    res = await pharmacyStore.updateIndent(editingIndentId.value, newIndentForm.value)
  } else {
    res = await pharmacyStore.createIndent(newIndentForm.value)
  }

  if (res.success) {
    snackbarStore.show({ message: isEditing.value ? 'Indent updated successfully' : 'Indent created successfully', type: 'success' })
    showCreateModal.value = false
    fetchIndents()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  creatingIndent.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex gap-2 bg-slate-100/50 p-1 rounded-xl">
        <button 
          v-for="status in ['', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED']" 
          :key="status"
          @click="filters.status = status"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            filters.status === status 
              ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          ]"
        >
          {{ status === '' ? 'All' : status }}
        </button>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <svg class="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            v-model="filters.search"
            type="text" 
            placeholder="Search indent no..." 
            class="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full shadow-sm transition-all"
          >
        </div>
        <button 
          @click="openCreateModal"
          class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          New Indent
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div v-for="i in 3" :key="i" class="h-16 bg-slate-200 rounded-xl"></div>
    </div>
    
    <div v-else-if="indents.length === 0" class="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-900">No Indents Found</h3>
      <p class="text-slate-500 mt-1">There are no pharmacy indents matching your criteria.</p>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Indent No</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested By</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="indent in indents" 
              :key="indent._id"
              class="transition-colors group"
              :class="(indent.status === 'APPROVED' || authStore.hasPermission('pharmacy.indent.approve')) ? 'hover:bg-slate-50/50 cursor-pointer' : 'cursor-default'"
              @click="(indent.status === 'APPROVED' || authStore.hasPermission('pharmacy.indent.approve')) && viewDetails(indent)"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ formatDate(indent.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-bold text-slate-900">{{ indent.indentNo }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-slate-700">{{ indent.sourceType }}</span>
                <div v-if="indent.wardId" class="text-xs text-slate-500">{{ indent.wardId.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ indent.requestedBy?.fullName || 'Unknown' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border', getPriorityColor(indent.priority)]">
                  {{ indent.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border flex items-center gap-1.5 w-fit', getStatusColor(indent.status)]">
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ indent.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-1">
                <button 
                  v-if="indent.status === 'APPROVED' || authStore.hasPermission('pharmacy.indent.approve')"
                  @click.stop="viewDetails(indent)"
                  class="p-2 rounded-xl text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>

                <button 
                  @click.stop="openEditModal(indent)"
                  :disabled="['COMPLETED', 'ISSUED'].includes(indent.status)"
                  class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Edit Indent"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button 
                  @click.stop="handleDeleteIndent(indent)"
                  :disabled="['COMPLETED', 'ISSUED'].includes(indent.status)"
                  class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Delete Indent"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span class="text-sm text-slate-500">
          Showing <span class="font-bold text-slate-700">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span> to <span class="font-bold text-slate-700">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span> of <span class="font-bold text-slate-700">{{ pagination.total }}</span> results
        </span>
        <div class="flex items-center gap-2">
          <button 
            @click="filters.page--"
            :disabled="pagination.page === 1"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            @click="filters.page++"
            :disabled="pagination.page === pagination.pages"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <div 
      v-if="showDetailsModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">Indent Details</h3>
          <button @click="showDetailsModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-6">
        <!-- Header Info -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Indent No</p>
            <p class="text-sm font-bold text-slate-900">{{ selectedIndent.indentNo }}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p class="text-sm font-semibold text-slate-700">{{ formatDate(selectedIndent.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Source</p>
            <p class="text-sm font-semibold text-slate-700">{{ selectedIndent.sourceType }}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <span :class="['px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border', getStatusColor(selectedIndent.status)]">
              {{ selectedIndent.status }}
            </span>
          </div>
        </div>
        
        <!-- Requested Items -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Requested Items</h3>
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-semibold text-slate-600">Medicine</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Batch</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Stock Available</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Req. Qty</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Remarks</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="item in selectedIndent.items || []" :key="item._id">
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ item.medicineId?.medicineName || 'Unknown Medicine' }}
                  </td>
                  <td class="px-4 py-3 text-slate-500">
                    {{ item.batchId?.batchNo || '-' }}
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['px-2 py-1 rounded-md text-xs font-bold', (item.medicineId?.currentStock || 0) >= item.quantity ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700']">
                      {{ item.medicineId?.currentStock || 0 }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-bold text-slate-700">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-slate-500 text-xs">{{ item.remarks || '-' }}</td>
                </tr>
                <tr v-if="!selectedIndent.items || selectedIndent.items.length === 0">
                  <td colspan="5" class="px-4 py-6 text-center text-slate-500 italic">No items found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedIndent.remarks" class="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
          <p class="text-xs font-bold text-amber-800/60 uppercase tracking-wider mb-1">Remarks</p>
          <p class="text-sm text-amber-900">{{ selectedIndent.remarks }}</p>
        </div>

        <!-- Action Buttons -->
        <div v-if="selectedIndent.status === 'PENDING' || selectedIndent.status === 'APPROVED'" class="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button 
            v-if="selectedIndent.status === 'PENDING'"
            @click="updateStatus('REJECTED')"
            :disabled="updatingStatus"
            class="px-5 py-2.5 rounded-xl font-bold text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Reject
          </button>
          
          <button 
            v-if="selectedIndent.status === 'PENDING'"
            @click="updateStatus('APPROVED')"
            :disabled="updatingStatus"
            class="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            Approve
          </button>
          
          <button 
            v-if="selectedIndent.status === 'APPROVED'"
            @click="updateStatus('COMPLETED')"
            :disabled="updatingStatus"
            class="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            Mark Completed / Issued
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- Create Indent Modal -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 text-lg">{{ isEditing ? 'Edit Pharmacy Indent' : 'Create New Indent' }}</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-6">
        
          <!-- Indent Details -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Source Type</label>
              <select v-model="newIndentForm.sourceType" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                <option value="WARD">Ward</option>
                <option value="IPD">IPD</option>
                <option value="OPD">OPD</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="OT">OT</option>
                <option value="ICU">ICU</option>
                <option value="STORE">Store</option>
                <option value="LABORATORY">Laboratory</option>
                <option value="OTHERS">Others</option>
              </select>
            </div>
            <div class="space-y-1.5 relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1">Requested By</label>
              
              <div v-if="!selectedRequester" class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                  v-model="requesterSearchQuery"
                  @input="handleRequesterSearch"
                  type="text" 
                  placeholder="Search Doctor or Employee (Optional)..."
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
                />

                <div v-if="matchingRequesters.length > 0" class="absolute z-30 w-full mt-1.5 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-50">
                  <div 
                    v-for="req in matchingRequesters" 
                    :key="req._id"
                    @click="selectRequester(req)"
                    class="px-4 py-2.5 hover:bg-teal-50/50 cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <p class="font-bold text-slate-800">{{ req.fullName }}</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">{{ req.type }}</p>
                    </div>
                    <button class="text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg font-bold">Select</button>
                  </div>
                </div>
              </div>

              <div v-else class="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold text-teal-900">{{ selectedRequester.fullName }}</p>
                  <p class="text-[10px] text-teal-600 font-semibold font-mono">{{ selectedRequester.type }}</p>
                </div>
                <button 
                  @click="clearRequester"
                  class="text-xs text-rose-600 font-bold hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
              <select v-model="newIndentForm.priority" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </select>
            </div>
          </div>

          <!-- Select & Request Medicines (Like Sales.vue) -->
          <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 class="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">Select & Request Medicines</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Search Medicine -->
              <div class="space-y-1.5 relative">
                <label class="block text-xs font-bold text-slate-700">Search Medicine *</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input 
                    v-model="medSearchQuery"
                    @input="handleMedicineSearch"
                    type="text" 
                    placeholder="Type name, brand or formula..."
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
                  />
                </div>

                <!-- Dropdown Results -->
                <div v-if="matchingMedicines.length > 0" class="absolute z-30 w-full mt-1.5 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-50">
                  <div 
                    v-for="med in matchingMedicines" 
                    :key="med._id"
                    @click="selectMedicine(med)"
                    class="px-4 py-2.5 hover:bg-teal-50/50 cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <p class="font-bold text-slate-800">{{ med.medicineName }}</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">Stock: {{ med.currentStock }}</p>
                    </div>
                    <button class="text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg font-bold">Select</button>
                  </div>
                </div>
              </div>

              <!-- Select Batch -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700">Stock Batch *</label>
                <select 
                  v-model="selectedBatch"
                  :disabled="!selectedMedicine"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
                >
                  <option :value="null" disabled>Select Stock Batch</option>
                  <option v-for="batch in availableBatches" :key="batch._id" :value="batch">
                    {{ batch.batchNo }} | Qty: {{ batch.currentStock }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="selectedMedicine" class="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div class="sm:col-span-2 space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400">Selected Medicine</span>
                <p class="text-xs font-bold text-slate-800">{{ selectedMedicine.medicineName }}</p>
                <p class="text-[10px] text-slate-500">{{ selectedMedicine.dosageForm }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700">Request Qty *</label>
                <input v-model.number="selectedQty" type="number" min="1" :max="selectedBatch?.currentStock || 1" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
              </div>

              <button 
                @click="addDraftItem"
                type="button"
                class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-teal-50 flex items-center justify-center gap-1"
              >
                Add Item
              </button>
            </div>
          </div>

          <!-- Added Items Table -->
          <div v-if="newIndentForm.items.length > 0" class="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-semibold text-slate-600">Medicine</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Batch</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Qty</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Remarks</th>
                  <th class="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(item, index) in newIndentForm.items" :key="index">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ item.medicineName }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ item.batchNo }}</td>
                  <td class="px-4 py-3 font-bold text-slate-700">
                    <input v-model.number="item.quantity" type="number" min="1" class="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="item.remarks" type="text" placeholder="Remarks..." class="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button @click="removeDraftItem(index)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Overall Remarks</label>
            <textarea v-model="newIndentForm.remarks" rows="2" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none" placeholder="Any additional notes..."></textarea>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              @click="showCreateModal = false"
              class="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="submitNewIndent"
              :disabled="creatingIndent"
              class="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg v-if="creatingIndent" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ creatingIndent ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Indent' : 'Submit Indent') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
