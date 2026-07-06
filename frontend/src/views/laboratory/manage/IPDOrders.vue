<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLabStore } from '../../../stores/labStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import ResultsModal from './ResultsModal.vue'
import ReportModal from './ReportModal.vue'

const emit = defineEmits(['saved'])
const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const currentPage = ref(1)
const limit = ref(9) // 9 per page fits nicely in a 3-column grid
const searchQuery = ref('')

const showDetailModal = ref(false)
const showResultsModal = ref(false)
const showReportModal = ref(false)
const selectedOrder = ref(null)
const selectedOrderDetails = ref(null)

const openResultsModal = (order) => {
  selectedOrder.value = order
  showResultsModal.value = true
}

const openReportModal = (order) => {
  selectedOrder.value = order
  showReportModal.value = true
}

const closeResultsModal = () => {
  showResultsModal.value = false
  selectedOrder.value = null
}

const closeReportModal = () => {
  showReportModal.value = false
  selectedOrder.value = null
}

const onResultsSaved = async () => {
  await fetchOrders()
  emit('saved')
}

const fetchOrders = async () => {
  await labStore.fetchOrders(currentPage.value, limit.value, searchQuery.value, '', { admissionId: 'not-null' })
}

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const res = await labStore.updateOrder(orderId, { status: newStatus })
    if (res.success) {
      snackbarStore.show({
        message: `Order status updated to ${newStatus} successfully!`,
        type: 'success'
      })
      await fetchOrders()
      emit('saved')
    } else {
      snackbarStore.show({
        message: res.message || 'Failed to update order status',
        type: 'error'
      })
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    snackbarStore.show({
      message: 'An error occurred while updating status',
      type: 'error'
    })
  }
}

const viewDetails = async (order) => {
  selectedOrder.value = order
  showDetailModal.value = true
  try {
    selectedOrderDetails.value = await labStore.getOrderById(order._id)
  } catch (error) {
    console.error('Error loading order details:', error)
    snackbarStore.show({ message: 'Failed to load order details', type: 'error' })
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedOrder.value = null
  selectedOrderDetails.value = null
}

const getStatusColor = (status) => {
  const map = {
    'ORDERED': 'bg-blue-50 text-blue-700 border-blue-200',
    'PARTIALLY_COLLECTED': 'bg-violet-50 text-violet-700 border-violet-200',
    'COLLECTED': 'bg-purple-50 text-purple-700 border-purple-200',
    'PROCESSING': 'bg-amber-50 text-amber-700 border-amber-200',
    'PARTIALLY_COMPLETED': 'bg-teal-50 text-teal-700 border-teal-200',
    'COMPLETED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'VERIFIED': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'CANCELLED': 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return map[status] || 'bg-slate-50 text-slate-700 border-slate-200'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchOrders()
})

onMounted(async () => {
  await fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Search Panel -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm bg-slate-50/20">
      <div>
        <h2 class="text-lg font-bold text-slate-800">Inpatient (IPD) Orders</h2>
        <p class="text-slate-400 text-xs mt-0.5">IPD referral orders ready for sample collection and testing.</p>
      </div>
      <div class="relative w-full sm:w-80">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search order number..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="labStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading orders...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="labStore.orders.length === 0" class="p-6 text-center text-slate-500 py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-slate-700 font-semibold text-lg">No IPD orders found</p>
      <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
        {{ searchQuery ? "No results match your search query." : "Inpatient referral orders appear here once placed." }}
      </p>
    </div>

    <!-- Paid Orders Cards Grid -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div 
          v-for="order in labStore.orders" 
          :key="order._id" 
          :class="[
            'bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between p-5 relative overflow-hidden group',
            order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING' ? 'opacity-60 grayscale bg-slate-50' : 'hover:shadow-md transition-all'
          ]"
        >
          <!-- Top Priority Stripe -->
          <div :class="[
            'absolute top-0 left-0 right-0 h-1.5',
            order.priority === 'STAT' ? 'bg-rose-500' :
            order.priority === 'URGENT' ? 'bg-amber-500' : 'bg-indigo-500'
          ]"></div>
          
          <!-- Card Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="font-mono text-sm font-bold text-slate-800">{{ order.orderNo }}</span>
              <div class="text-[10px] text-slate-400 mt-0.5">
                {{ formatDate(order.orderDate) }}
              </div>
            </div>
            <div class="flex gap-2">
              <span v-if="order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING'" class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">
                UNPAID
              </span>
              <span :class="[
                'text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border',
                order.priority === 'STAT' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                order.priority === 'URGENT' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              ]">
                {{ order.priority }}
              </span>
            </div>
          </div>
          
          <!-- Unpaid Watermark Overlay -->
          <div v-if="order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING'" class="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
            <!-- Intercepts clicks but we leave it somewhat transparent -->
            <div class="absolute inset-0 z-20 cursor-not-allowed"></div>
            <div class="transform -rotate-12 border-4 border-slate-500 text-slate-500 font-bold text-4xl py-2 px-6 rounded-xl opacity-10 uppercase tracking-widest z-10 select-none">
               Unpaid
            </div>
          </div>
          
          <!-- Patient / Doctor demographics -->
          <div class="space-y-2.5 border-t border-b border-slate-100/80 py-4 my-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-xs">Patient</span>
              <span class="font-semibold text-slate-800 text-right truncate max-w-[180px]">{{ order.patientId?.fullName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-xs">Code / Info</span>
              <span class="font-mono text-xs text-slate-600 text-right">
                {{ order.patientId?.patientCode || 'N/A' }} ({{ order.patientId?.age }}Y / {{ order.patientId?.gender }})
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-xs">Doctor</span>
              <span class="text-slate-700 text-right truncate max-w-[180px]">
                {{ order.referral === 'Self' ? 'Self-Referred' : `Dr. ${order.doctorId?.fullName || 'N/A'}` }}
              </span>
            </div>
          </div>
          
          <!-- Price and Status -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-[10px] text-slate-400">Total Amount</div>
              <div class="text-lg font-bold text-slate-800">₹{{ order.totalAmount?.toLocaleString() || '0' }}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-400 mb-1">Status</div>
              <span :class="[
                'text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded border',
                getStatusColor(order.status)
              ]">
                {{ order.status }}
              </span>
            </div>
          </div>
          
          <!-- Footer Actions -->
          <div class="flex flex-col gap-3 pt-3 border-t border-slate-50 mt-auto w-full">
            <div class="flex items-center gap-3 w-full">
              <div class="flex-grow">
                <label class="sr-only">Update Status</label>
                <select 
                  :value="order.status"
                  @change="updateOrderStatus(order._id, $event.target.value)"
                  class="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ORDERED">Ordered</option>
                  <option value="PARTIALLY_COLLECTED">Partially Collected</option>
                  <option value="COLLECTED">Collected</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PARTIALLY_COMPLETED">Partially Completed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <button 
                @click="viewDetails(order)"
                class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Details</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Context-specific Results/Report Actions -->
            <div class="flex gap-3 w-full" v-if="order.status === 'COLLECTED' || order.status === 'PROCESSING' || order.status === 'COMPLETED' || order.status === 'VERIFIED'">
              <button 
                v-if="order.status === 'COLLECTED' || order.status === 'PROCESSING'"
                @click="openResultsModal(order)"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Enter Results</span>
              </button>
              <button 
                v-if="order.status === 'COMPLETED' || order.status === 'VERIFIED'"
                @click="openReportModal(order)"
                class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                </svg>
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div 
        v-if="labStore.orderPagination.total > 0" 
        class="px-6 py-4.5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
      >
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, labStore.orderPagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ labStore.orderPagination.total }}</span> 
          entries
        </span>

        <div v-if="labStore.orderPagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            v-for="page in labStore.orderPagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < labStore.orderPagination.pages && currentPage++"
            :disabled="currentPage === labStore.orderPagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="showDetailModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeDetailModal"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Order Details</h3>
            <p class="font-mono text-xs text-indigo-600 font-semibold mt-0.5">{{ selectedOrder.orderNo }}</p>
          </div>
          <button @click="closeDetailModal" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Patient & Clinician Block -->
          <div class="bg-slate-50/70 border border-slate-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Patient</div>
              <div class="font-semibold text-slate-800 mt-1">{{ selectedOrder.patientId?.fullName }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Code: {{ selectedOrder.patientId?.patientCode }}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Age / Gender</div>
              <div class="font-semibold text-slate-800 mt-1">{{ selectedOrder.patientId?.age }} Yrs / {{ selectedOrder.patientId?.gender }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Mob: {{ selectedOrder.patientId?.mobileNo }}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Clinician</div>
              <div class="font-semibold text-slate-800 mt-1">{{ selectedOrder.referral === 'Self' ? 'Self-Referred' : `Dr. ${selectedOrder.doctorId?.fullName || 'N/A'}` }}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Priority & Date</div>
              <div class="font-semibold text-slate-800 mt-1 uppercase text-xs">{{ selectedOrder.priority }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ formatDate(selectedOrder.orderDate) }}</div>
            </div>
          </div>

          <!-- Test Items List -->
          <div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ordered Tests</h4>
            <div class="border border-slate-100 rounded-xl overflow-hidden shadow-inner bg-white">
              <table class="w-full border-collapse text-left text-sm">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-100">
                    <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                    <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Price</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in selectedOrderDetails?.items || []" :key="item._id" class="hover:bg-slate-50/50">
                    <td class="px-4 py-3 text-slate-700 font-medium">{{ item.testName }}</td>
                    <td class="px-4 py-3 text-slate-700 font-mono text-right">₹{{ item.rate?.toLocaleString() }}</td>
                  </tr>
                  <tr class="bg-slate-50/30 font-bold border-t border-slate-200">
                    <td class="px-4 py-3 text-slate-800">Total Net Amount</td>
                    <td class="px-4 py-3 text-slate-800 text-right font-mono">₹{{ selectedOrder.totalAmount?.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes & Remarks -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" v-if="selectedOrder.clinicalNotes || selectedOrder.remarks">
            <div v-if="selectedOrder.clinicalNotes" class="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <div class="font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</div>
              <div class="text-slate-600 leading-relaxed">{{ selectedOrder.clinicalNotes }}</div>
            </div>
            <div v-if="selectedOrder.remarks" class="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <div class="font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</div>
              <div class="text-slate-600 leading-relaxed">{{ selectedOrder.remarks }}</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500 uppercase">Update Status:</span>
            <select 
              :value="selectedOrder.status"
              @change="updateOrderStatus(selectedOrder._id, $event.target.value); closeDetailModal()"
              class="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="ORDERED">Ordered</option>
              <option value="PARTIALLY_COLLECTED">Partially Collected</option>
              <option value="COLLECTED">Collected</option>
              <option value="PROCESSING">Processing</option>
              <option value="PARTIALLY_COMPLETED">Partially Completed</option>
              <option value="COMPLETED">Completed</option>
              <option value="VERIFIED">Verified</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <button 
              v-if="selectedOrder.status === 'COLLECTED' || selectedOrder.status === 'PROCESSING'"
              @click="openResultsModal(selectedOrder); closeDetailModal()"
              class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
            >
              Enter Results
            </button>
            <button 
              v-if="selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'VERIFIED'"
              @click="openReportModal(selectedOrder); closeDetailModal()"
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-100 hover:shadow-emerald-200 cursor-pointer"
            >
              Print Report
            </button>
            <button 
              @click="closeDetailModal"
              class="px-4 py-2 text-xs font-bold text-slate-655 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Entry Modal -->
    <ResultsModal 
      :show="showResultsModal" 
      :order="selectedOrder" 
      @close="closeResultsModal"
      @saved="onResultsSaved"
    />

    <!-- Report Preview & Print Modal -->
    <ReportModal 
      :show="showReportModal" 
      :order="selectedOrder" 
      @close="closeReportModal"
    />
  </div>
</template>
