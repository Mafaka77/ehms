<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRadiologyStore } from '../../../stores/radiologyStore'
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

const radiologyStore = useRadiologyStore()
const snackbarStore = useSnackbarStore()

// State
const loading = ref(false)
const orders = ref([])
const showOrderModal = ref(false)
const showDetailModal = ref(false)
const orderSubmitting = ref(false)

// Detail Modal State
const selectedOrder = ref(null)
const selectedOrderItems = ref([])
const loadingDetails = ref(false)

// Create Order Form State
const orderForm = ref({
  priority: 'ROUTINE',
  clinicalHistory: '',
  remarks: '',
  categoryId: '',
  tests: [] // array of test objects
})
const categoriesList = ref([])
const testsList = ref([])
const loadingTests = ref(false)
const testsSearch = ref('')

// Fetch Radiology Orders
const fetchRadiologyOrders = async () => {
  loading.value = true
  await radiologyStore.fetchOrders(1, 50, '', '', { admissionId: props.admissionId })
  orders.value = (radiologyStore.orders || []).filter(order =>
    order.admissionId === props.admissionId ||
    order.admissionId?._id === props.admissionId
  )
  loading.value = false
}

// Fetch categories for order form
const fetchCategories = async () => {
  await radiologyStore.fetchCategories(1, 100)
  categoriesList.value = radiologyStore.categories
}

// Fetch tests when category changes
const onCategoryChange = async () => {
  orderForm.value.tests = [] // clear selected tests
  if (!orderForm.value.categoryId) {
    testsList.value = []
    return
  }
  loadingTests.value = true
  const res = await radiologyStore.fetchTests(orderForm.value.categoryId, 1, 100, testsSearch.value)
  testsList.value = res.data
  loadingTests.value = false
}

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
    clinicalHistory: '',
    remarks: '',
    categoryId: '',
    tests: []
  }
  testsList.value = []
  testsSearch.value = ''
  showOrderModal.value = true
  await fetchCategories()
}

// Submit Radiology Order
const submitRadiologyOrder = async () => {
  if (orderForm.value.tests.length === 0) {
    snackbarStore.show({ message: 'Please select at least one radiology test.', type: 'warning' })
    return
  }

  orderSubmitting.value = true
  
  const payload = {
    patientId: props.admission.patientId?._id || props.admission.patientId,
    admissionId: props.admissionId,
    doctorId: props.admission.consultantDoctorId?._id || props.admission.consultantDoctorId,
    referral: 'IPD',
    priority: orderForm.value.priority,
    clinicalHistory: orderForm.value.clinicalHistory,
    remarks: orderForm.value.remarks,
    tests: orderForm.value.tests.map(t => ({
      testId: t._id
    }))
  }

  const res = await radiologyStore.createOrder(payload)
  if (res.success) {
    snackbarStore.show({ message: 'Radiology order created successfully.', type: 'success' })
    showOrderModal.value = false
    await fetchRadiologyOrders()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  orderSubmitting.value = false
}

// View Order Details
const viewOrderDetails = async (order) => {
  selectedOrder.value = order
  selectedOrderItems.value = []
  showDetailModal.value = true
  loadingDetails.value = true
  
  try {
    const res = await radiologyStore.getOrderById(order._id)
    selectedOrderItems.value = res.items
  } catch (error) {
    console.error('Error fetching details:', error)
    snackbarStore.show({ message: 'Could not fetch order details.', type: 'error' })
  } finally {
    loadingDetails.value = false
  }
}

// Delete Radiology Order
const deleteRadiologyOrder = async (orderId) => {
  if (!confirm('Are you sure you want to cancel and delete this radiology order? This will remove all associated charges and order items.')) {
    return
  }

  const res = await radiologyStore.deleteOrder(orderId)
  if (res.success) {
    snackbarStore.show({ message: 'Radiology order cancelled and deleted successfully.', type: 'success' })
    await fetchRadiologyOrders()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to delete radiology order.', type: 'error' })
  }
}

// Status style helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100'
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
  await fetchRadiologyOrders()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header Controls -->
    <div class="flex items-center justify-between pb-1">
      <div>
        <h3 class="font-bold text-slate-800 text-sm">Radiology Investigations</h3>
        <p class="text-[11px] text-slate-400">Manage X-rays, MRI, CT scans, and ultrasound diagnostic reports.</p>
      </div>
      <button
        @click="openOrderModal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Order Radiology Test
      </button>
    </div>

    <!-- Radiology Orders Table -->
    <div v-if="loading" class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading radiology investigations...
    </div>

    <div v-else-if="orders.length === 0" class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400 bg-white">
      <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <p class="font-bold text-slate-600">No Radiology Investigations Requested</p>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Click "Order Radiology Test" to request imaging diagnostics like Chest X-ray, Ultrasound abdomen, or CT Brain scans.</p>
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
                {{ order.status }}
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
                  @click="deleteRadiologyOrder(order._id)"
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

    <!-- Order Radiology Test Modal -->
    <div v-if="showOrderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Order Radiology Investigations</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Select scan/imaging categories and tests to order.</p>
          </div>
          <button @click="showOrderModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          
          <!-- Column 1: Selector -->
          <div class="space-y-3 flex flex-col h-[380px] min-h-0">
            <!-- Select Category -->
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Radiology Category</label>
              <select
                v-model="orderForm.categoryId"
                @change="onCategoryChange"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
              >
                <option value="">Select category...</option>
                <option v-for="cat in categoriesList" :key="cat._id" :value="cat._id">
                  {{ cat.name }} ({{ cat.code }})
                </option>
              </select>
            </div>

            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-2">Available Tests (Select multiple)</label>
            
            <!-- List tests scroll container -->
            <div class="flex-1 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 min-h-0 bg-slate-50/50 p-1">
              <div v-if="!orderForm.categoryId" class="p-8 text-center text-slate-400 text-xs italic">
                Please select a radiology category first.
              </div>
              <div v-else-if="loadingTests" class="p-8 text-center text-slate-400 text-xs">
                Retrieving tests...
              </div>
              <div v-else-if="testsList.length === 0" class="p-8 text-center text-slate-400 text-xs">
                No tests available under this category.
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
                  <p class="text-[10px] font-mono text-slate-400 mt-0.5">{{ test.code }}</p>
                </div>
                <span class="font-bold text-slate-800">₹{{ test.rate }}</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Order Metadata -->
          <div class="space-y-4 flex flex-col justify-between">
            <div class="space-y-4">
              <!-- Priority -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Priority</label>
                <select
                  v-model="orderForm.priority"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
                >
                  <option value="ROUTINE">Routine (Standard Scheduling)</option>
                  <option value="URGENT">Urgent (Express slot)</option>
                  <option value="STAT">STAT (Emergency Scan - Immediately)</option>
                </select>
              </div>

              <!-- Clinical History -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Clinical Indications / History</label>
                <textarea
                  v-model="orderForm.clinicalHistory"
                  rows="2"
                  placeholder="E.g. Traumatic chest pain, rule out ribs fractures..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
                ></textarea>
              </div>

              <!-- Remarks -->
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Remarks</label>
                <textarea
                  v-model="orderForm.remarks"
                  rows="2"
                  placeholder="E.g. Portable bedside X-ray required..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
                ></textarea>
              </div>
            </div>

            <!-- Summary -->
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
                <span>Total Cost:</span>
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
            @click="submitRadiologyOrder"
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

    <!-- Detail View Modal -->
    <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div v-if="selectedOrder">
            <h3 class="font-bold text-slate-800 text-sm">Radiology Investigation Details</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Order: <span class="font-mono text-indigo-600 font-bold">{{ selectedOrder.orderNo }}</span></p>
          </div>
          <button @click="showDetailModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scroll Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div v-if="loadingDetails" class="p-12 text-center text-slate-400">
            <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading investigation details...
          </div>

          <div v-else-if="selectedOrder" class="space-y-6">
            <!-- Metadata Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 gap-4 text-xs">
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Referral Doctor</span>
                <p class="font-bold text-slate-800 mt-0.5">Dr. {{ selectedOrder.doctorId?.fullName || 'Self' }}</p>
              </div>
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Order Status</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ selectedOrder.status }}</p>
              </div>
              <div>
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Ordered On</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ formatDate(selectedOrder.createdAt) }}</p>
              </div>
              <div v-if="selectedOrder.clinicalHistory" class="col-span-1 md:col-span-3 border-t border-slate-100 pt-2">
                <span class="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Clinical Indications</span>
                <p class="text-slate-600 mt-0.5 font-medium">{{ selectedOrder.clinicalHistory }}</p>
              </div>
            </div>

            <!-- Items ordered -->
            <div class="space-y-3">
              <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wide text-indigo-700">Requested Imaging Scans</h4>
              <div class="border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-50">
                <div v-for="item in selectedOrderItems" :key="item._id" class="p-4 bg-white hover:bg-slate-50/50 transition-colors flex justify-between items-center text-xs">
                  <div>
                    <p class="font-bold text-slate-800">{{ item.radiologyTestId?.name }}</p>
                    <p class="text-[10px] font-mono text-slate-400 mt-0.5">{{ item.radiologyTestId?.code }}</p>
                  </div>
                  <span class="font-bold text-slate-900">₹{{ item.amount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="showDetailModal = false" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
