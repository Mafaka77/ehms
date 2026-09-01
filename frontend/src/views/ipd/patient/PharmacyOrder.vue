<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useDoctorStore } from '../../../stores/doctorStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

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

const pharmacyStore = usePharmacyStore()
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const orders = ref([])
const showCreateModal = ref(false)
const submitting = ref(false)

// Return State & Handlers
const showReturnModal = ref(false)
const returnSubmitting = ref(false)
const returnForm = ref({
  itemId: '',
  medicineName: '',
  quantity: 1,
  max: 1,
  remarks: ''
})

const openReturnModal = (item) => {
  const maxReturnable = item.issuedQuantity - (item.returnedQuantity || 0)
  returnForm.value = {
    itemId: item._id,
    medicineName: item.medicineId?.medicineName || 'Unknown Medicine',
    quantity: maxReturnable,
    max: maxReturnable,
    remarks: ''
  }
  showReturnModal.value = true
}

const submitReturn = async () => {
  if (returnForm.value.quantity <= 0 || returnForm.value.quantity > returnForm.value.max) {
    snackbarStore.show({ 
      message: `Quantity must be between 1 and ${returnForm.value.max}.`, 
      type: 'warning' 
    })
    return
  }

  returnSubmitting.value = true
  const res = await pharmacyStore.requestReturnIpdMedicineItem(
    returnForm.value.itemId,
    returnForm.value.quantity,
    returnForm.value.remarks
  )

  if (res.success) {
    snackbarStore.show({ message: 'Return request submitted to pharmacy successfully. Awaiting pharmacist approval.', type: 'success' })
    showReturnModal.value = false
    await fetchOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  returnSubmitting.value = false
}

const cancelReturnRequest = async (item) => {
  if (!confirm('Are you sure you want to cancel this return request?')) return
  const res = await pharmacyStore.cancelReturnIpdMedicineItem(item._id)
  if (res.success) {
    snackbarStore.show({ message: 'Return request cancelled', type: 'success' })
    await fetchOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Form State
const form = ref({
  doctorId: '',
  priority: 'NORMAL',
  remarks: '',
  items: []
})

// Search Medicine States (Like Indent.vue)
const medSearchQuery = ref('')
const matchingMedicines = ref([])
const selectedMedicine = ref(null)
const selectedQty = ref(1)
const selectedDirections = ref('')

let medDebounce = null
const handleMedicineSearch = () => {
  if (medDebounce) clearTimeout(medDebounce)
  if (!medSearchQuery.value || medSearchQuery.value.length < 2) {
    matchingMedicines.value = []
    return
  }
  medDebounce = setTimeout(async () => {
    const res = await pharmacyStore.fetchMedicines(1, 15, medSearchQuery.value, '', '', 'true')
    matchingMedicines.value = res || []
  }, 300)
}

const selectMedicine = (med) => {
  selectedMedicine.value = med
  medSearchQuery.value = ''
  matchingMedicines.value = []
  selectedQty.value = 1
  selectedDirections.value = ''
}

const addDraftItem = () => {
  if (!selectedMedicine.value) return
  if (selectedQty.value <= 0) {
    snackbarStore.show({ message: 'Quantity must be at least 1.', type: 'warning' })
    return
  }

  const existing = form.value.items.find(item => item.medicineId === selectedMedicine.value._id)
  if (existing) {
    existing.quantity += selectedQty.value
    if (selectedDirections.value) existing.remarks = selectedDirections.value
  } else {
    form.value.items.push({
      medicineId: selectedMedicine.value._id,
      medicineName: selectedMedicine.value.medicineName,
      medicineCode: selectedMedicine.value.medicineCode,
      dosageForm: selectedMedicine.value.dosageForm,
      strength: selectedMedicine.value.strength,
      unit: selectedMedicine.value.unit,
      quantity: selectedQty.value,
      remarks: selectedDirections.value
    })
  }

  selectedMedicine.value = null
  selectedQty.value = 1
  selectedDirections.value = ''
}

// Fetch current IPD orders
const fetchOrders = async () => {
  loading.value = true
  const res = await pharmacyStore.fetchIpdOrdersByAdmission(props.admissionId)
  if (res.success) {
    orders.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Helpers
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'STAT': return 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold'
    case 'CRITICAL': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'URGENT': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'ISSUED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'PARTIALLY_ISSUED': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-amber-50 text-amber-700 border-amber-100' // PENDING
  }
}

// Modal Form methods
const openModal = () => {
  form.value = {
    doctorId: props.admission.consultantDoctorId?._id || props.admission.consultantDoctorId || '',
    priority: 'NORMAL',
    remarks: '',
    items: []
  }
  medSearchQuery.value = ''
  matchingMedicines.value = []
  selectedMedicine.value = null
  selectedQty.value = 1
  selectedDirections.value = ''
  showCreateModal.value = true
}

const removeItem = (idx) => {
  form.value.items.splice(idx, 1)
}

const submitOrder = async () => {
  // Validate items
  const validItems = form.value.items.filter(item => item.medicineId && item.quantity > 0)
  if (validItems.length === 0) {
    snackbarStore.show({ message: 'Please add at least one valid medicine with quantity.', type: 'warning' })
    return
  }

  submitting.value = true
  const res = await pharmacyStore.createIpdOrder({
    admissionId: props.admissionId,
    doctorId: form.value.doctorId || null,
    priority: form.value.priority,
    remarks: form.value.remarks,
    items: validItems
  })

  if (res.success) {
    snackbarStore.show({ message: res.message || 'IPD Medicine Order placed successfully', type: 'success' })
    showCreateModal.value = false
    await fetchOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submitting.value = false
}

onMounted(async () => {
  await fetchOrders()
  // Fetch active doctors and medicines for dropdown
  await doctorStore.fetchDoctors(1, 100)
  await pharmacyStore.fetchMedicines(1, 100, '', '', '', 'true')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header row -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="font-bold text-slate-800 text-base">Medication Prescription Requests</h3>
        <p class="text-xs text-slate-400">View and place pharmacy requests for patient medication.</p>
      </div>
      <button 
        @click="openModal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create Order
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="py-12 text-center text-slate-400">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading prescription requests...
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3 bg-slate-50/50">
      <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-700">No medication orders found</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No pharmacy orders have been initiated for this admission file yet.</p>
      </div>
      <button 
        @click="openModal" 
        class="px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Place Initial Order
      </button>
    </div>

    <!-- Orders Cards List -->
    <div v-else class="space-y-4">
      <div 
        v-for="order in orders" 
        :key="order._id"
        class="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 shadow-sm space-y-4"
      >
        <!-- Card top line -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100/70 pb-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 font-mono text-sm">{{ order.requestNo }}</span>
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold border"
                :class="getPriorityColor(order.priority)"
              >
                {{ order.priority }}
              </span>
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold border"
                :class="getStatusColor(order.status)"
              >
                {{ order.status }}
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium">
              Requested: {{ formatDate(order.createdAt) }} • By: <strong class="text-slate-600">{{ order.requestedBy?.fullName || 'Requester' }}</strong>
            </p>
          </div>
          <div class="text-xs text-slate-500 sm:text-right">
            <span class="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Consultant Doctor</span>
            <span class="font-bold text-slate-700 text-xs"> {{ order.doctorId?.fullName || 'N/A' }}</span>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="order.remarks" class="text-xs bg-white p-2.5 rounded-xl border border-slate-100 text-slate-600">
          <strong class="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Order Remarks:</strong>
          {{ order.remarks }}
        </div>

        <!-- Table of Medicines inside Order -->
        <div class="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th class="px-4 py-2.5">Medicine Name</th>
                <th class="px-4 py-2.5">Generic Name</th>
                <th class="px-4 py-2.5 text-center">Qty Prescribed</th>
                <th class="px-4 py-2.5 text-center">Qty Issued</th>
                <th class="px-4 py-2.5 text-center">Qty Returned</th>
                <th class="px-4 py-2.5">Directions / Remarks</th>
                <th class="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr v-for="(item, idx) in order.items" :key="idx" class="hover:bg-slate-50/20">
                <td class="px-4 py-2.5 font-bold text-slate-800">
                  {{ item.medicineId?.medicineName || 'Unknown Medicine' }}
                  <span class="text-[10px] text-slate-400 font-normal ml-1">{{ item.medicineId?.strength || '' }} {{ item.medicineId?.unit || '' }}</span>
                </td>
                <td class="px-4 py-2.5 text-slate-400 italic font-mono">{{ item.medicineId?.genericName || '-' }}</td>
                <td class="px-4 py-2.5 text-center font-bold text-slate-700">{{ item.quantity }}</td>
                <td class="px-4 py-2.5 text-center font-bold" :class="item.issuedQuantity > 0 ? 'text-emerald-600' : 'text-slate-400'">
                  {{ item.issuedQuantity }}
                </td>
                <td class="px-4 py-2.5 text-center font-bold" :class="item.returnedQuantity > 0 ? 'text-rose-600' : 'text-slate-400'">
                  {{ item.returnedQuantity || 0 }}
                </td>
                <td class="px-4 py-2.5 text-slate-500">{{ item.remarks || '-' }}</td>
                <td class="px-4 py-2.5 text-right">
                  <!-- Pending Return Request -->
                  <div v-if="item.returnStatus === 'REQUESTED'" class="flex items-center justify-end gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold inline-flex items-center gap-1" title="Awaiting pharmacy verification and approval">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Req: {{ item.returnRequestedQuantity }} (Pending)
                    </span>
                    <button 
                      @click="cancelReturnRequest(item)"
                      class="px-1.5 py-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-[10px] font-semibold transition-all cursor-pointer"
                      title="Cancel Return Request"
                    >
                      Cancel
                    </button>
                  </div>

                  <!-- Return Rejected -->
                  <div v-else-if="item.returnStatus === 'REJECTED'" class="flex items-center justify-end gap-1.5 flex-wrap">
                    <span class="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-bold" :title="'Reason: ' + (item.returnRejectionReason || 'Rejected')">
                      Rejected
                    </span>
                    <button 
                      v-if="item.issuedQuantity > (item.returnedQuantity || 0)"
                      @click="openReturnModal(item)"
                      class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 active:bg-rose-200 border border-rose-100 rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                    >
                      Re-Request
                    </button>
                  </div>

                  <!-- Available to Return -->
                  <button 
                    v-else-if="item.issuedQuantity > (item.returnedQuantity || 0)"
                    @click="openReturnModal(item)"
                    class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 active:bg-rose-200 border border-rose-100 rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                  >
                    Request Return
                  </button>
                  <span v-else class="text-[10px] text-slate-400 font-medium">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Pharmacy Order Modal -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">New Medication Request</h3>
            <p class="text-xs text-slate-400 mt-0.5">Submit new medicine requests to the pharmacy department.</p>
          </div>
          <button 
            @click="showCreateModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Modal Body Form -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <!-- Select & Request Medicines (Like Indent.vue) -->
          <div class="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">Select & Request Medicines</h4>
            
            <!-- Search Medicine Input -->
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
                  placeholder="Type name, code, brand or formula..."
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>

              <!-- Dropdown Results -->
              <div v-if="matchingMedicines.length > 0" class="absolute z-30 w-full mt-1.5 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-50">
                <div 
                  v-for="med in matchingMedicines" 
                  :key="med._id"
                  @click="selectMedicine(med)"
                  class="px-4 py-2.5 hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center text-xs"
                >
                  <div>
                    <p class="font-bold text-slate-800">{{ med.medicineName }}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">Code: {{ med.medicineCode }} • {{ med.dosageForm || 'TAB' }} - {{ med.strength || '' }}</p>
                  </div>
                  <button type="button" class="text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg font-bold">Select</button>
                </div>
              </div>
            </div>

            <!-- Selected Medicine Form Card -->
            <div v-if="selectedMedicine" class="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div class="sm:col-span-2 space-y-1">
                <span class="text-[10px] uppercase font-bold text-indigo-500">Selected Medicine</span>
                <p class="text-xs font-bold text-slate-800">{{ selectedMedicine.medicineName }}</p>
                <p class="text-[10px] text-slate-500">{{ selectedMedicine.dosageForm || 'TAB' }} {{ selectedMedicine.strength || '' }} (Code: {{ selectedMedicine.medicineCode }})</p>
              </div>

              <div class="space-y-1 sm:col-span-1">
                <label class="block text-xs font-bold text-slate-700">Qty *</label>
                <input 
                  v-model.number="selectedQty" 
                  type="number" 
                  min="1" 
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700">Directions / Remarks</label>
                <input 
                  v-model="selectedDirections" 
                  type="text" 
                  placeholder="e.g. 1-0-1 TDS after meals"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
              </div>

              <div class="sm:col-span-1">
                <button 
                  @click="addDraftItem"
                  type="button"
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  Add Item
                </button>
              </div>
            </div>

            <!-- Added Items Table -->
            <div class="border border-slate-200/80 rounded-xl overflow-hidden mt-3">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <tr>
                    <th class="px-4 py-2.5">Medicine Name</th>
                    <th class="px-4 py-2.5 text-center w-24">Qty</th>
                    <th class="px-4 py-2.5">Directions / Remarks</th>
                    <th class="px-4 py-2.5 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-600">
                  <tr v-for="(item, idx) in form.items" :key="idx" class="hover:bg-slate-50/50">
                    <td class="px-4 py-2.5 font-bold text-slate-800">
                      {{ item.medicineName || 'Medicine' }}
                      <span v-if="item.strength || item.dosageForm" class="text-[10px] text-slate-400 font-normal ml-1">
                        ({{ item.dosageForm || 'TAB' }} - {{ item.strength || '' }})
                      </span>
                    </td>
                    <td class="px-4 py-2.5">
                      <input 
                        v-model.number="item.quantity" 
                        type="number" 
                        min="1" 
                        class="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-center outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td class="px-4 py-2.5">
                      <input 
                        v-model="item.remarks" 
                        type="text" 
                        placeholder="Directions..." 
                        class="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td class="px-4 py-2.5 text-right">
                      <button 
                        @click="removeItem(idx)" 
                        type="button"
                        class="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="form.items.length === 0">
                    <td colspan="4" class="px-4 py-6 text-center text-slate-400 italic">
                      No medicines added yet. Search and select medicines above.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <!-- Doctor Input Selection -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Prescribed By (Doctor)</label>
              <select 
                v-model="form.doctorId"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              >
                <option value="">Select doctor...</option>
                <option 
                  v-for="doc in doctorStore.doctors" 
                  :key="doc._id" 
                  :value="doc._id"
                >
                   {{ doc.fullName }} ({{ doc.specializationId?.name || 'General' }})
                </option>
              </select>
            </div>

            <!-- Priority Level selection -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Request Priority</label>
              <select 
                v-model="form.priority"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <!-- Remarks Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Order Remarks (Optional)</label>
            <textarea 
              v-model="form.remarks"
              rows="2"
              placeholder="E.g. Take with warm water, check patient allergies, notes to pharmacist..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            ></textarea>
          </div>
        </div>

        <!-- Modal Action Footer Buttons -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            @click="showCreateModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitOrder"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submit Request
          </button>
        </div>
      </div>
    </div>

    <!-- Return Medicine Modal -->
    <div 
      v-if="showReturnModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Request Medicine Return</h3>
            <p class="text-xs text-slate-400 mt-0.5">Submit a return request to pharmacy for approval.</p>
          </div>
          <button 
            @click="showReturnModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Modal Body Form -->
        <div class="p-6 space-y-4">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
            <div class="flex justify-between text-slate-500">
              <span>Medicine:</span>
              <span class="font-bold text-slate-700">{{ returnForm.medicineName }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Max Returnable Qty:</span>
              <span class="font-bold text-slate-700">{{ returnForm.max }}</span>
            </div>
          </div>

          <!-- Quantity to Return -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity to Return</label>
            <input 
              type="number" 
              v-model.number="returnForm.quantity" 
              min="1"
              :max="returnForm.max"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
            <p class="text-[10px] text-slate-400">Specify how many units of this medicine you are requesting to return.</p>
          </div>

          <!-- Return Remarks -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Remarks / Reason</label>
            <textarea 
              v-model="returnForm.remarks"
              rows="3"
              placeholder="Provide reason for return (e.g. dose stopped, patient discharged, unopened vial...)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            ></textarea>
          </div>
        </div>

        <!-- Modal Action Footer Buttons -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            @click="showReturnModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitReturn"
            :disabled="returnSubmitting"
            class="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="returnSubmitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submit Return Request
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
