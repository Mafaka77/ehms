<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRadiologyStore } from '../../../stores/radiologyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const router = useRouter()
const radiologyStore = useRadiologyStore()
const snackbarStore = useSnackbarStore()

const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const paymentFilter = ref('')

const fetchOrders = async () => {
  await radiologyStore.fetchOrders(currentPage.value, limit.value, searchQuery.value, paymentFilter.value)
}

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 400)
})

watch([currentPage, limit, paymentFilter], () => {
  fetchOrders()
})

const getStatusColor = (status) => {
  const map = {
    ORDERED: 'bg-blue-100 text-blue-700 border-blue-200',
    SCHEDULED: 'bg-purple-100 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
    PARTIALLY_COMPLETED: 'bg-orange-100 text-orange-700 border-orange-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    VERIFIED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200'
  }
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200'
}

const getPaymentColor = (status) => {
  const map = {
    UNPAID: 'bg-rose-50 text-rose-600 border-rose-200',
    PAID: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    CREDIT: 'bg-amber-50 text-amber-600 border-amber-200',
    CASHLESS: 'bg-blue-50 text-blue-600 border-blue-200',
    CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
    IPD: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  }
  return map[status] || 'bg-slate-50 text-slate-600 border-slate-200'
}

const getPriorityColor = (p) => {
  if (p === 'STAT') return 'bg-rose-50 text-rose-600 border-rose-200'
  if (p === 'URGENT') return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

const handleDelete = async (id) => {
  if (!confirm('Delete this radiology order? All associated items will also be deleted.')) return
  const res = await radiologyStore.deleteOrder(id)
  if (res.success) {
    snackbarStore.show({ message: 'Order deleted successfully', type: 'success' })
    if (radiologyStore.orders.length === 0 && currentPage.value > 1) {
      currentPage.value--
    } else {
      fetchOrders()
    }
  } else {
    snackbarStore.show({ message: res.message || 'Failed to delete order', type: 'error' })
  }
}

onMounted(() => fetchOrders())
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Radiology Orders</h1>
        </div>
        <p class="text-slate-500 text-sm">Manage and track patient radiology orders.</p>
      </div>
      <button
        @click="router.push({ name: 'radiology-order-create' })"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Create Order
      </button>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Search + Filter bar -->
      <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-base font-semibold text-slate-800 shrink-0">Order List</h2>
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <!-- Search -->
          <div class="relative w-full sm:w-72">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by order no..."
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <!-- Payment filter -->
          <select
            v-model="paymentFilter"
            class="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
          >
            <option value="">All Payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="IPD">IPD</option>
            <option value="CREDIT">Credit</option>
            <option value="CASHLESS">Cashless</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="radiologyStore.loading" class="flex flex-col items-center justify-center py-24">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-slate-400 font-medium">Loading orders...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="radiologyStore.orders.length === 0" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-slate-700 font-semibold text-lg">No orders found</p>
        <p class="text-slate-400 text-sm mt-1">
          {{ searchQuery || paymentFilter ? 'No results match your filters.' : "Click 'Create Order' to register a new radiology order." }}
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left whitespace-nowrap">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Order No</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Date</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Patient</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Doctor</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Priority</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-right">Amount</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Payment</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="order in radiologyStore.orders"
              :key="order._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Order No -->
              <td class="px-6 py-4">
                <span class="font-mono text-sm font-bold text-slate-800">{{ order.orderNo }}</span>
              </td>
              <!-- Date -->
              <td class="px-6 py-4">
                <div class="flex flex-col text-sm">
                  <span class="text-slate-700">{{ new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
                  <span class="text-slate-400 text-xs">{{ new Date(order.orderDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
              </td>
              <!-- Patient -->
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-slate-800">{{ order.patientId?.fullName || '—' }}</span>
                  <span class="text-xs text-slate-400">{{ order.patientId?.patientCode }} · {{ order.patientId?.mobileNo }}</span>
                </div>
              </td>
              <!-- Doctor -->
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ order.doctorId?.fullName || order.referral === 'Self' ? 'Self' : '—' }}</span>
              </td>
              <!-- Priority -->
              <td class="px-6 py-4">
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border" :class="getPriorityColor(order.priority)">
                  {{ order.priority }}
                </span>
              </td>
              <!-- Amount -->
              <td class="px-6 py-4 text-right">
                <span class="text-sm font-semibold text-slate-800">₹{{ order.totalAmount?.toLocaleString('en-IN') || '0' }}</span>
              </td>
              <!-- Payment Status -->
              <td class="px-6 py-4 text-center">
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border" :class="getPaymentColor(order.paymentStatus)">
                  {{ order.paymentStatus }}
                </span>
              </td>
              <!-- Order Status -->
              <td class="px-6 py-4 text-center">
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border" :class="getStatusColor(order.status)">
                  {{ order.status?.replace('_', ' ') }}
                </span>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="router.push({ name: 'radiology-order-edit', params: { id: order._id } })"
                    class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Order"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(order._id)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete Order"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="radiologyStore.orderPagination.total > 0"
        class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <span class="text-sm text-slate-500 font-medium">
          Showing
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span>
          to
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, radiologyStore.orderPagination.total) }}</span>
          of
          <span class="text-slate-800 font-semibold">{{ radiologyStore.orderPagination.total }}</span>
          entries
        </span>
        <div v-if="radiologyStore.orderPagination.pages > 1" class="flex items-center gap-2">
          <button
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            v-for="page in radiologyStore.orderPagination.pages"
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >{{ page }}</button>
          <button
            @click="currentPage < radiologyStore.orderPagination.pages && currentPage++"
            :disabled="currentPage === radiologyStore.orderPagination.pages"
            class="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
