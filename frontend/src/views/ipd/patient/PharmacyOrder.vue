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
  const res = await pharmacyStore.returnIpdMedicineItem(
    returnForm.value.itemId,
    returnForm.value.quantity,
    returnForm.value.remarks
  )

  if (res.success) {
    snackbarStore.show({ message: res.message || 'Medicine returned successfully', type: 'success' })
    showReturnModal.value = false
    await fetchOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  returnSubmitting.value = false
}

// Form State
const form = ref({
  doctorId: '',
  priority: 'NORMAL',
  remarks: '',
  items: [
    { medicineId: '', quantity: 1, remarks: '' }
  ]
})

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
    items: [
      { medicineId: '', quantity: 1, remarks: '' }
    ]
  }
  showCreateModal.value = true
}

const addItem = () => {
  form.value.items.push({ medicineId: '', quantity: 1, remarks: '' })
}

const removeItem = (idx) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1)
  }
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
            <span class="font-bold text-slate-700 text-xs">Dr. {{ order.doctorId?.fullName || 'N/A' }}</span>
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
                  <button 
                    v-if="item.issuedQuantity > (item.returnedQuantity || 0)"
                    @click="openReturnModal(item)"
                    class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 active:bg-rose-200 border border-rose-100 rounded text-[10px] font-bold transition-all cursor-pointer font-sans"
                  >
                    Return
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
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Dr. {{ doc.fullName }} ({{ doc.specializationId?.name || 'General' }})
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
                <option value="CRITICAL">CRITICAL</option>
                <option value="STAT">STAT (Immediate)</option>
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

          <!-- Add Medicines Section -->
          <div class="space-y-3 pt-2">
            <div class="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Medicines Checklist</h4>
              <button 
                type="button"
                @click="addItem"
                class="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Medicine
              </button>
            </div>

            <!-- List of dynamic medicine inputs -->
            <div class="space-y-3">
              <div 
                v-for="(item, idx) in form.items" 
                :key="idx"
                class="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50 items-start sm:items-center relative"
              >
                <!-- Medicine Dropdown selection -->
                <div class="flex-1 w-full space-y-1">
                  <select 
                    v-model="item.medicineId"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white text-xs"
                  >
                    <option value="">Select Medicine...</option>
                    <option 
                      v-for="med in pharmacyStore.medicines" 
                      :key="med._id" 
                      :value="med._id"
                    >
                      {{ med.medicineName }} (Code: {{ med.medicineCode }} / {{ med.dosageForm || 'TAB' }} - {{ med.strength || '' }})
                    </option>
                  </select>
                </div>

                <!-- Quantity -->
                <div class="w-full sm:w-28 space-y-1">
                  <input 
                    type="number" 
                    v-model.number="item.quantity" 
                    min="1"
                    placeholder="Qty"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 text-xs text-center"
                  />
                </div>

                <!-- Dosage / Directions Remarks -->
                <div class="flex-1 w-full space-y-1">
                  <input 
                    type="text" 
                    v-model="item.remarks" 
                    placeholder="Directions (e.g. 1-0-1 TDS, after meals)"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 text-xs"
                  />
                </div>

                <!-- Remove item button -->
                <button 
                  type="button"
                  @click="removeItem(idx)"
                  :disabled="form.items.length === 1"
                  class="p-1.5 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
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
            <h3 class="font-bold text-slate-800 text-base">Return Medicine</h3>
            <p class="text-xs text-slate-400 mt-0.5">Return unused medication to the pharmacy.</p>
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
            <p class="text-[10px] text-slate-400">Specify how many units of this medicine you want to return.</p>
          </div>

          <!-- Return Remarks -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Remarks / Reason</label>
            <textarea 
              v-model="returnForm.remarks"
              rows="3"
              placeholder="Provide a reason for the return (e.g., patient discharged, dosage changed, unused...)"
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
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
