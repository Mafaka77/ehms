<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const orders = ref([])
const totalPending = ref(0)
const totalDispensed = ref(0)
const totalReturns = ref(0)

const processingReturn = ref(false)
const showRejectReturnModal = ref(false)
const selectedItemForReject = ref(null)
const rejectReason = ref('')

const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  status: '' // All, PENDING, RETURN_REQUESTED, ISSUED, CANCELLED
})

const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  pages: 1
})

const selectedOrder = ref(null)
const showDetailsModal = ref(false)
const updatingStatus = ref(false)

const fetchIpdOrders = async (silent = false) => {
  if (!silent) loading.value = true
  const res = await pharmacyStore.fetchIpdOrders(
    filters.value.page,
    filters.value.limit,
    filters.value.search,
    filters.value.status
  )
  if (res.success) {
    orders.value = res.data
    pagination.value = res.pagination || { total: res.data.length, page: 1, limit: 10, pages: 1 }
  } else if (!silent) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  if (!silent) loading.value = false
}

// Fetch general counts for KPIs
const fetchKpis = async () => {
  // Fetch pending count
  const pendingRes = await pharmacyStore.fetchIpdOrders(1, 100, '', 'PENDING')
  if (pendingRes.success) {
    totalPending.value = pendingRes.pagination?.total || pendingRes.data.length
    pharmacyStore.pendingIpdOrdersCount = totalPending.value
  }
  
  // Fetch issued count
  const issuedRes = await pharmacyStore.fetchIpdOrders(1, 100, '', 'ISSUED')
  if (issuedRes.success) {
    totalDispensed.value = issuedRes.pagination?.total || issuedRes.data.length
  }

  // Fetch return requests count
  const returnRes = await pharmacyStore.fetchIpdOrders(1, 100, '', 'RETURN_REQUESTED')
  if (returnRes.success) {
    totalReturns.value = returnRes.pagination?.total || returnRes.data.length
  }
}

watch(() => [filters.value.status, filters.value.search], () => {
  filters.value.page = 1
  fetchIpdOrders()
})

watch(() => filters.value.page, () => {
  fetchIpdOrders()
})

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

const formatItemsList = (items) => {
  if (!items || items.length === 0) return '-'
  return items.map(item => `${item.medicineId?.medicineName || 'Med'} x ${item.quantity}`).join(', ')
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showDetailsModal.value = true
}

const updateStatus = async (orderId, newStatus) => {
  updatingStatus.value = true
  const res = await pharmacyStore.updateIpdOrderStatus(orderId, newStatus)
  if (res.success) {
    snackbarStore.show({ message: `Order status updated to ${newStatus} successfully`, type: 'success' })
    showDetailsModal.value = false
    await fetchIpdOrders()
    await fetchKpis()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  updatingStatus.value = false
}

const approveReturnItem = async (item) => {
  if (!confirm(`Approve return of ${item.returnRequestedQuantity} unit(s) of ${item.medicineId?.medicineName || 'this medicine'}? Stock and patient charges will be automatically adjusted.`)) return

  processingReturn.value = true
  const res = await pharmacyStore.approveReturnIpdMedicineItem(item._id, item.returnRequestedQuantity, item.returnReason)
  if (res.success) {
    snackbarStore.show({ message: 'Medicine return approved and inventory restored.', type: 'success' })
    await fetchIpdOrders()
    await fetchKpis()
    if (selectedOrder.value) {
      const updatedOrder = orders.value.find(o => o._id === selectedOrder.value._id)
      if (updatedOrder) selectedOrder.value = updatedOrder
    }
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  processingReturn.value = false
}

const openRejectReturnModal = (item) => {
  selectedItemForReject.value = item
  rejectReason.value = ''
  showRejectReturnModal.value = true
}

const submitRejectReturn = async () => {
  if (!selectedItemForReject.value) return
  processingReturn.value = true
  const res = await pharmacyStore.rejectReturnIpdMedicineItem(
    selectedItemForReject.value._id,
    rejectReason.value || 'Rejected by Pharmacist'
  )
  if (res.success) {
    snackbarStore.show({ message: 'Medicine return request rejected.', type: 'success' })
    showRejectReturnModal.value = false
    await fetchIpdOrders()
    await fetchKpis()
    if (selectedOrder.value) {
      const updatedOrder = orders.value.find(o => o._id === selectedOrder.value._id)
      if (updatedOrder) selectedOrder.value = updatedOrder
    }
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  processingReturn.value = false
}

let pollingInterval = null

const pollData = async () => {
  await fetchIpdOrders(true)
  await fetchKpis()
}

onMounted(async () => {
  await fetchIpdOrders()
  await fetchKpis()
  // Setup silent background polling every 10 seconds
  pollingInterval = setInterval(pollData, 10000)
})

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Banner -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-slate-400 text-xs font-bold tracking-wider uppercase block">Pending Requisitions</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">{{ totalPending }} Orders</span>
          <span class="text-teal-600 text-xs font-semibold mt-1 block">Awaiting dispensation</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-slate-400 text-xs font-bold tracking-wider uppercase block">Return Requests</span>
          <span class="text-2xl font-extrabold text-amber-600 mt-1 block">{{ totalReturns }} Requests</span>
          <span class="text-amber-600 text-xs font-semibold mt-1 block">From IPD nursing stations</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-slate-400 text-xs font-bold tracking-wider uppercase block">Issued / Dispensed</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">{{ totalDispensed }} Orders</span>
          <span class="text-emerald-600 text-xs font-semibold mt-1 block">Delivered to ward</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>

    <!-- Orders Filter & Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Table Header Filters -->
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Ward Requisitions</h3>
          <p class="text-xs text-slate-400 mt-0.5">Manage medication requests submitted from the IPD nursing stations.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <!-- Status filter dropdown -->
          <select 
            v-model="filters.status"
            class="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="RETURN_REQUESTED">RETURN REQUESTS ({{ totalReturns }})</option>
            <option value="ISSUED">ISSUED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          
          <!-- Search input -->
          <input 
            type="text" 
            v-model="filters.search"
            placeholder="Search request no..." 
            class="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white" 
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12 text-center text-slate-400">
        <svg class="animate-spin h-6 w-6 mx-auto text-teal-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Fetching requisitions...
      </div>

      <!-- Empty State -->
      <div v-else-if="orders.length === 0" class="p-12 text-center text-slate-400 bg-slate-50/10">
        <svg class="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        <p class="text-sm font-semibold text-slate-600">No requisitions found</p>
        <p class="text-xs text-slate-400 mt-1">Try relaxing the search filters or choosing a different status.</p>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Order No.</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Patient & Ward</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Prescribed Items</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Requested By</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Request Time</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="order in orders" :key="order._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1 items-start">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-slate-800 text-sm">{{ order.requestNo }}</span>
                    <span v-if="order.hasReturnRequest || order.items?.some(i => i.returnStatus === 'REQUESTED')" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                      Return Requested
                    </span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold border" :class="getPriorityColor(order.priority)">
                    {{ order.priority }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800 text-sm">{{ order.patientId?.fullName || 'N/A' }}</div>
                <div class="text-[10px] font-semibold text-slate-400">
                  Bed {{ order.admissionId?.bedId?.bedNo || 'N/A' }} - {{ order.admissionId?.bedId?.wardId?.name || 'N/A' }}
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600 text-sm max-w-xs truncate" :title="formatItemsList(order.items)">
                {{ formatItemsList(order.items) }}
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-slate-700">{{ order.doctorId?.fullName || 'N/A' }}</div>
                <div class="text-[9px] font-semibold text-slate-400">Station: {{ order.nursingStationId?.name || 'Main Station' }}</div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border" :class="getStatusColor(order.status)">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-xs font-semibold">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="px-6 py-4 text-center">
                <button 
                  @click="viewOrderDetails(order)"
                  class="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="pagination.pages > 1" class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500 font-medium">Page {{ pagination.page }} of {{ pagination.pages }} • Total {{ pagination.total }} items</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="pagination.page <= 1"
            @click="filters.page--"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <button 
            :disabled="pagination.page >= pagination.pages"
            @click="filters.page++"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Requisition Details Modal -->
    <div 
      v-if="showDetailsModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
              Requisition #{{ selectedOrder?.requestNo }}
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border" :class="getPriorityColor(selectedOrder?.priority)">
                {{ selectedOrder?.priority }}
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Submitted: {{ formatDate(selectedOrder?.createdAt) }}</p>
          </div>
          <button 
            @click="showDetailsModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body Details -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          <!-- Information grid -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Patient</span>
              <span class="text-sm font-bold text-slate-800 block">{{ selectedOrder?.patientId?.fullName }}</span>
              <span class="text-xs font-mono text-slate-500">{{ selectedOrder?.patientId?.patientCode }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ward Location</span>
              <span class="text-sm font-bold text-slate-800 block">Bed {{ selectedOrder?.admissionId?.bedId?.bedNo }}</span>
              <span class="text-xs text-slate-500 font-medium">{{ selectedOrder?.admissionId?.bedId?.wardId?.name }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prescribing Doctor</span>
              <span class="text-sm font-bold text-slate-800 block">{{ selectedOrder?.doctorId?.fullName }}</span>
              <span class="text-xs text-slate-500">{{ selectedOrder?.doctorId?.specializationId?.name }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Requested By</span>
              <span class="text-sm font-bold text-slate-800 block">{{ selectedOrder?.requestedBy?.fullName }}</span>
              <span class="text-xs text-slate-500">Nursing Station: {{ selectedOrder?.nursingStationId?.name }}</span>
            </div>
          </div>

          <!-- Order Remarks -->
          <div v-if="selectedOrder?.remarks" class="space-y-1">
            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prescriber Remarks</span>
            <p class="text-xs text-slate-650 bg-amber-50/30 border border-amber-100/50 p-3 rounded-xl leading-relaxed">
              {{ selectedOrder.remarks }}
            </p>
          </div>

          <!-- Return Request Alert in Modal -->
          <div v-if="selectedOrder?.items?.some(i => i.returnStatus === 'REQUESTED')" class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5 text-amber-900 font-semibold">
              <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>This requisition has pending medicine return requests awaiting your review and approval.</span>
            </div>
          </div>

          <!-- Items Checklist -->
          <div class="space-y-2">
            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Requested Medication Checklist</span>
            
            <div class="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-550 font-bold border-b border-slate-100">
                  <tr>
                    <th class="px-4 py-2.5">Medicine Name</th>
                    <th class="px-4 py-2.5">Generic / Strength</th>
                    <th class="px-4 py-2.5 text-center">Req. Qty</th>
                    <th class="px-4 py-2.5 text-center">Issued</th>
                    <th class="px-4 py-2.5 text-center">Returned</th>
                    <th class="px-4 py-2.5">Status / Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-600">
                  <tr v-for="item in selectedOrder?.items" :key="item._id" class="hover:bg-slate-50/30" :class="{ 'bg-amber-50/40': item.returnStatus === 'REQUESTED' }">
                    <td class="px-4 py-2.5 font-bold text-slate-800">
                      {{ item.medicineId?.medicineName }}
                    </td>
                    <td class="px-4 py-2.5 text-slate-450 italic font-mono">
                      {{ item.medicineId?.genericName || '-' }} ({{ item.medicineId?.strength || '' }} {{ item.medicineId?.unit || '' }})
                    </td>
                    <td class="px-4 py-2.5 text-center font-bold text-slate-700">{{ item.quantity }}</td>
                    <td class="px-4 py-2.5 text-center font-bold" :class="item.issuedQuantity > 0 ? 'text-emerald-600' : 'text-slate-400'">
                      {{ item.issuedQuantity }}
                    </td>
                    <td class="px-4 py-2.5 text-center font-bold" :class="item.returnedQuantity > 0 ? 'text-rose-600' : 'text-slate-400'">
                      {{ item.returnedQuantity || 0 }}
                    </td>
                    <td class="px-4 py-2.5">
                      <!-- Pending Return Request Action Panel -->
                      <div v-if="item.returnStatus === 'REQUESTED'" class="space-y-1.5">
                        <div class="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Return Requested: {{ item.returnRequestedQuantity }} Qty
                        </div>
                        <p v-if="item.returnReason" class="text-[10px] text-slate-600 italic bg-white/80 p-1.5 rounded border border-amber-200">
                          "{{ item.returnReason }}"
                        </p>
                        <p v-if="item.returnRequestedBy?.fullName" class="text-[9px] text-slate-400">
                          By: {{ item.returnRequestedBy.fullName }}
                        </p>
                        <div class="flex items-center gap-1.5 pt-1">
                          <button 
                            @click="approveReturnItem(item)"
                            :disabled="processingReturn"
                            type="button"
                            class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            Approve
                          </button>
                          <button 
                            @click="openRejectReturnModal(item)"
                            :disabled="processingReturn"
                            type="button"
                            class="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      <!-- Approved Status -->
                      <span v-else-if="item.returnStatus === 'APPROVED'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        ✓ Returned
                      </span>

                      <!-- Rejected Status -->
                      <span v-else-if="item.returnStatus === 'REJECTED'" class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1" :title="'Reason: ' + (item.returnRejectionReason || '')">
                        ✕ Return Rejected
                      </span>

                      <!-- Normal Remarks -->
                      <span v-else class="text-slate-500 font-medium">{{ item.remarks || '-' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div>
            <span class="text-xs font-semibold text-slate-450">Current Status:</span>
            <span class="px-2.5 py-0.5 ml-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-white" :class="getStatusColor(selectedOrder?.status)">
              {{ selectedOrder?.status }}
            </span>
          </div>
          <div class="flex gap-2">
            <button 
              type="button"
              @click="showDetailsModal = false"
              class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
            <button 
              v-if="selectedOrder?.status === 'PENDING'"
              type="button"
              @click="updateStatus(selectedOrder._id, 'CANCELLED')"
              :disabled="updatingStatus"
              class="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel Order
            </button>
            <button 
              v-if="selectedOrder?.status === 'PENDING'"
              type="button"
              @click="updateStatus(selectedOrder._id, 'ISSUED')"
              :disabled="updatingStatus"
              class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg v-if="updatingStatus" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Dispense Medication
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Return Confirmation Modal -->
    <div 
      v-if="showRejectReturnModal" 
      class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Reject Return Request</h3>
            <p class="text-xs text-slate-400">Medicine: {{ selectedItemForReject?.medicineId?.medicineName }}</p>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wide">Reason for Rejection</label>
          <textarea 
            v-model="rejectReason"
            rows="3"
            placeholder="e.g. Vial already opened/compromised, return window passed..."
            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 text-xs"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            @click="showRejectReturnModal = false"
            class="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitRejectReturn"
            :disabled="processingReturn"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
