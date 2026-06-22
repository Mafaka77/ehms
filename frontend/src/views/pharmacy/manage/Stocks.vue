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

const fetchMedicines = async () => {
  try {
    await pharmacyStore.fetchMedicines(currentPage.value, limit.value, searchQuery.value)
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
    // pharmacyStore.createMedicine already unshifted the new medicine into the array
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

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchMedicines()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchMedicines()
})

onMounted(() => {
  fetchMedicines()
})

// Local calculated counts
const lowStockCount = computed(() => {
  return pharmacyStore.medicines.filter(m => m.currentStock <= m.reorderLevel && m.currentStock > 0).length
})

const outOfStockCount = computed(() => {
  return pharmacyStore.medicines.filter(m => m.currentStock === 0).length
})
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Banner -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-slate-450 text-xs font-bold tracking-wider uppercase block">Total Medicines</span>
          <span class="text-2xl font-extrabold text-slate-800 mt-1 block">
            {{ pharmacyStore.medicinePagination.total }} Items
          </span>
          <span class="text-teal-600 text-xs font-semibold mt-1 block">In pharmacy stock</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-2 0h-2"/></svg>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
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

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
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
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 class="text-base font-bold text-slate-800">Inventory Directory</h3>
        <div class="flex items-center gap-3 w-full sm:w-auto">
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
              placeholder="Search by name, code..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
            />
          </div>
          <!-- Register Button -->
          <button 
            v-if="authStore.hasPermission('supplier.create')"
            @click="openAddModal"
            class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-lg shadow-teal-100 transition-all flex items-center gap-2 transform active:scale-95 shrink-0"
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
        <p class="text-slate-400 text-xs mt-1 max-w-xs mx-auto">Try modifying your search filter or add a new medicine.</p>
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
                    class="p-2 rounded-xl text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all"
                    title="Manage Batches"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('supplier.update')"
                    @click="openEditModal(med)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
                    title="Edit Medicine"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('supplier.delete')"
                    @click="handleDelete(med)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
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
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            v-for="page in pharmacyStore.medicinePagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
            :class="currentPage === page ? 'bg-teal-600 text-white font-bold shadow-lg shadow-teal-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < pharmacyStore.medicinePagination.pages && currentPage++"
            :disabled="currentPage === pharmacyStore.medicinePagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
