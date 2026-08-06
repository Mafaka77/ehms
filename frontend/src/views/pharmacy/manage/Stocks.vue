<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import CreateMedicineModal from './CreateMedicine.vue'
import ManageBatchesModal from './ManageBatches.vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const isSuperAdmin = computed(() => {
  const r = authStore.user?.roleName || authStore.user?.role?.name
  return r === 'SuperAdmin'
})

const isCreateModalOpen = ref(false)
const selectedMedicine = ref(null)

const isBatchModalOpen = ref(false)
const batchSelectedMedicine = ref(null)

const openBatchModal = (med) => {
  batchSelectedMedicine.value = med
  isBatchModalOpen.value = true
}

const handleBatchModalClose = () => {
  isBatchModalOpen.value = false
  fetchMedicines()
}

const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const stockStatusFilter = ref('') // '', 'reorder', 'low', 'out', 'in_stock'
const isExportingPdf = ref(false)

const fetchMedicines = async () => {
  try {
    await pharmacyStore.fetchMedicines(currentPage.value, limit.value, searchQuery.value, '', '', '', stockStatusFilter.value)
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedMedicine.value = null
  isCreateModalOpen.value = true
}

const openEditModal = (med) => {
  selectedMedicine.value = med
  isCreateModalOpen.value = true
}

const handleMedicineCreated = (newMed) => {
  if (currentPage.value === 1) {
    if (pharmacyStore.medicines.length > limit.value) {
      pharmacyStore.medicines.pop()
    }
    if (pharmacyStore.medicinePagination) {
      pharmacyStore.medicinePagination.total++
    }
  } else {
    fetchMedicines()
  }
}

const handleMedicineUpdated = (updatedMed) => {
  fetchMedicines()
}

const handleDelete = async (med) => {
  if (confirm(`Are you sure you want to delete "${med.medicineName}" from inventory?`)) {
    const res = await pharmacyStore.deleteMedicine(med._id)
    if (res.success) {
      snackbarStore.show({ message: res.message, type: 'success' })
      if (pharmacyStore.medicines.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchMedicines()
      }
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  }
}

const handleExportPdf = async () => {
  isExportingPdf.value = true
  try {
    const exportList = await pharmacyStore.fetchAllMedicinesForExport(searchQuery.value, stockStatusFilter.value)
    
    if (!exportList || exportList.length === 0) {
      snackbarStore.show({ message: 'No medicines found to export.', type: 'warning' })
      isExportingPdf.value = false
      return
    }

    let totalItems = exportList.length
    let totalStockQty = 0
    let lowStockItems = 0
    let outOfStockItems = 0

    exportList.forEach(m => {
      totalStockQty += (m.currentStock || 0)
      if (m.currentStock === 0) outOfStockItems++
      else if (m.currentStock <= m.reorderLevel) lowStockItems++
    })

    let filterLabel = 'All Inventory'
    if (stockStatusFilter.value === 'reorder') filterLabel = 'Reorder Needed (Stock ≤ Reorder Level)'
    else if (stockStatusFilter.value === 'low') filterLabel = 'Low Stock Alert'
    else if (stockStatusFilter.value === 'out') filterLabel = 'Out of Stock Items'
    else if (stockStatusFilter.value === 'in_stock') filterLabel = 'In Stock Items'

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pharmacy Stock Details Report - ${new Date().toLocaleDateString('en-IN')}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 18px; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 20px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.8px; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            
            .meta-bar { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #ccfbf1; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 16px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 700; color: #0f766e; text-transform: uppercase; font-size: 9.5px; }
            .meta-val { font-weight: 600; color: #1e293b; margin-top: 2px; }

            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; text-align: center; }
            .stat-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 14px; font-weight: 800; color: #0f766e; margin-top: 3px; }

            table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
            th { background: #0f766e; color: #ffffff; text-align: left; padding: 7px 9px; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 7px 9px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; font-family: monospace; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .status-instock { background: #dcfce7; color: #15803d; }
            .status-low { background: #fef3c7; color: #b45309; }
            .status-out { background: #ffe4e6; color: #be123c; }

            .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pharmacy Inventory & Stock Status Report</h1>
            <p>Hospital Pharmacy Stock Register</p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Stock Filter</span>
              <span class="meta-val">${filterLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Search Query</span>
              <span class="meta-val">${searchQuery.value || 'None'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Medicines</span>
              <span class="meta-val">${totalItems} Items</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Items</div>
              <div class="stat-value">${totalItems}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Total Stock Units</div>
              <div class="stat-value">${totalStockQty}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Low Stock Items</div>
              <div class="stat-value" style="color: #b45309;">${lowStockItems}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Out of Stock Items</div>
              <div class="stat-value" style="color: #be123c;">${outOfStockItems}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Code</th>
                <th style="width: 26%;">Medicine Name</th>
                <th style="width: 18%;">Category</th>
                <th style="width: 12%;">Form / Strength</th>
                <th style="width: 10%; text-align: right;">Stock Qty</th>
                <th style="width: 8%; text-align: right;">Reorder</th>
                <th style="width: 8%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${exportList.map((m, idx) => {
                const st = m.currentStock === 0 ? 'Out of Stock' : (m.currentStock <= m.reorderLevel ? 'Low Stock' : 'In Stock')
                const stClass = m.currentStock === 0 ? 'status-out' : (m.currentStock <= m.reorderLevel ? 'status-low' : 'status-instock')
                const catName = m.categoryId?.name || '—'
                const formStr = `${m.dosageForm || 'TABLET'}${m.strength ? ' (' + m.strength + ')' : ''}`

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: bold;">${m.medicineCode || '-'}</td>
                    <td><strong>${m.medicineName}</strong><br><span style="color:#64748b; font-size:9.5px;">${m.genericName || ''}</span></td>
                    <td>${catName}</td>
                    <td>${formStr}</td>
                    <td class="amount-col">${m.currentStock}</td>
                    <td class="amount-col">${m.reorderLevel}</td>
                    <td style="text-align: center;"><span class="status-badge ${stClass}">${st}</span></td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Report generated automatically by EHMS Pharmacy Management System.</div>
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
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to export stock details PDF report', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchMedicines()
  }, 400)
})

watch(stockStatusFilter, () => {
  currentPage.value = 1
  fetchMedicines()
})

watch([currentPage, limit], () => {
  fetchMedicines()
})

onMounted(() => {
  fetchMedicines()
})

// Local calculated counts from pharmacyStore stockSummary
const totalItemsCount = computed(() => pharmacyStore.stockSummary?.totalItems || pharmacyStore.medicinePagination.total || 0)
const lowStockCount = computed(() => pharmacyStore.stockSummary?.lowStockCount || 0)
const outOfStockCount = computed(() => pharmacyStore.stockSummary?.outOfStockCount || 0)
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Banner -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        @click="stockStatusFilter = ''" 
        :class="['bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between cursor-pointer transition-all', stockStatusFilter === '' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-100 hover:border-teal-200']"
      >
        <div>
          <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Total Medicines</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">
            {{ totalItemsCount }} Items
          </span>
          <span class="text-teal-600 text-xs font-semibold mt-1 block">In pharmacy stock</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-2 0h-2"/></svg>
        </div>
      </div>

      <div 
        @click="stockStatusFilter = 'low'" 
        :class="['bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between cursor-pointer transition-all', stockStatusFilter === 'low' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-100 hover:border-amber-200']"
      >
        <div>
          <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Low Stock Alert</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">
            {{ lowStockCount }} Medicines
          </span>
          <span class="text-amber-600 text-xs font-semibold mt-1 block">Below reorder levels</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
      </div>

      <div 
        @click="stockStatusFilter = 'out'" 
        :class="['bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between cursor-pointer transition-all', stockStatusFilter === 'out' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-100 hover:border-rose-200']"
      >
        <div>
          <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Out of Stock</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">
            {{ outOfStockCount }} Medicines
          </span>
          <span class="text-rose-600 text-xs font-semibold mt-1 block">Immediate procurement needed</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>

    <!-- Stocks Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 class="text-base font-bold text-slate-800">Inventory Directory</h3>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- Stock Filter Dropdown / Tabs -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button 
              @click="stockStatusFilter = ''"
              :class="['px-3 py-1.5 rounded-lg transition-all cursor-pointer', stockStatusFilter === '' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
            >
              All
            </button>
            <button 
              @click="stockStatusFilter = 'in_stock'"
              :class="['px-3 py-1.5 rounded-lg transition-all cursor-pointer', stockStatusFilter === 'in_stock' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
            >
              In Stock
            </button>
            <button 
              @click="stockStatusFilter = 'reorder'"
              :class="['px-3 py-1.5 rounded-lg transition-all cursor-pointer', stockStatusFilter === 'reorder' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
            >
              Needs Reorder
            </button>
            <button 
              @click="stockStatusFilter = 'low'"
              :class="['px-3 py-1.5 rounded-lg transition-all cursor-pointer', stockStatusFilter === 'low' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
            >
              Low Stock
            </button>
            <button 
              @click="stockStatusFilter = 'out'"
              :class="['px-3 py-1.5 rounded-lg transition-all cursor-pointer', stockStatusFilter === 'out' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
            >
              Out of Stock
            </button>
          </div>

          <!-- Search -->
          <div class="relative w-full sm:w-60">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by name, code..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
            />
          </div>

          <!-- Export PDF Button (SuperAdmin Only) -->
          <button 
            v-if="isSuperAdmin"
            @click="handleExportPdf"
            :disabled="isExportingPdf"
            class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <svg v-if="isExportingPdf" class="animate-spin h-3.5 w-3.5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Stock List
          </button>

          <!-- Register Button -->
          <button 
            v-if="authStore.hasPermission('supplier.create')"
            @click="openAddModal"
            class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-teal-100 transition-all flex items-center gap-2 transform active:scale-95 shrink-0 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Add Medicine
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pharmacyStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading inventory...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="pharmacyStore.medicines.length === 0" class="py-24 text-center">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p class="text-slate-700 font-semibold text-base">No medicines found</p>
        <p class="text-slate-400 text-xs mt-1 max-w-xs mx-auto">Try modifying your search query or stock filter.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Medicine</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Category</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Dosage Form</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Stock Qty</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Sale Rate</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="med in pharmacyStore.medicines" :key="med._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800 text-sm">{{ med.medicineName }}</div>
                <div class="text-[10px] font-semibold text-slate-400 font-mono">{{ med.medicineCode }}</div>
                <div v-if="med.genericName" class="text-[10px] text-slate-500 mt-0.5">Formula: {{ med.genericName }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700 text-sm font-medium">
                {{ med.categoryId?.name || '—' }}
              </td>
              <td class="px-6 py-4 text-slate-600 text-sm">
                <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 rounded-md text-slate-600">
                  {{ med.dosageForm || 'TABLET' }}
                </span>
                <span v-if="med.strength" class="text-xs text-slate-500 font-medium ml-1">
                  ({{ med.strength }})
                </span>
              </td>
              <td class="px-6 py-4 font-bold text-slate-800 text-sm">
                {{ med.currentStock }}
                <span class="text-[10px] font-semibold text-slate-400 block mt-0.5">Reorder at {{ med.reorderLevel }}</span>
              </td>
              <td class="px-6 py-4 text-slate-800 font-bold text-sm">
                ₹{{ med.saleRate?.toFixed(2) }}
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="med.currentStock === 0" class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-rose-50 text-rose-700 border-rose-100">
                  Out of Stock
                </span>
                <span v-else-if="med.currentStock <= med.reorderLevel" class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-amber-50 text-amber-700 border-amber-100">
                  Low Stock
                </span>
                <span v-else class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
                  In Stock
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    v-if="authStore.hasPermission('supplier.update')"
                    @click="openBatchModal(med)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer"
                    title="Manage Batches"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('supplier.update')"
                    @click="openEditModal(med)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                    title="Edit Medicine"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('supplier.delete')"
                    @click="handleDelete(med)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                    title="Delete Medicine"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div 
        v-if="pharmacyStore.medicinePagination.total > 0" 
        class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <span class="text-xs text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, pharmacyStore.medicinePagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ pharmacyStore.medicinePagination.total }}</span> 
          entries
        </span>

        <div v-if="pharmacyStore.medicinePagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            v-for="page in pharmacyStore.medicinePagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            :class="currentPage === page ? 'bg-teal-600 text-white font-bold shadow-lg shadow-teal-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < pharmacyStore.medicinePagination.pages && currentPage++"
            :disabled="currentPage === pharmacyStore.medicinePagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Medicine Modal Overlay -->
    <CreateMedicineModal 
      :show="isCreateModalOpen"
      :medicine="selectedMedicine"
      @close="isCreateModalOpen = false"
      @created="handleMedicineCreated"
      @updated="handleMedicineUpdated"
    />

    <!-- Manage Batches Modal Overlay -->
    <ManageBatchesModal
      :show="isBatchModalOpen"
      :medicine="batchSelectedMedicine"
      @close="handleBatchModalClose"
    />
  </div>
</template>
