<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLabStore } from '../../../stores/labStore'
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

const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

// State
const loading = ref(false)
const orders = ref([])
const showOrderModal = ref(false)
const showResultModal = ref(false)
const orderSubmitting = ref(false)

// Detail Result Modal State
const selectedOrder = ref(null)
const selectedOrderResults = ref(null)
const loadingResults = ref(false)

// Create Order Form State
const orderForm = ref({
  priority: 'ROUTINE',
  clinicalNotes: '',
  remarks: '',
  tests: [] // array of test IDs
})
const testsList = ref([])
const testsSearch = ref('')
const loadingTests = ref(false)

// Fetch Lab Orders for this Admission
const fetchLabOrders = async () => {
  loading.value = true
  // We query all orders and filter by admissionId
  await labStore.fetchOrders(1, 50, '', '', { admissionId: props.admissionId })
  // Display only orders matching this admissionId
  orders.value = (labStore.orders || []).filter(order => 
    order.admissionId === props.admissionId || 
    order.admissionId?._id === props.admissionId
  )
  loading.value = false
}

// Fetch Available Tests for ordering
const fetchAvailableTests = async () => {
  loadingTests.value = true
  await labStore.fetchTests(1, 100, testsSearch.value)
  testsList.value = labStore.tests
  loadingTests.value = false
}

// Add/remove test from select list
const toggleTestSelect = (test) => {
  const idx = orderForm.value.tests.findIndex(t => t._id === test._id)
  if (idx === -1) {
    orderForm.value.tests.push(test)
  } else {
    orderForm.value.tests.splice(idx, 1)
  }
}

const isTestSelected = (testId) => {
  return orderForm.value.tests.some(t => t._id === testId)
}

const totalOrderAmount = computed(() => {
  return orderForm.value.tests.reduce((sum, t) => sum + (t.rate || 0), 0)
})

// Open Order Modal
const openOrderModal = async () => {
  orderForm.value = {
    priority: 'ROUTINE',
    clinicalNotes: '',
    remarks: '',
    tests: []
  }
  testsSearch.value = ''
  showOrderModal.value = true
  await fetchAvailableTests()
}

// Submit Lab Order
const submitLabOrder = async () => {
  if (orderForm.value.tests.length === 0) {
    snackbarStore.show({ message: 'Please select at least one laboratory test.', type: 'warning' })
    return
  }

  orderSubmitting.value = true
  
  const payload = {
    patientId: props.admission.patientId?._id || props.admission.patientId,
    admissionId: props.admissionId,
    doctorId: props.admission.consultantDoctorId?._id || props.admission.consultantDoctorId,
    referral: 'IPD',
    priority: orderForm.value.priority,
    clinicalNotes: orderForm.value.clinicalNotes,
    remarks: orderForm.value.remarks,
    tests: orderForm.value.tests.map(t => ({
      testId: t._id,
      testName: t.name,
      rate: t.rate,
      quantity: 1,
      amount: t.rate
    }))
  }

  const res = await labStore.createOrder(payload)
  if (res.success) {
    snackbarStore.show({ message: 'Lab order created successfully.', type: 'success' })
    showOrderModal.value = false
    await fetchLabOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  orderSubmitting.value = false
}

// Open Result details view
const viewOrderDetails = async (order) => {
  selectedOrder.value = order
  selectedOrderResults.value = null
  showResultModal.value = true
  loadingResults.value = true
  
  try {
    const res = await labStore.fetchOrderResults(order._id)
    selectedOrderResults.value = res
  } catch (error) {
    console.error('Error loading results:', error)
    snackbarStore.show({ message: 'Could not retrieve test results.', type: 'error' })
  } finally {
    loadingResults.value = false
  }
}

// Delete Lab Order
const deleteLabOrder = async (orderId) => {
  if (!confirm('Are you sure you want to cancel and delete this laboratory order? This will remove all associated charges, results, and order items.')) {
    return
  }

  const res = await labStore.deleteOrder(orderId)
  if (res.success) {
    snackbarStore.show({ message: 'Laboratory order cancelled and deleted successfully.', type: 'success' })
    await fetchLabOrders()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to delete laboratory order.', type: 'error' })
  }
}

// Status coloring
const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'SAMPLE_COLLECTED': return 'bg-blue-50 text-blue-700 border-blue-100'
    case 'COMPLETED': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'VERIFIED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

const getPaymentColor = (status) => {
  switch (status) {
    case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'PARTIALLY_PAID': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'UNPAID': return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'IPD': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

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

onMounted(async () => {
  await fetchLabOrders()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header Controls -->
    <div class="flex items-center justify-between pb-1">
      <div>
        <h3 class="font-bold text-slate-800 text-sm">Laboratory Investigations</h3>
        <p class="text-[11px] text-slate-400">Manage blood profiles, pathology orders, and diagnostic results.</p>
      </div>
      <button
        @click="openOrderModal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Order Lab Test
      </button>
    </div>

    <!-- Lab orders listing -->
    <div v-if="loading" class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading laboratory profiles...
    </div>

    <div v-else-if="orders.length === 0" class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400 bg-white">
      <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-1.05-11.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <p class="font-bold text-slate-600">No Laboratory Investigations Requested</p>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Click "Order Lab Test" to request CBC, liver panels, urine profiles, or other pathological tests.</p>
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th class="p-4">Order No</th>
            <th class="p-4">Ordered Date</th>
            <th class="p-4">Referral Doctor</th>
            <th class="p-4">Priority</th>
            <th class="p-4 text-right">Amount</th>
            <th class="p-4">Payment</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 text-xs text-slate-600">
          <tr v-for="order in orders" :key="order._id" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-4 font-mono font-bold text-indigo-600">{{ order.orderNo }}</td>
            <td class="p-4">{{ formatDate(order.createdAt) }}</td>
            <td class="p-4 font-semibold text-slate-800">Dr. {{ order.doctorId?.fullName || 'Self' }}</td>
            <td class="p-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                :class="order.priority === 'STAT' ? 'bg-rose-100 text-rose-700' : order.priority === 'URGENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ order.priority }}
              </span>
            </td>
            <td class="p-4 text-right font-bold text-slate-800">₹{{ order.totalAmount }}</td>
            <td class="p-4">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold border" :class="getPaymentColor(order.paymentStatus)">
                {{ order.paymentStatus }}
              </span>
            </td>
            <td class="p-4">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold border" :class="getStatusColor(order.status)">
                {{ order.status?.replace('_', ' ') }}
              </span>
            </td>
            <td class="p-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <button
                  @click="viewOrderDetails(order)"
                  class="px-2.5 py-1 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  View Details
                </button>
                <button
                  @click="deleteLabOrder(order._id)"
                  class="px-2.5 py-1 border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancel / Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Test Modal -->
    <div v-if="showOrderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Order Laboratory Tests</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Select tests to add to the inpatient's clinical profile.</p>
          </div>
          <button @click="showOrderModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Scrollable -->
        <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          
          <!-- Column 1: Test Selection -->
          <div class="space-y-3 flex flex-col h-[380px] min-h-0">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Tests (Click to Toggle)</label>
            <input
              type="text"
              v-model="testsSearch"
              @input="fetchAvailableTests"
              placeholder="Search tests by name or code..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
            
            <!-- List scroll container -->
            <div class="flex-1 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 min-h-0 bg-slate-50/50 p-1">
              <div v-if="loadingTests" class="p-8 text-center text-slate-400 text-xs">
                Searching tests...
              </div>
              <div v-else-if="testsList.length === 0" class="p-8 text-center text-slate-400 text-xs">
                No matching tests found.
              </div>
              <div
                v-else
                v-for="test in testsList"
                :key="test._id"
                @click="toggleTestSelect(test)"
                class="p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors"
                :class="isTestSelected(test._id) ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'hover:bg-white text-slate-600'"
              >
                <div>
                  <p class="font-semibold">{{ test.name }}</p>
                  <p class="text-[10px] font-mono text-slate-400 mt-0.5">{{ test.code }} • TAT: {{ test.turnaroundTimeHours || 24 }}h</p>
                </div>
                <span class="font-bold text-slate-800">₹{{ test.rate }}</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Order Metadata & Summary -->
          <div class="space-y-4 flex flex-col justify-between">
            <div class="space-y-4">
              <!-- Priority -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Priority Status</label>
                <select
                  v-model="orderForm.priority"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
                >
                  <option value="ROUTINE">Routine (Standard TAT)</option>
                  <option value="URGENT">Urgent (Express processing)</option>
                  <option value="STAT">STAT (Emergency - Critical)</option>
                </select>
              </div>

              <!-- Clinical Notes -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Clinical Notes / Vitals Context</label>
                <textarea
                  v-model="orderForm.clinicalNotes"
                  rows="2"
                  placeholder="E.g. Patient is fasting, monitored for diabetic assessment..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
                ></textarea>
              </div>

              <!-- Remarks -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Order Remarks</label>
                <textarea
                  v-model="orderForm.remarks"
                  rows="2"
                  placeholder="Any delivery instructions or administrative guidelines..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
                ></textarea>
              </div>
            </div>

            <!-- Running Selection Summary -->
            <div class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <h4 class="text-xs font-bold text-indigo-800">Order Summary</h4>
              <div class="max-h-[80px] overflow-y-auto text-[11px] text-indigo-700 space-y-1 pr-1 font-semibold">
                <div v-for="t in orderForm.tests" :key="t._id" class="flex justify-between">
                  <span class="truncate pr-4">• {{ t.name }}</span>
                  <span>₹{{ t.rate }}</span>
                </div>
                <div v-if="orderForm.tests.length === 0" class="text-slate-400 italic">No tests selected.</div>
              </div>
              <div class="flex justify-between items-center border-t border-indigo-100/60 pt-2 font-bold text-xs text-indigo-900">
                <span>Total Amount:</span>
                <span>₹{{ totalOrderAmount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showOrderModal = false" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
            Cancel
          </button>
          <button
            @click="submitLabOrder"
            :disabled="orderSubmitting || orderForm.tests.length === 0"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="orderSubmitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submit Order
          </button>
        </div>
      </div>
    </div>

    <!-- Detail & Results View Modal -->
    <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div v-if="selectedOrder">
            <h3 class="font-bold text-slate-800 text-sm">Lab Investigation Details</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Order: <span class="font-mono text-indigo-600 font-bold">{{ selectedOrder.orderNo }}</span> • Priority: {{ selectedOrder.priority }}</p>
          </div>
          <button @click="showResultModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Details -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div v-if="loadingResults" class="p-12 text-center text-slate-400">
            <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading investigation details & reports...
          </div>
          
          <div v-else-if="selectedOrderResults" class="space-y-6">
            <!-- Metadata Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 gap-4 text-xs">
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Referral Doctor</span>
                <p class="font-bold text-slate-800 mt-0.5">Dr. {{ selectedOrderResults.order?.doctorId?.fullName || 'Self' }}</p>
              </div>
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Order Status</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ selectedOrderResults.order?.status }}</p>
              </div>
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Ordered On</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ formatDate(selectedOrderResults.order?.createdAt) }}</p>
              </div>
              <div v-if="selectedOrderResults.order?.clinicalNotes" class="col-span-1 md:col-span-3 border-t border-slate-100 pt-2">
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Clinical Notes</span>
                <p class="text-slate-600 mt-0.5 font-medium">{{ selectedOrderResults.order.clinicalNotes }}</p>
              </div>
            </div>

            <!-- Diagnostic reports parameters -->
            <div class="space-y-4">
              <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wide text-indigo-700">Lab Test Profile Parameters</h4>
              
              <div v-for="test in selectedOrderResults.tests" :key="test.testId" class="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <!-- Test Title -->
                <div class="bg-slate-50/60 border-b border-slate-100 p-3 flex justify-between items-center">
                  <span class="font-bold text-xs text-slate-800">{{ test.testName }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border" :class="getStatusColor(test.status)">
                    {{ test.status }}
                  </span>
                </div>
                
                <!-- Parameter Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th class="p-3">Parameter</th>
                        <th class="p-3">Measured Value</th>
                        <th class="p-3">Unit</th>
                        <th class="p-3">Normal Range (Male/Female/Child)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-slate-700">
                      <tr v-for="p in test.parameters" :key="p.parameterId" class="hover:bg-slate-50/20">
                        <td class="p-3 font-semibold">{{ p.name }}</td>
                        <td class="p-3 font-bold" :class="p.isOutOfRange ? 'text-rose-600 bg-rose-50/30 px-2.5 py-1 rounded-lg border border-rose-100/40 w-fit' : 'text-slate-900'">
                          {{ p.measuredValue || 'Pending Result' }}
                          <span v-if="p.isOutOfRange" class="ml-1 text-[9px] font-bold uppercase tracking-wider text-rose-500">(Abnormal)</span>
                        </td>
                        <td class="p-3 font-mono text-slate-500 font-semibold">{{ p.unit || '-' }}</td>
                        <td class="p-3 text-slate-500">
                          <span class="font-semibold text-slate-400 text-[10px] uppercase mr-1">M:</span>{{ p.normalRangeMale || '-' }} | 
                          <span class="font-semibold text-slate-400 text-[10px] uppercase mx-1">F:</span>{{ p.normalRangeFemale || '-' }} | 
                          <span class="font-semibold text-slate-400 text-[10px] uppercase mx-1">C:</span>{{ p.normalRangeChild || '-' }}
                        </td>
                      </tr>
                      <tr v-if="test.parameters.length === 0">
                        <td colspan="4" class="p-6 text-center text-slate-400 italic">No parameters defined or results entered for this profile yet.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="showResultModal = false" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
