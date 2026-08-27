<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import CreateCategoryModal from './Create.vue'
import CreateMedicineModal from '../manage/CreateMedicine.vue'
import ManageBatchesModal from '../manage/ManageBatches.vue'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const categoryId = computed(() => props.id || route.params.id)

// ── State ────────────────────────────────────────────────
const category = ref(null)
const medicines = ref([])
const loadingCategory = ref(true)
const loadingMedicines = ref(false)

const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const stockStatusFilter = ref('')
const isExportingPdf = ref(false)

// Modals
const isEditCategoryModalOpen = ref(false)
const isMedicineModalOpen = ref(false)
const selectedMedicine = ref(null)
const isBatchModalOpen = ref(false)
const batchSelectedMedicine = ref(null)

// ── Fetch Category ────────────────────────────────────────
const fetchCategory = async () => {
  if (!categoryId.value) return
  loadingCategory.value = true
  try {
    const res = await pharmacyStore.fetchCategoryById(categoryId.value)
    if (res.success && res.data) {
      category.value = res.data
    } else {
      snackbarStore.show({ message: res.message || 'Failed to load category', type: 'error' })
      router.push({ name: 'pharmacy-category' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Error loading category details', type: 'error' })
    router.push({ name: 'pharmacy-category' })
  } finally {
    loadingCategory.value = false
  }
}

// ── Fetch Medicines under this category ──────────────────
const fetchCategoryMedicines = async () => {
  if (!categoryId.value) return
  loadingMedicines.value = true
  try {
    const result = await pharmacyStore.fetchMedicines(
      currentPage.value,
      limit.value,
      searchQuery.value,
      categoryId.value,
      '',
      '',
      stockStatusFilter.value
    )
    medicines.value = result || []
  } catch (err) {
    console.error('Error fetching category medicines:', err)
  } finally {
    loadingMedicines.value = false
  }
}

// ── Search & Filter Watchers ─────────────────────────────
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchCategoryMedicines()
  }, 400)
})

watch(stockStatusFilter, () => {
  currentPage.value = 1
  fetchCategoryMedicines()
})

watch([currentPage, limit], () => {
  fetchCategoryMedicines()
})

// ── Category Edit Handlers ───────────────────────────────
const openEditCategory = () => {
  isEditCategoryModalOpen.value = true
}

const handleCategoryUpdated = (updatedCat) => {
  category.value = updatedCat
  fetchCategory()
}

// ── Medicine Modal Handlers ──────────────────────────────
const openAddMedicine = () => {
  selectedMedicine.value = null
  isMedicineModalOpen.value = true
}

const openEditMedicine = (med) => {
  selectedMedicine.value = med
  isMedicineModalOpen.value = true
}

const handleMedicineCreated = () => {
  fetchCategoryMedicines()
}

const handleMedicineUpdated = () => {
  fetchCategoryMedicines()
}

const handleDeleteMedicine = async (med) => {
  if (confirm(`Are you sure you want to delete "${med.medicineName}" from this category?`)) {
    const res = await pharmacyStore.deleteMedicine(med._id)
    if (res.success) {
      snackbarStore.show({ message: res.message || 'Medicine deleted successfully', type: 'success' })
      if (medicines.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchCategoryMedicines()
      }
    } else {
      snackbarStore.show({ message: res.message || 'Failed to delete medicine', type: 'error' })
    }
  }
}

// ── Batch Modal Handlers ─────────────────────────────────
const openBatchModal = (med) => {
  batchSelectedMedicine.value = med
  isBatchModalOpen.value = true
}

const handleBatchModalClose = () => {
  isBatchModalOpen.value = false
  fetchCategoryMedicines()
}

// ── PDF Export for Category Medicines ────────────────────
const exportCategoryMedicinesPdf = async () => {
  isExportingPdf.value = true
  try {
    const allMedicines = await pharmacyStore.fetchAllMedicinesForExport(
      searchQuery.value,
      stockStatusFilter.value,
      categoryId.value
    )

    if (!allMedicines || allMedicines.length === 0) {
      snackbarStore.show({ message: 'No medicines found in this category to export.', type: 'warning' })
      isExportingPdf.value = false
      return
    }

    const catName = category.value?.name || 'Pharmacy Category'
    let totalStockQty = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    allMedicines.forEach(m => {
      totalStockQty += (m.currentStock || 0)
      if (m.currentStock === 0) outOfStockCount++
      else if (m.currentStock <= m.reorderLevel) lowStockCount++
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medicine Catalogue - ${catName} - ${new Date().toLocaleDateString('en-IN')}</title>
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

            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
            th { background: #0f766e; color: #ffffff; text-align: left; padding: 7px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; font-family: monospace; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; }
            .badge-instock { background: #dcfce7; color: #15803d; }
            .badge-low { background: #fef3c7; color: #b45309; }
            .badge-out { background: #ffe4e6; color: #be123c; }

            .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hospital Pharmacy Medicine Catalogue</h1>
            <p>Category Inventory: <strong>${catName}</strong></p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Category Name</span>
              <span class="meta-val">${catName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Medicines</span>
              <span class="meta-val">${allMedicines.length} Items</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Stock Units</span>
              <span class="meta-val">${totalStockQty} Units</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Report Date</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Medicines</div>
              <div class="stat-value">${allMedicines.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">In Stock</div>
              <div class="stat-value" style="color: #15803d;">${allMedicines.filter(m => m.currentStock > m.reorderLevel).length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Low Stock Alert</div>
              <div class="stat-value" style="color: #b45309;">${lowStockCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Out of Stock</div>
              <div class="stat-value" style="color: #be123c;">${outOfStockCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Code</th>
                <th style="width: 26%;">Medicine Name</th>
                <th style="width: 18%;">Generic / Brand</th>
                <th style="width: 10%;">Form / Unit</th>
                <th style="width: 10%; text-align: right;">Current Stock</th>
                <th style="width: 10%; text-align: right;">Sale Rate (₹)</th>
                <th style="width: 8%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${allMedicines.map((m, idx) => {
                const rateStr = m.saleRate != null ? `₹${Number(m.saleRate).toFixed(2)}` : '₹0.00'
                let stockBadge = '<span class="badge badge-instock">In Stock</span>'
                if (m.currentStock === 0) stockBadge = '<span class="badge badge-out">Out</span>'
                else if (m.currentStock <= m.reorderLevel) stockBadge = '<span class="badge badge-low">Low</span>'

                const genericInfo = [m.genericName, m.brandName].filter(Boolean).join(' / ') || '—'
                const formUnit = `${m.dosageForm || '-'} / ${m.unit || '-'}`

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #0f766e;">${m.medicineCode || '-'}</td>
                    <td><strong>${m.medicineName}</strong> ${m.strength ? `(${m.strength})` : ''}</td>
                    <td>${genericInfo}</td>
                    <td>${formUnit}</td>
                    <td style="text-align: right; font-weight: bold;">${m.currentStock || 0}</td>
                    <td class="amount-col">${rateStr}</td>
                    <td style="text-align: center;">${stockBadge}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Document generated from Hospital Management System for Pharmacy Department.</div>
            <div class="sig-box">
              <div class="sig-line">Chief Pharmacist Signature</div>
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
    snackbarStore.show({ message: 'Failed to export category medicines PDF', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0)
}

const dosageFormBadgeClass = (form) => {
  const map = {
    TABLET: 'bg-blue-50 text-blue-700 border-blue-100',
    CAPSULE: 'bg-purple-50 text-purple-700 border-purple-100',
    SYRUP: 'bg-amber-50 text-amber-700 border-amber-100',
    INJECTION: 'bg-rose-50 text-rose-700 border-rose-100',
    DROPS: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    CREAM: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    OINTMENT: 'bg-teal-50 text-teal-700 border-teal-100',
    POWDER: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    INHALER: 'bg-violet-50 text-violet-700 border-violet-100'
  }
  return map[form] || 'bg-slate-50 text-slate-700 border-slate-200'
}

onMounted(() => {
  fetchCategory()
  fetchCategoryMedicines()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Back Navigation & Breadcrumb -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button 
          @click="router.push({ name: 'pharmacy-category' })"
          class="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm flex items-center justify-center cursor-pointer group"
          title="Back to Categories"
        >
          <svg class="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div class="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider">
            <span>Pharmacy</span>
            <span>/</span>
            <span>Categories</span>
            <span>/</span>
            <span>Category View</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mt-0.5">
            {{ loadingCategory ? 'Loading Category...' : category?.name }}
          </h1>
        </div>
      </div>

      <!-- Header Top Actions -->
      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <button 
          v-if="category"
          @click="openEditCategory"
          class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs transition-all shadow-sm flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Category
        </button>

        <button 
          @click="openAddMedicine"
          class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-teal-100 hover:shadow-teal-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Medicine Line
        </button>
      </div>
    </div>

    <!-- Category Loading Skeleton -->
    <div v-if="loadingCategory" class="animate-pulse space-y-6">
      <div class="h-44 bg-slate-100 rounded-3xl"></div>
      <div class="h-96 bg-slate-100 rounded-2xl"></div>
    </div>

    <template v-else-if="category">
      <!-- Category Banner Card -->
      <div class="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <!-- Background Ambient Glow -->
        <div class="absolute -right-12 -bottom-12 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-0 right-1/4 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <!-- Main Category Info -->
          <div class="flex items-start sm:items-center gap-5">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-inner shrink-0">
              {{ category.name?.charAt(0).toUpperCase() }}
            </div>
            
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2.5">
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ category.name }}</h2>
                <span 
                  :class="[
                    'px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider border', 
                    category.isActive 
                      ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' 
                      : 'bg-slate-400/20 text-slate-300 border-slate-400/30'
                  ]"
                >
                  {{ category.isActive ? 'Active Category' : 'Inactive' }}
                </span>
              </div>
              
              <p class="text-teal-100 text-sm max-w-2xl leading-relaxed">
                {{ category.description || 'No specific description provided for this therapeutic category.' }}
              </p>

              <div class="flex items-center gap-4 text-xs text-teal-200/80 pt-1">
                <span>Created: <strong>{{ formatDate(category.createdAt) }}</strong></span>
                <span>•</span>
                <span>Last Updated: <strong>{{ formatDate(category.updatedAt) }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Quick KPI Cards Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:shrink-0">
            <div class="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <p class="text-[11px] text-teal-200 font-semibold uppercase tracking-wider">Total Items</p>
              <p class="text-2xl font-bold font-mono mt-0.5">{{ pharmacyStore.stockSummary?.totalItems || pharmacyStore.medicinePagination?.total || 0 }}</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <p class="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider">In Stock</p>
              <p class="text-2xl font-bold font-mono mt-0.5 text-emerald-200">{{ pharmacyStore.stockSummary?.inStockCount || 0 }}</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <p class="text-[11px] text-amber-200 font-semibold uppercase tracking-wider">Low Stock</p>
              <p class="text-2xl font-bold font-mono mt-0.5 text-amber-200">{{ pharmacyStore.stockSummary?.lowStockCount || 0 }}</p>
            </div>
            <div class="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center min-w-[90px]">
              <p class="text-[11px] text-rose-200 font-semibold uppercase tracking-wider">Out of Stock</p>
              <p class="text-2xl font-bold font-mono mt-0.5 text-rose-200">{{ pharmacyStore.stockSummary?.outOfStockCount || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Medicine Lines Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden space-y-4">
        <!-- Section Header & Filter Toolbar -->
        <div class="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h2 class="text-lg font-bold text-slate-800">Medicines in this Category</h2>
            <p class="text-xs text-slate-500 mt-0.5">View and manage all pharmaceutical inventory items linked to {{ category.name }}.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search name, code, generic..." 
                class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
              />
            </div>

            <!-- Stock Status Dropdown Filter -->
            <div class="relative">
              <select 
                v-model="stockStatusFilter"
                class="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all cursor-pointer font-medium"
              >
                <option value="">All Stock Statuses</option>
                <option value="in_stock">In Stock (> Reorder Level)</option>
                <option value="low">Low Stock (≤ Reorder Level)</option>
                <option value="out">Out of Stock (0)</option>
                <option value="reorder">Reorder Needed</option>
              </select>
            </div>

            <!-- Export PDF Button -->
            <button
              @click="exportCategoryMedicinesPdf"
              :disabled="isExportingPdf"
              class="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 font-semibold text-xs hover:bg-teal-100 transition-all focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Export Printable PDF Report"
            >
              <svg v-if="isExportingPdf" class="animate-spin h-4 w-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loadingMedicines" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg class="animate-spin h-9 w-9 text-teal-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs font-medium">Loading category medicines...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="medicines.length === 0" class="p-8 text-center text-slate-500 py-16">
          <div class="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p class="text-slate-700 font-bold text-base">No medicines found</p>
          <p class="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {{ searchQuery || stockStatusFilter ? "No medicines match the selected filter or search criteria." : "No medicines have been added under this category yet." }}
          </p>
          <button 
            v-if="!searchQuery && !stockStatusFilter"
            @click="openAddMedicine"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all shadow-md shadow-teal-100 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add First Medicine in {{ category.name }}
          </button>
        </div>

        <!-- Medicines Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th class="px-6 py-3.5 w-1/4">Medicine & Form</th>
                <th class="px-6 py-3.5 w-1/5">Generic / Brand</th>
                <th class="px-6 py-3.5 w-1/6">Supplier</th>
                <th class="px-6 py-3.5 text-center">Reorder Lvl</th>
                <th class="px-6 py-3.5 text-right">Current Stock</th>
                <th class="px-6 py-3.5 text-right">Sale Rate</th>
                <th class="px-6 py-3.5 text-center">Status</th>
                <th class="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="med in medicines" 
                :key="med._id"
                class="hover:bg-slate-50/60 transition-colors group"
              >
                <!-- Medicine Name & Code -->
                <td class="px-6 py-3.5">
                  <div class="flex items-start gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 group-hover:bg-teal-100 transition-colors">
                      {{ med.medicineName?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>{{ med.medicineName }}</span>
                        <span v-if="med.strength" class="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {{ med.strength }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/60">
                          {{ med.medicineCode }}
                        </span>
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded border', dosageFormBadgeClass(med.dosageForm)]">
                          {{ med.dosageForm || 'TABLET' }}
                        </span>
                        <span class="text-[10px] text-slate-400">
                          Unit: {{ med.unit || 'TAB' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Generic / Brand -->
                <td class="px-6 py-3.5 text-slate-600">
                  <p class="font-medium text-slate-800 truncate max-w-xs" :title="med.genericName">
                    {{ med.genericName || '—' }}
                  </p>
                  <p v-if="med.brandName" class="text-[11px] text-slate-400 truncate max-w-xs" :title="med.brandName">
                    Brand: {{ med.brandName }}
                  </p>
                </td>

                <!-- Supplier -->
                <td class="px-6 py-3.5 text-slate-600">
                  <span v-if="med.supplierId?.supplierName" class="font-medium text-slate-700 truncate block max-w-xs" :title="med.supplierId.supplierName">
                    {{ med.supplierId.supplierName }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>

                <!-- Reorder Level -->
                <td class="px-6 py-3.5 text-center font-mono font-semibold text-slate-500">
                  {{ med.reorderLevel ?? 10 }}
                </td>

                <!-- Current Stock -->
                <td class="px-6 py-3.5 text-right">
                  <div class="inline-flex flex-col items-end">
                    <span 
                      :class="[
                        'px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-flex items-center gap-1.5 border',
                        med.currentStock === 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : med.currentStock <= med.reorderLevel
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      ]"
                    >
                      <span 
                        :class="[
                          'w-1.5 h-1.5 rounded-full',
                          med.currentStock === 0 ? 'bg-rose-500' : med.currentStock <= med.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500'
                        ]"
                      ></span>
                      {{ med.currentStock ?? 0 }} {{ med.unit || 'TAB' }}
                    </span>
                    <span v-if="med.currentStock === 0" class="text-[10px] text-rose-500 font-semibold mt-0.5">Out of Stock</span>
                    <span v-else-if="med.currentStock <= med.reorderLevel" class="text-[10px] text-amber-600 font-semibold mt-0.5">Low Stock</span>
                  </div>
                </td>

                <!-- Sale Rate -->
                <td class="px-6 py-3.5 text-right font-mono font-bold text-slate-800">
                  {{ formatCurrency(med.saleRate) }}
                </td>

                <!-- Status -->
                <td class="px-6 py-3.5 text-center">
                  <span 
                    v-if="med.isActive" 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    Active
                  </span>
                  <span 
                    v-else 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    Inactive
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-3.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Manage Batches -->
                    <button 
                      @click="openBatchModal(med)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-all cursor-pointer"
                      title="Manage Batches & Stock"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </button>

                    <!-- Edit Medicine -->
                    <button 
                      @click="openEditMedicine(med)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                      title="Edit Medicine"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <!-- Delete Medicine -->
                    <button 
                      @click="handleDeleteMedicine(med)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete Medicine"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          v-if="pharmacyStore.medicinePagination?.total > 0"
          class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20"
        >
          <span class="text-xs text-slate-500 font-medium">
            Showing 
            <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
            to 
            <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, pharmacyStore.medicinePagination.total) }}</span> 
            of 
            <span class="text-slate-800 font-semibold">{{ pharmacyStore.medicinePagination.total }}</span> 
            medicines
          </span>

          <div v-if="pharmacyStore.medicinePagination?.pages > 1" class="flex items-center gap-2">
            <!-- Prev -->
            <button 
              @click="currentPage > 1 && currentPage--"
              :disabled="currentPage === 1"
              class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous Page"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Pages -->
            <button 
              v-for="page in pharmacyStore.medicinePagination.pages" 
              :key="page"
              @click="currentPage = page"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all"
              :class="currentPage === page ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
            >
              {{ page }}
            </button>

            <!-- Next -->
            <button 
              @click="currentPage < pharmacyStore.medicinePagination.pages && currentPage++"
              :disabled="currentPage === pharmacyStore.medicinePagination.pages"
              class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Category Modal -->
    <CreateCategoryModal 
      :show="isEditCategoryModalOpen"
      :category="category"
      @close="isEditCategoryModalOpen = false"
      @updated="handleCategoryUpdated"
    />

    <!-- Add / Edit Medicine Modal -->
    <CreateMedicineModal 
      :show="isMedicineModalOpen"
      :medicine="selectedMedicine"
      :default-category-id="categoryId"
      @close="isMedicineModalOpen = false"
      @created="handleMedicineCreated"
      @updated="handleMedicineUpdated"
    />

    <!-- Manage Batches Modal -->
    <ManageBatchesModal 
      :show="isBatchModalOpen"
      :medicine="batchSelectedMedicine"
      @close="handleBatchModalClose"
    />
  </div>
</template>
