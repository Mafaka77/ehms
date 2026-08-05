<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { usePatientStore } from '../../../stores/patientStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import BaseInput from '../../../components/BaseInput.vue'
import BaseSelect from '../../../components/BaseSelect.vue'
import SalesReceiptModal from './SalesReceipt.vue'

const pharmacyStore = usePharmacyStore()
const patientStore = usePatientStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

// View toggles: 'list' or 'create'
const currentView = ref('list')

// Search/Pagination for Dispensation Log List
const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterPaymentMethod = ref('')
const isExportingPdf = ref(false)

// Selected sale details for printing modal
const showReceiptModal = ref(false)
const selectedSale = ref(null)
const selectedSaleItems = ref([])

// Form state for creating a sale
const isWalkIn = ref(true)
const patientSearchQuery = ref('')
const selectedPatient = ref(null)
const customerName = ref('Customer')
const customerPhone = ref('')
const customerAddress = ref('')
const remarks = ref('')
const paymentMethod = ref('CASH')

const isSaving = ref(false)

// Medicine Search & Selection inside Billing
const medSearchQuery = ref('')
const matchingMedicines = ref([])
const selectedMedicine = ref(null)
const availableBatches = ref([])
const selectedBatch = ref(null)
const selectedQty = ref(1)
const selectedRate = ref(0)

// Draft list of items for the new sale
const draftItems = ref([])

// Fetch sales log on mount/change
const fetchSalesLog = async () => {
  try {
    const additionalParams = {}
    if (filterStartDate.value) additionalParams.startDate = filterStartDate.value
    if (filterEndDate.value) additionalParams.endDate = filterEndDate.value
    if (filterPaymentMethod.value) additionalParams.paymentMethod = filterPaymentMethod.value

    await pharmacyStore.fetchSales(currentPage.value, limit.value, searchQuery.value, additionalParams)
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchSalesLog()
})

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchSalesLog()
  }, 400)
})

watch([filterStartDate, filterEndDate, filterPaymentMethod], () => {
  currentPage.value = 1
  fetchSalesLog()
})

watch([currentPage, limit], () => {
  fetchSalesLog()
})

const clearFilters = () => {
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterPaymentMethod.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  fetchSalesLog()
}

const handleExportPdf = async () => {
  isExportingPdf.value = true
  try {
    const additionalParams = {}
    if (filterStartDate.value) additionalParams.startDate = filterStartDate.value
    if (filterEndDate.value) additionalParams.endDate = filterEndDate.value
    if (filterPaymentMethod.value) additionalParams.paymentMethod = filterPaymentMethod.value

    const exportSales = await pharmacyStore.fetchSales(1, 0, searchQuery.value, additionalParams)

    if (!exportSales || exportSales.length === 0) {
      snackbarStore.show({ message: 'No sales records found for the selected criteria to export.', type: 'warning' })
      isExportingPdf.value = false
      return
    }

    let totalAmountSum = 0
    const modeBreakdown = {}

    exportSales.forEach(s => {
      const amt = s.totalAmount || 0
      totalAmountSum += amt
      const mode = s.paymentMethod || 'CASH'
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + amt
    })

    let dateRangeText = 'All Time'
    if (filterStartDate.value && filterEndDate.value) {
      dateRangeText = `${filterStartDate.value} to ${filterEndDate.value}`
    } else if (filterStartDate.value) {
      dateRangeText = `From ${filterStartDate.value}`
    } else if (filterEndDate.value) {
      dateRangeText = `Up to ${filterEndDate.value}`
    }

    const modeText = filterPaymentMethod.value || 'All Payment Modes'

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pharmacy Sales Report - ${new Date().toLocaleDateString('en-IN')}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 22px; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
            
            .meta-bar { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #ccfbf1; padding: 12px 16px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 700; color: #0f766e; text-transform: uppercase; font-size: 10px; }
            .meta-val { font-weight: 600; color: #1e293b; margin-top: 2px; }

            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; text-align: center; }
            .stat-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 15px; font-weight: 800; color: #0f766e; margin-top: 4px; }

            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
            th { background: #0f766e; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; }
            .mode-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #e0f2fe; color: #0369a1; text-transform: uppercase; }
            
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            .summary-table td { padding: 8px 12px; border: 1px solid #cbd5e1; }
            .summary-table .label { font-weight: 700; background: #f1f5f9; text-align: right; width: 80%; }
            .summary-table .value { font-weight: 800; color: #0f766e; text-align: right; font-size: 14px; }

            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 180px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 50px; padding-top: 6px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pharmacy Sales & Revenue Report</h1>
            <p>Hospital Inpatient & Outpatient Pharmacy Dispensation Register</p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Date Range</span>
              <span class="meta-val">${dateRangeText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Payment Mode</span>
              <span class="meta-val">${modeText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Invoices</span>
              <span class="meta-val">${exportSales.length} Sales</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Sales Revenue</div>
              <div class="stat-value">₹${totalAmountSum.toFixed(2)}</div>
            </div>
            ${Object.entries(modeBreakdown).map(([m, val]) => `
              <div class="stat-card">
                <div class="stat-title">${m} Total</div>
                <div class="stat-value">₹${val.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 15%;">Invoice No</th>
                <th style="width: 25%;">Customer / Patient</th>
                <th style="width: 15%;">Date & Time</th>
                <th style="width: 15%;">Payment Mode</th>
                <th style="width: 25%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${exportSales.map((s, idx) => {
                const pName = s.patientId ? `${s.patientId.fullName} (Patient)` : (s.customerName || 'Walk-in Customer')
                const dt = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: bold;">${s.saleNo || '-'}</td>
                    <td><strong>${pName}</strong>${s.customerPhone ? '<br><span style="color:#64748b; font-size:10px;">Mob: ' + s.customerPhone + '</span>' : ''}</td>
                    <td>${dt}</td>
                    <td><span class="mode-badge">${s.paymentMethod || 'CASH'}</span></td>
                    <td class="amount-col">₹${(s.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="label">Grand Total Pharmacy Sales (${exportSales.length} Invoices):</td>
              <td class="value">₹${totalAmountSum.toFixed(2)}</td>
            </tr>
          </table>

          <div class="footer">
            <div>Report generated automatically by EHMS Pharmacy Management Module.</div>
            <div class="sig-box">
              <div class="sig-line">Pharmacist / Admin Signature</div>
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

    fetchSalesLog()
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to export sales PDF report', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

// Patient Search
let patientDebounce = null
const handlePatientSearch = () => {
  if (patientDebounce) clearTimeout(patientDebounce)
  if (!patientSearchQuery.value || patientSearchQuery.value.length < 3) {
    patientStore.searchResults = []
    return
  }
  patientDebounce = setTimeout(async () => {
    await patientStore.searchPatients(patientSearchQuery.value)
  }, 300)
}

const selectPatient = (patient) => {
  selectedPatient.value = patient
  patientSearchQuery.value = ''
  patientStore.searchResults = []
}

const clearSelectedPatient = () => {
  selectedPatient.value = null
}

// Medicine Search
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
      selectedRate.value = selectedBatch.value.saleRate || 0
      selectedQty.value = 1
    } else {
      selectedBatch.value = null
      selectedRate.value = 0
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
    selectedRate.value = newBatch.saleRate || 0
    selectedQty.value = 1
  }
})

// Add item to draft invoice
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
  const exists = draftItems.value.find(item => item.batchId === selectedBatch.value._id)
  if (exists) {
    if (exists.quantity + selectedQty.value > selectedBatch.value.currentStock) {
      snackbarStore.show({ message: `Total draft quantity exceeds batch stock limit (${selectedBatch.value.currentStock})`, type: 'error' })
      return
    }
    exists.quantity += selectedQty.value
    exists.amount = exists.quantity * exists.rate
  } else {
    draftItems.value.push({
      medicineId: selectedMedicine.value._id,
      medicineName: selectedMedicine.value.medicineName,
      brandName: selectedMedicine.value.brandName,
      strength: selectedMedicine.value.strength,
      dosageForm: selectedMedicine.value.dosageForm,
      batchId: selectedBatch.value._id,
      batchNo: selectedBatch.value.batchNo,
      expiryDate: selectedBatch.value.expiryDate,
      quantity: selectedQty.value,
      rate: selectedRate.value,
      amount: selectedQty.value * selectedRate.value
    })
  }

  // Clear selections
  selectedMedicine.value = null
  availableBatches.value = []
  selectedBatch.value = null
  selectedQty.value = 1
  selectedRate.value = 0
}

const removeDraftItem = (index) => {
  draftItems.value.splice(index, 1)
}

// Calculate totals
const draftTotal = computed(() => {
  return draftItems.value.reduce((sum, item) => sum + item.amount, 0)
})

// Dispensation Stats (aggregated locally for simplicity)
const totalSalesVal = computed(() => {
  return pharmacyStore.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
})

// Create and save Sale invoice
const handleGenerateBill = async () => {
  if (draftItems.value.length === 0) {
    snackbarStore.show({ message: 'Please add at least one medicine to the bill', type: 'error' })
    return
  }
  if (!isWalkIn.value && !selectedPatient.value) {
    snackbarStore.show({ message: 'Please select a patient or toggle Walk-in mode', type: 'error' })
    return
  }
  if (isWalkIn.value && !customerName.value.trim()) {
    snackbarStore.show({ message: 'Customer name is required for Walk-in sales', type: 'error' })
    return
  }

  isSaving.value = true
  try {
    const payload = {
      patientId: isWalkIn.value ? null : selectedPatient.value._id,
      customerName: isWalkIn.value ? customerName.value.trim() : null,
      customerPhone: isWalkIn.value ? customerPhone.value.trim() : null,
      customerAddress: isWalkIn.value ? customerAddress.value.trim() : null,
      totalAmount: draftTotal.value,
      remarks: remarks.value.trim() || null,
      paymentMethod: paymentMethod.value,
      items: draftItems.value.map(item => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }))
    }

    const res = await pharmacyStore.createSale(payload)
    if (res.success) {
      snackbarStore.show({ message: res.message, type: 'success' })
      
      // Auto-load print preview modal
      const details = await pharmacyStore.fetchSaleById(res.data._id)
      if (details.success) {
        selectedSale.value = details.data
        selectedSaleItems.value = details.items
        showReceiptModal.value = true
      }
      
      // Reset bill inputs & go back
      resetBillForm()
      currentView.value = 'list'
      fetchSalesLog()
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to complete transaction', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

const resetBillForm = () => {
  isWalkIn.value = true
  selectedPatient.value = null
  patientSearchQuery.value = ''
  customerName.value = ''
  customerPhone.value = ''
  customerAddress.value = ''
  remarks.value = ''
  paymentMethod.value = 'CASH'
  draftItems.value = []
  medSearchQuery.value = ''
  matchingMedicines.value = []
  selectedMedicine.value = null
  availableBatches.value = []
  selectedBatch.value = null
  selectedQty.value = 1
  selectedRate.value = 0
}

const handleViewSale = async (sale) => {
  try {
    const res = await pharmacyStore.fetchSaleById(sale._id)
    if (res.success) {
      selectedSale.value = res.data
      selectedSaleItems.value = res.items
      showReceiptModal.value = true
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- STATS / LOG VIEW -->
    <div v-if="currentView === 'list'" class="space-y-6">
      <!-- Stats Banner -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-2xl p-6 shadow-lg shadow-teal-100/40 relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 opacity-15">
            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
          </div>
          <span class="text-teal-100 text-xs font-bold tracking-wider uppercase block">Today's Transactions</span>
          <span class="text-3xl font-extrabold mt-1 block">₹{{ totalSalesVal.toFixed(2) }}</span>
          <span class="text-teal-200 text-xs font-medium mt-2 block">Based on {{ pharmacyStore.salesPagination.total }} dispenses</span>
        </div>

        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Dispensed Items</span>
            <span class="text-2xl font-extrabold text-slate-800 mt-1 block">Active Billing Log</span>
            <span class="text-teal-600 text-xs font-semibold mt-1 block">Standard OPD & walk-in sales</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Procurement Status</span>
            <span class="text-2xl font-extrabold text-slate-800 mt-1 block">Instant Invoicing</span>
            <span class="text-teal-600 text-xs font-semibold mt-1 block">Thermal layout configuration active</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          </div>
        </div>
      </div>

      <!-- Dispensation Log Table Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-5 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 class="text-base font-bold text-slate-800">Dispensation & Billing History</h3>
            <div class="flex items-center gap-3 w-full lg:w-auto">
              <!-- Search -->
              <div class="relative w-full lg:w-64">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search by Invoice No, Customer Name..." 
                  class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
                />
              </div>

              <!-- Export PDF Button -->
              <button 
                @click="handleExportPdf"
                :disabled="isExportingPdf"
                class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <svg v-if="isExportingPdf" class="animate-spin h-4 w-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>

              <!-- Create Bill Button -->
              <button 
                v-if="authStore.hasPermission('supplier.create')"
                @click="currentView = 'create'"
                class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-teal-100 transition-all flex items-center gap-2 transform active:scale-95 shrink-0 cursor-pointer"
              >
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Sale
              </button>
            </div>
          </div>

          <!-- Date Range & Payment Method Filters Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
              <input 
                v-model="filterStartDate"
                type="date"
                class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
              <input 
                v-model="filterEndDate"
                type="date"
                class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Mode</label>
              <select 
                v-model="filterPaymentMethod"
                class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              >
                <option value="">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <button 
                v-if="filterStartDate || filterEndDate || filterPaymentMethod"
                @click="clearFilters"
                class="px-3 py-1.5 text-xs text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="pharmacyStore.loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg class="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm font-semibold">Fetching logs...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="pharmacyStore.sales.length === 0" class="py-20 text-center">
          <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-slate-700 font-semibold text-base">No sale logs found</p>
          <p class="text-slate-400 text-xs mt-1">Dispense items to register records in the billing database.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Invoice No</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Patient / Customer Details</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Payment Mode</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Total Bill Amount</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Remarks / Note</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Date & Time</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="sale in pharmacyStore.sales" :key="sale._id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-800 text-sm font-mono">{{ sale.saleNo }}</td>
                <td class="px-6 py-4">
                  <div v-if="sale.patientId">
                    <span class="font-bold text-slate-800 text-sm">{{ sale.patientId.fullName }}</span>
                    <span class="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded ml-1.5">PATIENT</span>
                    <div class="text-[10px] text-slate-500 mt-0.5">Code: {{ sale.patientId.patientCode }} | Mob: {{ sale.patientId.mobileNo }}</div>
                  </div>
                  <div v-else>
                    <span class="font-bold text-slate-800 text-sm">{{ sale.customerName || 'Walk-in Customer' }}</span>
                    <span class="text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded ml-1.5">WALK-IN</span>
                    <div v-if="sale.customerPhone" class="text-[10px] text-slate-500 mt-0.5">Mob: {{ sale.customerPhone }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-700 text-xs">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase">
                    {{ sale.paymentMethod || 'CASH' }}
                  </span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-900 text-sm">
                  ₹{{ sale.totalAmount?.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                  {{ sale.remarks || '—' }}
                </td>
                <td class="px-6 py-4 text-slate-500 text-xs font-semibold">
                  {{ formatDate(sale.createdAt) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <button 
                    @click="handleViewSale(sale)"
                    class="bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 hover:text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 cursor-pointer"
                  >
                    View Invoice
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div 
          v-if="pharmacyStore.salesPagination.total > 0" 
          class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span class="text-xs text-slate-500 font-medium">
            Showing 
            <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
            to 
            <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, pharmacyStore.salesPagination.total) }}</span> 
            of 
            <span class="text-slate-800 font-semibold">{{ pharmacyStore.salesPagination.total }}</span> 
            entries
          </span>

          <div v-if="pharmacyStore.salesPagination.pages > 1" class="flex items-center gap-2">
            <button 
              @click="currentPage > 1 && currentPage--"
              :disabled="currentPage === 1"
              class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              v-for="page in pharmacyStore.salesPagination.pages" 
              :key="page"
              @click="currentPage = page"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
              :class="currentPage === page ? 'bg-teal-600 text-white font-bold shadow-lg shadow-teal-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              {{ page }}
            </button>
            <button 
              @click="currentPage < pharmacyStore.salesPagination.pages && currentPage++"
              :disabled="currentPage === pharmacyStore.salesPagination.pages"
              class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BILL REGISTER / NEW SALE CREATION -->
    <div v-else-if="currentView === 'create'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- LHS: Customer Selection & Medicine search / Draft inputs (2 columns) -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Patient Search & Selection Card -->
        <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-800">1. Customer / Patient Details</h3>
            
            <div class="flex items-center gap-2 select-none">
              <input 
                id="isWalkIn" 
                type="checkbox" 
                v-model="isWalkIn" 
                class="w-4 h-4 text-teal-600 bg-slate-50 border-slate-200 rounded focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer"
              >
              <label for="isWalkIn" class="text-xs font-bold text-slate-700 cursor-pointer">Walk-in Customer</label>
            </div>
          </div>

          <!-- Registered Patient Search View -->
          <div v-if="!isWalkIn" class="space-y-4">
            <div v-if="!selectedPatient" class="space-y-1.5 relative">
              <label class="block text-xs font-bold text-slate-750">Search Clinic Patient Record</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="patientSearchQuery"
                  @input="handlePatientSearch"
                  type="text" 
                  placeholder="Enter patient name, mobile, or hospital code (min 3 characters)..."
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-55/20 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <!-- Patient Dropdown Results -->
              <div v-if="patientStore.searchResults.length > 0" class="absolute z-30 w-full mt-1.5 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-50">
                <div 
                  v-for="patient in patientStore.searchResults" 
                  :key="patient._id"
                  @click="selectPatient(patient)"
                  class="px-4 py-2.5 hover:bg-teal-50/50 cursor-pointer flex justify-between items-center text-xs"
                >
                  <div>
                    <p class="font-bold text-slate-800">{{ patient.fullName }} <span class="font-medium text-slate-500 ml-1">({{ patient.gender }}, {{ patient.age }}y)</span></p>
                    <p class="text-[10px] text-slate-400 mt-0.5"><span class="font-mono">{{ patient.patientCode }}</span> | Mob: {{ patient.mobileNo }}</p>
                  </div>
                  <button class="text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg font-bold">Select</button>
                </div>
              </div>
            </div>

            <!-- Selected Patient Summary -->
            <div v-else class="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-teal-600 text-white font-bold rounded-lg flex items-center justify-center shadow-inner">
                  {{ selectedPatient.fullName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-xs font-bold text-teal-900">{{ selectedPatient.fullName }}</p>
                  <p class="text-[10px] text-teal-600 font-semibold font-mono">{{ selectedPatient.patientCode }} | Mob: {{ selectedPatient.mobileNo }}</p>
                </div>
              </div>
              <button 
                @click="clearSelectedPatient"
                class="text-xs text-rose-600 font-bold hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Walk-in Customer View -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model="customerName" id="customerName" label="Customer Name *" placeholder="e.g. John Doe" required />
            <BaseInput v-model="customerPhone" id="customerPhone" label="Contact Number" placeholder="e.g. 9876543210" />
            <div class="sm:col-span-2">
              <BaseInput v-model="customerAddress" id="customerAddress" label="Address" placeholder="e.g. 123 Main St" />
            </div>
          </div>
        </div>

        <!-- Medicine Cart Form -->
        <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
          <h3 class="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">2. Select & Dispense Medicines</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Search Medicine -->
            <div class="space-y-1.5 relative">
              <label class="block text-xs font-bold text-slate-700">Search Medicine *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  v-model="medSearchQuery"
                  @input="handleMedicineSearch"
                  type="text" 
                  placeholder="Type name, brand or formula (min 2 chars)..."
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-55/20 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 focus:bg-white transition-all shadow-inner"
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
                    <p class="font-bold text-slate-800">{{ med.medicineName }} <span v-if="med.brandName" class="text-slate-500 font-medium">({{ med.brandName }})</span></p>
                    <p class="text-[10px] text-slate-400 mt-0.5">{{ med.dosageForm }} • Stock: {{ med.currentStock }} ({{ med.unit }})</p>
                  </div>
                  <button class="text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg font-bold">Add</button>
                </div>
              </div>
            </div>

            <!-- Select Batch -->
            <div class="space-y-1.5">
              <label for="batchSelect" class="block text-xs font-bold text-slate-700">Stock Batch *</label>
              <select 
                v-model="selectedBatch"
                id="batchSelect"
                :disabled="!selectedMedicine"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
              >
                <option :value="null" disabled>Select Stock Batch</option>
                <option v-for="batch in availableBatches" :key="batch._id" :value="batch">
                  {{ batch.batchNo }} | Exp: {{ new Date(batch.expiryDate).toLocaleDateString('en-US', {month: 'short', year:'2-digit'}) }} | Qty: {{ batch.currentStock }} | ₹{{ batch.saleRate }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedMedicine" class="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div class="sm:col-span-2 space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400">Selected Medicine</span>
              <p class="text-xs font-bold text-slate-800">{{ selectedMedicine.medicineName }}</p>
              <p class="text-[10px] text-slate-500">{{ selectedMedicine.dosageForm }} ({{ selectedMedicine.strength || 'No Strength' }})</p>
            </div>

            <BaseInput 
              v-model.number="selectedQty"
              id="selectedQty"
              label="Dispense Qty *"
              type="number"
              min="1"
              :max="selectedBatch?.currentStock || 1"
              required
            />

            <button 
              @click="addDraftItem"
              type="button"
              class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-teal-50 transform active:scale-95 flex items-center justify-center gap-1 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              Add to Bill
            </button>
          </div>
        </div>

        <!-- Bill Draft List Card -->
        <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 class="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">Draft Invoicing List</h3>

          <div v-if="draftItems.length === 0" class="py-12 text-center border border-dashed border-slate-100 rounded-xl">
            <svg class="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p class="text-slate-700 font-bold text-xs">No medicines added to bill yet</p>
            <p class="text-slate-400 text-[10px] mt-0.5">Search and select items above to start drafting the bill.</p>
          </div>

          <div v-else class="overflow-x-auto border border-slate-100 rounded-xl">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider">Item Details</th>
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider text-center">Batch No</th>
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider text-right">Rate</th>
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider text-right">Quantity</th>
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider text-right">Amount</th>
                  <th class="text-slate-500 font-semibold px-4 py-3 tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(item, index) in draftItems" :key="item.batchId" class="hover:bg-slate-50/40">
                  <td class="px-4 py-3">
                    <div class="font-bold text-slate-800">{{ item.medicineName }}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      <span class="font-semibold">{{ item.brandName || 'Generics' }}</span> | Form: {{ item.dosageForm }} ({{ item.strength || '—' }})
                    </div>
                  </td>
                  <td class="px-4 py-3 font-mono font-bold text-center text-slate-700 text-[11px]">{{ item.batchNo }}</td>
                  <td class="px-4 py-3 text-right font-medium text-slate-700">₹{{ item.rate?.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-slate-800">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-right font-bold text-teal-700">₹{{ item.amount?.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-center">
                    <button 
                      @click="removeDraftItem(index)"
                      class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                      title="Remove Item"
                    >
                      <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- RHS: Summary & Generate Actions (1 column) -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h3 class="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">3. Invoice Summary</h3>
          
          <div class="space-y-4">
            <!-- Summary breakdown -->
            <div class="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Billed Items</span>
                <span class="font-bold text-slate-850">{{ draftItems.length }} Medicines</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Total Quantity</span>
                <span class="font-bold text-slate-850">
                  {{ draftItems.reduce((sum, item) => sum + item.quantity, 0) }} Units
                </span>
              </div>
              <div class="border-t border-dashed border-slate-200 pt-3 flex justify-between text-sm">
                <span class="text-slate-900 font-extrabold uppercase tracking-wide">Grand Total</span>
                <span class="font-black text-teal-700">₹{{ draftTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="space-y-1.5 mb-3">
              <label for="paymentMethod" class="block text-xs font-bold text-slate-700">Payment Method</label>
              <select 
                v-model="paymentMethod"
                id="paymentMethod"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <!-- Remarks Input -->
            <div class="space-y-1.5">
              <label for="remarks" class="block text-xs font-bold text-slate-700">Remarks / Dispensation Note</label>
              <textarea 
                v-model="remarks"
                id="remarks"
                rows="3"
                placeholder="Prescription compliance details, storage note, etc."
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
              ></textarea>
            </div>

            <!-- Submit Buttons -->
            <div class="space-y-3 pt-2">
              <button 
                @click="handleGenerateBill"
                :disabled="isSaving"
                class="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-teal-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>{{ isSaving ? 'Processing Invoice...' : 'Generate Bill & Dispense' }}</span>
              </button>

              <button 
                @click="currentView = 'list'; resetBillForm()"
                :disabled="isSaving"
                class="w-full bg-white border border-slate-250 hover:bg-slate-50 text-slate-750 py-3 rounded-xl font-bold text-xs transition-all focus:outline-none"
              >
                Cancel Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SALES RECEIPT / PRINT MODAL -->
    <SalesReceiptModal 
      :show="showReceiptModal"
      :sale="selectedSale"
      :items="selectedSaleItems"
      @close="showReceiptModal = false"
    />
  </div>
</template>
