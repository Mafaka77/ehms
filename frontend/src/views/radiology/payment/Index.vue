<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useRadiologyStore } from '../../../stores/radiologyStore'
import { useAuthStore } from '../../../stores/authStore'
import RadiologyPaymentView from './View.vue'

const snackbarStore = useSnackbarStore()
const radiologyStore = useRadiologyStore()
const authStore = useAuthStore()

const isSuperAdmin = computed(() => {
  const r = authStore.user?.roleName || authStore.user?.role?.name
  return r === 'SuperAdmin'
})

// State
const loading = ref(true)
const selectedOrder = ref(null)
const selectedDetailedOrder = ref(null)

// Filtering & Pagination
const searchQuery = ref('')
const paymentStatusFilter = ref('UNPAID') // 'UNPAID', 'PARTIAL', 'PAID', or '' (All)
const filterStartDate = ref('')
const filterEndDate = ref('')
const isExportingPdf = ref(false)
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
  loading.value = true
  try {
    const additionalParams = {}
    if (filterStartDate.value) additionalParams.startDate = filterStartDate.value
    if (filterEndDate.value) additionalParams.endDate = filterEndDate.value

    await radiologyStore.fetchOrders(
      currentPage.value,
      limit.value,
      searchQuery.value,
      paymentStatusFilter.value,
      additionalParams
    )
    
    const pag = radiologyStore.orderPagination
    if (pag) {
      totalPages.value = pag.pages || 1
      totalItems.value = pag.total || radiologyStore.orders.length
    } else {
      totalPages.value = 1
      totalItems.value = radiologyStore.orders.length
    }
  } catch (error) {
    console.error('Error fetching radiology orders:', error)
    snackbarStore.show({
      message: radiologyStore.error || 'Failed to fetch radiology orders',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const fetchOrderDetails = async (orderId) => {
  try {
    const detailed = await radiologyStore.getOrderById(orderId)
    selectedDetailedOrder.value = { ...detailed.order, items: detailed.items }
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
  if (paymentForm.value.amount < 0) {
    snackbarStore.show({ message: 'Payment amount cannot be negative', type: 'error' })
    return
  }
  if (paymentForm.value.amount === 0 && activeBill.value.balanceAmount > 0) {
    snackbarStore.show({ message: 'Payment amount must be greater than zero', type: 'error' })
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
    await radiologyStore.processPayment(activeBill.value._id, paymentForm.value)
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

watch([filterStartDate, filterEndDate], () => {
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

const clearFilters = () => {
  filterStartDate.value = ''
  filterEndDate.value = ''
  paymentStatusFilter.value = 'UNPAID'
  searchQuery.value = ''
  currentPage.value = 1
  selectedOrder.value = null
  selectedDetailedOrder.value = null
  fetchOrders()
}

const handleExportPdf = async () => {
  isExportingPdf.value = true
  try {
    const additionalParams = {}
    if (filterStartDate.value) additionalParams.startDate = filterStartDate.value
    if (filterEndDate.value) additionalParams.endDate = filterEndDate.value

    await radiologyStore.fetchOrders(1, 0, searchQuery.value, paymentStatusFilter.value, additionalParams)
    const exportOrders = radiologyStore.orders || []

    if (!exportOrders || exportOrders.length === 0) {
      snackbarStore.show({ message: 'No radiology orders found for the selected criteria to export.', type: 'warning' })
      isExportingPdf.value = false
      return
    }

    let totalRevenue = 0
    let totalPaid = 0
    let totalBalance = 0
    const statusBreakdown = { PAID: 0, UNPAID: 0, PARTIAL: 0, IPD: 0 }

    exportOrders.forEach(o => {
      const amt = o.totalAmount || 0
      const paid = o.paidAmount || (o.paymentStatus === 'PAID' ? amt : 0)
      const balance = o.balanceAmount ?? (o.paymentStatus === 'PAID' ? 0 : amt)
      
      totalRevenue += amt
      totalPaid += paid
      totalBalance += balance

      const st = o.paymentStatus || 'UNPAID'
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1
    })

    let dateRangeText = 'All Time'
    if (filterStartDate.value && filterEndDate.value) {
      dateRangeText = `${filterStartDate.value} to ${filterEndDate.value}`
    } else if (filterStartDate.value) {
      dateRangeText = `From ${filterStartDate.value}`
    } else if (filterEndDate.value) {
      dateRangeText = `Up to ${filterEndDate.value}`
    }

    const statusText = paymentStatusFilter.value || 'All Statuses'

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Revenue & Payment Report - ${new Date().toLocaleDateString('en-IN')}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 14px; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 14px; }
            .header h1 { margin: 0; font-size: 20px; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.8px; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            
            .meta-bar { display: flex; justify-content: space-between; background: #f5f3ff; border: 1px solid #ddd6fe; padding: 8px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 14px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 700; color: #6d28d9; text-transform: uppercase; font-size: 9.5px; }
            .meta-val { font-weight: 600; color: #1e293b; margin-top: 2px; }

            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; text-align: center; }
            .stat-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 14px; font-weight: 800; color: #6d28d9; margin-top: 3px; }

            table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 14px; }
            th { background: #6d28d9; color: #ffffff; text-align: left; padding: 7px 9px; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 7px 9px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; font-family: monospace; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .status-paid { background: #dcfce7; color: #15803d; }
            .status-unpaid { background: #ffe4e6; color: #be123c; }
            .status-partial { background: #fef3c7; color: #b45309; }
            .status-ipd { background: #e0e7ff; color: #3730a3; }

            .summary-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            .summary-table td { padding: 7px 10px; border: 1px solid #cbd5e1; }
            .summary-table .label { font-weight: 700; background: #f1f5f9; text-align: right; width: 75%; }
            .summary-table .value { font-weight: 800; color: #6d28d9; text-align: right; font-size: 13px; font-family: monospace; }

            .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 40px; padding-top: 5px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Radiology Department Billing & Revenue Report</h1>
            <p>Hospital Radiology Orders Register</p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Date Range</span>
              <span class="meta-val">${dateRangeText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Status Filter</span>
              <span class="meta-val">${statusText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Orders</span>
              <span class="meta-val">${exportOrders.length} Orders</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Order Amount</div>
              <div class="stat-value">₹${totalRevenue.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Total Paid</div>
              <div class="stat-value" style="color: #15803d;">₹${totalPaid.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Total Balance Due</div>
              <div class="stat-value" style="color: #be123c;">₹${totalBalance.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Paid / Unpaid Ratio</div>
              <div class="stat-value" style="color: #6d28d9;">${statusBreakdown.PAID || 0} / ${statusBreakdown.UNPAID || 0}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 12%;">Order No</th>
                <th style="width: 12%;">Order Date</th>
                <th style="width: 20%;">Patient Details</th>
                <th style="width: 22%;">Test / Scan Name(s)</th>
                <th style="width: 16%;">Performed By</th>
                <th style="width: 6%; text-align: center;">Status</th>
                <th style="width: 8%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${exportOrders.map((o, idx) => {
                const dt = o.orderDate || o.createdAt ? new Date(o.orderDate || o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
                const st = o.paymentStatus || 'UNPAID'
                const stClass = st === 'PAID' ? 'status-paid' : (st === 'PARTIAL' ? 'status-partial' : (st === 'IPD' ? 'status-ipd' : 'status-unpaid'))
                const pName = o.patientId?.fullName || 'Walk-in Patient'
                const pCode = o.patientId?.patientCode || '-'
                const testNames = (o.items && o.items.length > 0)
                  ? o.items.map(item => item.radiologyTestId?.name || item.name || 'Scan').join(', ')
                  : '-'
                const performedBy = o.performedById?.fullName || '-'

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: bold;">${o.orderNo || '-'}</td>
                    <td>${dt}</td>
                    <td><strong>${pName}</strong><br><span style="color:#64748b; font-size:9.5px;">Code: ${pCode}</span></td>
                    <td><strong style="color: #4338ca;">${testNames}</strong></td>
                    <td>${performedBy}</td>
                    <td class="text-center"><span class="status-badge ${stClass}">${st}</span></td>
                    <td class="amount-col">₹${(o.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="label">Grand Total Radiology Fees (${exportOrders.length} Orders):</td>
              <td class="value">₹${totalRevenue.toFixed(2)}</td>
            </tr>
          </table>

          <div class="footer">
            <div>Report generated automatically by EHMS Radiology Management Module.</div>
            <div class="sig-box">
              <div class="sig-line">Radiology In-Charge / Cashier</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printContent)
    printWin.document.close()

    fetchOrders()
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to export radiology payments PDF report', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

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
        <h1 class="text-2xl font-bold text-slate-900">Radiology Payments</h1>
        <p class="text-slate-500 mt-1 text-sm">Process bills and collect payments for radiology orders.</p>
      </div>
    </div>

    <!-- Main Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Order List -->
      <div class="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
        <!-- List Header -->
        <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-800 self-start">Radiology Orders</h2>
            
            <div class="flex items-center gap-2">
              <!-- Export PDF Button -->
              <button 
                v-if="isSuperAdmin"
                @click="handleExportPdf"
                :disabled="isExportingPdf"
                class="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-violet-700 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <svg v-if="isExportingPdf" class="animate-spin h-3.5 w-3.5 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>

              <!-- Filters Tabs -->
              <div class="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold w-full sm:w-auto">
                <button 
                  @click="paymentStatusFilter = 'UNPAID'"
                  :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'UNPAID' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
                >
                  Pending
                </button>
                <button 
                  @click="paymentStatusFilter = 'PAID'"
                  :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'PAID' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
                >
                  Paid
                </button>
                <button 
                  @click="paymentStatusFilter = 'IPD'"
                  :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === 'IPD' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
                >
                  IPD
                </button>
                <button 
                  @click="paymentStatusFilter = ''"
                  :class="['px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none text-center', paymentStatusFilter === '' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          <!-- Date Range Filters & Reset -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label class="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
              <input 
                v-model="filterStartDate"
                type="date"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
              />
            </div>
            <div>
              <label class="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
              <input 
                v-model="filterEndDate"
                type="date"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
              />
            </div>
            <div class="flex items-end justify-between">
              <button 
                v-if="filterStartDate || filterEndDate || searchQuery || paymentStatusFilter !== 'UNPAID'"
                @click="clearFilters"
                class="px-2.5 py-1.5 text-xs text-slate-500 font-bold hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all cursor-pointer"
              >
                Reset Filters
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
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <!-- Orders Table/List -->
        <div class="flex-grow overflow-y-auto">
          <!-- Skeleton Loading -->
          <table v-if="loading" class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-400 uppercase font-bold border-b border-slate-100 sticky top-0 z-10 text-[11px]">
              <tr>
                <th class="px-6 py-4">Order No</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Patient</th>
                <th class="px-6 py-4 text-right">Amount</th>
                <th class="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="i in 7" :key="i" class="animate-pulse">
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                <td class="px-6 py-4"><div class="h-4 bg-slate-200 rounded w-22"></div></td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-slate-200 rounded w-28 mb-1"></div>
                  <div class="h-3 bg-slate-200 rounded w-16"></div>
                </td>
                <td class="px-6 py-4 text-right"><div class="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                <td class="px-6 py-4 text-center"><div class="h-5 bg-slate-200 rounded w-14 mx-auto"></div></td>
              </tr>
            </tbody>
          </table>

          <!-- Empty state -->
          <div v-else-if="radiologyStore.orders.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400 p-8 py-16">
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
                v-for="order in radiologyStore.orders" 
                :key="order._id"
                @click="handleSelectOrder(order)"
                :class="['hover:bg-slate-50/80 cursor-pointer transition-all', selectedOrder && selectedOrder._id === order._id ? 'bg-violet-50/50 hover:bg-violet-50 font-medium' : '']"
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
        <RadiologyPaymentView 
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
            Please click on any radiology order from the list on the left to see details and process billing.
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
          <div class="bg-violet-50/40 border border-violet-100 p-4 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-500 font-medium">Bill Net Total:</span>
              <p class="font-bold text-slate-800 font-mono text-sm mt-0.5">{{ formatCurrency(activeBill.netAmount) }}</p>
            </div>
            <div>
              <span class="text-slate-500 font-medium">Already Paid:</span>
              <p class="font-bold text-slate-800 font-mono text-sm mt-0.5">{{ formatCurrency(activeBill.paidAmount) }}</p>
            </div>
            <div class="col-span-2 border-t border-violet-100 pt-2 flex justify-between items-center text-sm">
              <span class="font-semibold text-violet-950">Amount Payable:</span>
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
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-slate-700 transition-all shadow-sm"
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
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-slate-700 transition-all shadow-sm"
              />
            </div>

            <!-- Transaction No (Visible if not Cash) -->
            <div v-if="paymentForm.paymentMode !== 'CASH'" class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Transaction ID / Reference No</label>
              <input 
                v-model="paymentForm.transactionNo"
                type="text"
                placeholder="Enter Transaction / Cheque number..."
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-slate-700 transition-all shadow-sm"
              />
            </div>

            <!-- Remarks -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase">Remarks (Optional)</label>
              <textarea 
                v-model="paymentForm.remarks"
                placeholder="Add any internal remarks here..."
                rows="2"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 text-slate-700 transition-all shadow-sm resize-none"
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

<style scoped>
</style>
