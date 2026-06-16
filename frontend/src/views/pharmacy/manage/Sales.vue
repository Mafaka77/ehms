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

// Selected sale details for printing modal
const showReceiptModal = ref(false)
const selectedSale = ref(null)
const selectedSaleItems = ref([])

// Form state for creating a sale
const isWalkIn = ref(true)
const patientSearchQuery = ref('')
const selectedPatient = ref(null)
const customerName = ref('')
const customerPhone = ref('')
const remarks = ref('')

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
    await pharmacyStore.fetchSales(currentPage.value, limit.value, searchQuery.value)
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

watch([currentPage, limit], () => {
  fetchSalesLog()
})

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
      totalAmount: draftTotal.value,
      remarks: remarks.value.trim() || null,
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
  remarks.value = ''
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
        <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 class="text-base font-bold text-slate-800">Dispensation & Billing History</h3>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <!-- Search -->
            <div class="relative w-full sm:w-64">
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
            <!-- Create Bill Button -->
            <button 
              v-if="authStore.hasPermission('supplier.create')"
              @click="currentView = 'create'"
              class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-teal-100 transition-all flex items-center gap-2 transform active:scale-95 shrink-0"
            >
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              New Sale
            </button>
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
                    class="bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 hover:text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95"
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
