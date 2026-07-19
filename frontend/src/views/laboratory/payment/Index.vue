<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useLabStore } from '../../../stores/labStore'
import LabPaymentView from './View.vue'

const snackbarStore = useSnackbarStore()
const labStore = useLabStore()

// State
const selectedOrder = ref(null)
const selectedDetailedOrder = ref(null)

// Filtering & Pagination
const searchQuery = ref('')
const paymentStatusFilter = ref('UNPAID') // 'UNPAID', 'PARTIAL', 'PAID', or '' (All)
const currentPage = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)

// Payment Modal State
const showPaymentModal = ref(false)
const processingPayment = ref(false)
const activeBill = ref(null)
const paymentForm = ref({
  amount: 0,
  paymentMode: 'CASH',
  transactionNo: '',
  remarks: ''
})

const fetchOrders = async () => {
  try {
    await labStore.fetchOrders(
      currentPage.value,
      limit.value,
      searchQuery.value,
      paymentStatusFilter.value
    )
    
    const pag = labStore.orderPagination
    if (pag) {
      totalPages.value = pag.pages || 1
      totalItems.value = pag.total || labStore.orders.length
    } else {
      totalPages.value = 1
      totalItems.value = labStore.orders.length
    }
  } catch (error) {
    console.error('Error fetching lab orders:', error)
    snackbarStore.show({
      message: labStore.error || 'Failed to fetch lab orders',
      type: 'error'
    })
  }
}

const fetchOrderDetails = async (orderId) => {
  try {
    selectedDetailedOrder.value = await labStore.getOrderById(orderId)
  } catch (error) {
    console.error('Error fetching order details:', error)
    snackbarStore.show({
      message: error.response?.data?.message || 'Failed to load order details',
      type: 'error'
    })
  }
}

const handleSelectOrder = async (order) => {
  selectedOrder.value = order
  selectedDetailedOrder.value = null
  await fetchOrderDetails(order._id)
}

const handleBillGenerated = async (bill) => {
  // Re-fetch list to update statuses, and reload current selected order details
  await fetchOrders()
  if (selectedOrder.value) {
    await fetchOrderDetails(selectedOrder.value._id)
  }
}

const handlePayClicked = (bill) => {
  activeBill.value = bill
  paymentForm.value = {
    amount: bill.balanceAmount,
    paymentMode: 'CASH',
    transactionNo: '',
    remarks: ''
  }
  showPaymentModal.value = true
}

const submitPayment = async () => {
  if (paymentForm.value.amount <= 0) {
    snackbarStore.show({ message: 'Please enter a valid payment amount', type: 'error' })
    return
  }
  if (paymentForm.value.amount > activeBill.value.balanceAmount) {
    snackbarStore.show({ message: 'Payment amount exceeds balance amount', type: 'error' })
    return
  }
  if (paymentForm.value.paymentMode !== 'CASH' && !paymentForm.value.transactionNo) {
    snackbarStore.show({ message: 'Transaction ID is required for non-cash payments', type: 'error' })
    return
  }

  processingPayment.value = true
  try {
    await labStore.processPayment(activeBill.value._id, paymentForm.value)
    snackbarStore.show({
      message: 'Payment processed successfully!',
      type: 'success'
    })
    showPaymentModal.value = false
    
    // Refresh
    await fetchOrders()
    if (selectedOrder.value) {
      await fetchOrderDetails(selectedOrder.value._id)
    }
  } catch (error) {
    console.error('Error processing payment:', error)
    snackbarStore.show({
      message: error.response?.data?.message || 'Failed to process payment',
      type: 'error'
    })
  } finally {
    processingPayment.value = false
  }
}

// Watch filters
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 400)
})

watch(paymentStatusFilter, () => {
  currentPage.value = 1
  selectedOrder.value = null
  selectedDetailedOrder.value = null
  fetchOrders()
})

watch(currentPage, () => {
  fetchOrders()
})

onMounted(() => {
  fetchOrders()
})

const getStatusColor = (status) => {
  switch (status) {
    case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'UNPAID': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'IPD': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Laboratory Payments</h1>
        <p class="text-slate-500 mt-1 text-sm">Process bills and collect payments for laboratory orders.</p>
      </div>
    </div>

    <!-- Main Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Order List -->
      <div class="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
        <!-- List Header -->
        <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-800 self-start">Lab Orders</h2>
            
            <!-- Filters Tabs -->
            <div class="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold w-full sm:w-auto">
              <button 
                @click="paymentStatusFilter = 'UNPAID'"
                :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'UNPAID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
              >
                Pending
              </button>
              <button 
                @click="paymentStatusFilter = 'PAID'"
                :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'PAID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
              >
                Paid
              </button>
              <button 
                @click="paymentStatusFilter = 'IPD'"
                :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'IPD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
              >
                IPD
              </button>
              <button 
                @click="paymentStatusFilter = ''"
                :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === '' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
              >
                All
              </button>
            </div>
          </div>

          <!-- Search Input -->
          <div class="relative w-full">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by Order No..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <!-- Orders Table/List -->
        <div class="flex-grow overflow-y-auto">
          <!-- Loading state (Skeleton) -->
          <table v-if="labStore.loading && labStore.orders.length === 0" class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th class="px-6 py-4">Order No</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Patient</th>
                <th class="px-6 py-4 text-right">Amount</th>
                <th class="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="i in 6" :key="i">
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-20"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-32 mb-1.5"></div>
                  <div class="h-3 bg-slate-200 rounded animate-pulse w-20"></div>
                </td>
                <td class="px-6 py-4 flex justify-end">
                  <div class="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-5 bg-slate-200 rounded animate-pulse w-16 mx-auto"></div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty state -->
          <div v-else-if="labStore.orders.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400 p-8 py-16">
            <svg class="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-slate-700 font-semibold text-base">No orders found</p>
            <p class="text-slate-400 text-xs mt-1 text-center max-w-xs">
              {{ searchQuery ? "No results match your search query." : "There are currently no orders with this payment status." }}
            </p>
          </div>

          <!-- Table -->
          <table v-else class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th class="px-6 py-4">Order No</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Patient</th>
                <th class="px-6 py-4 text-right">Amount</th>
                <th class="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr 
                v-for="order in labStore.orders" 
                :key="order._id"
                @click="handleSelectOrder(order)"
                :class="['hover:bg-slate-50/80 cursor-pointer transition-all', selectedOrder && selectedOrder._id === order._id ? 'bg-indigo-50/50 hover:bg-indigo-50 font-medium' : '']"
              >
                <td class="px-6 py-4">
                  <span class="font-mono font-bold text-slate-900">{{ order.orderNo }}</span>
                </td>
                <td class="px-6 py-4 text-slate-500">
                  {{ formatDate(order.orderDate) }}
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800">{{ order.patientId?.fullName || 'N/A' }}</p>
                  <p class="text-[10px] text-slate-500 font-mono mt-0.5">{{ order.patientId?.patientCode || '-' }}</p>
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-slate-900">
                  {{ formatCurrency(order.totalAmount) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase border', getStatusColor(order.paymentStatus)]">
                    {{ order.paymentStatus }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div v-if="totalPages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span class="text-xs font-semibold text-slate-600">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Right Column: Detail View -->
      <div class="lg:col-span-5 h-[700px]">
        <LabPaymentView 
          v-if="selectedOrder && selectedDetailedOrder" 
          :order="selectedDetailedOrder" 
          @bill-generated="handleBillGenerated"
          @pay-clicked="handlePayClicked"
        />
        <div v-else class="bg-white border border-slate-100 rounded-2xl shadow-sm h-full flex flex-col justify-center items-center text-slate-400 p-8 text-center">
          <div class="p-4 bg-slate-50 rounded-full border border-slate-100 mb-4 animate-pulse">
            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p class="text-slate-700 font-semibold text-base">No Order Selected</p>
          <p class="text-slate-400 text-xs mt-1 max-w-[240px]">
            Please click on any laboratory order from the list on the left to see details and process billing.
          </p>
        </div>
      </div>
    </div>

    <!-- Payment Process Modal Overlay -->
    <div v-if="showPaymentModal && activeBill" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showPaymentModal = false"></div>
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Record Payment</h3>
            <p class="text-xs text-slate-500 mt-0.5">Bill Number: <span class="font-mono font-bold">{{ activeBill.billNo }}</span></p>
          </div>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4">
          <!-- Totals Info -->
          <div class="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-500 font-medium">Bill Net Total:</span>
              <p class="font-bold text-slate-800 font-mono text-sm mt-0.5">{{ formatCurrency(activeBill.netAmount) }}</p>
            </div>
            <div>
              <span class="text-slate-500 font-medium">Already Paid:</span>
              <p class="font-bold text-slate-800 font-mono text-sm mt-0.5">{{ formatCurrency(activeBill.paidAmount) }}</p>
            </div>
            <div class="col-span-2 border-t border-indigo-100 pt-2 flex justify-between items-center text-sm">
              <span class="font-semibold text-indigo-950">Amount Payable:</span>
              <span class="font-bold text-rose-600 font-mono">{{ formatCurrency(activeBill.balanceAmount) }}</span>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="space-y-4">
            <!-- Payment Mode Select -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Payment Mode</label>
              <select 
                v-model="paymentForm.paymentMode"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all shadow-sm"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <!-- Paying Amount (Read-only or prefilled) -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Paying Amount (INR)</label>
              <input 
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                :max="activeBill.balanceAmount"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all shadow-sm"
              />
            </div>

            <!-- Transaction No (Visible if not Cash) -->
            <div v-if="paymentForm.paymentMode !== 'CASH'" class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Transaction ID / Reference No</label>
              <input 
                v-model="paymentForm.transactionNo"
                type="text"
                placeholder="Enter Transaction / Cheque number..."
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all shadow-sm"
              />
            </div>

            <!-- Remarks -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Remarks (Optional)</label>
              <textarea 
                v-model="paymentForm.remarks"
                placeholder="Add any internal remarks here..."
                rows="2"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all shadow-sm resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            @click="showPaymentModal = false"
            class="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="submitPayment"
            :disabled="processingPayment"
            class="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span v-if="processingPayment" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  </div>
</template>