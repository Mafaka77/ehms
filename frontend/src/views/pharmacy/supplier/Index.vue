<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const router        = useRouter()
const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()
const authStore     = useAuthStore()

// ── State ────────────────────────────────────────────────
const searchQuery  = ref('')
const currentPage  = ref(1)
const limit        = ref(10)
const filterActive = ref('')

// Modal state
const showViewModal = ref(false)
const selected      = ref(null)

// ─── Load ─────────────────────────────────────────────────
const loadData = async () => {
  await pharmacyStore.fetchSuppliers(currentPage.value, limit.value, searchQuery.value, filterActive.value)
}

let debounce = null
watch(searchQuery, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { currentPage.value = 1; loadData() }, 400)
})
watch([currentPage, limit, filterActive], loadData)

onMounted(loadData)

// ─── Handlers ──────────────────────────────────────────────
const openView = (s) => {
  selected.value      = s
  showViewModal.value = true
}

const handleDelete = async (s) => {
  if (!confirm(`Delete supplier "${s.supplierName}"? This action cannot be undone.`)) return
  const res = await pharmacyStore.deleteSupplier(s._id)
  if (res.success) {
    snackbarStore.show({ message: res.message, type: 'success' })
    await loadData()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Medicine Suppliers</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage pharmaceutical and medicine supplier records.</p>
      </div>
      <button
        v-if="authStore.hasPermission('supplier.create')"
        @click="router.push({ name: 'pharmacy-supplier-create' })"
        class="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-100 transition-all flex items-center gap-2 transform active:scale-95"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Supplier
      </button>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      <!-- Search + Filter bar -->
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-base font-semibold text-slate-800 shrink-0">Supplier Directory</h2>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">

          <!-- Search -->
          <div class="relative w-full sm:w-72">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, code, city..."
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-inner"
            />
          </div>

          <!-- Active filter -->
          <select
            v-model="filterActive"
            class="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 shadow-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pharmacyStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading suppliers...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="pharmacyStore.suppliers.length === 0" class="py-24 text-center">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No suppliers found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Add a new supplier or adjust your search filters.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Supplier</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Contact</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Location</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">GST No.</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="s in pharmacyStore.suppliers"
              :key="s._id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <!-- Supplier details -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs border border-teal-100/60 flex-shrink-0">
                    {{ s.supplierCode?.slice(0, 3) }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 text-sm block">{{ s.supplierName }}</span>
                    <span class="text-slate-400 text-[11px] font-medium">{{ s.supplierCode }}</span>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td class="px-6 py-4">
                <span class="text-slate-700 text-sm font-medium block">{{ s.contactPerson || '—' }}</span>
                <span class="text-slate-400 text-[11px] block">{{ s.mobileNo || '' }}</span>
                <span class="text-slate-400 text-[11px] block">{{ s.email || '' }}</span>
              </td>

              <!-- Location -->
              <td class="px-6 py-4">
                <span class="text-slate-700 text-sm block">{{ [s.city, s.state].filter(Boolean).join(', ') || '—' }}</span>
                <span class="text-slate-400 text-[11px]">{{ s.pincode || '' }}</span>
              </td>

              <!-- GST -->
              <td class="px-6 py-4">
                <span class="text-slate-600 text-sm font-mono">{{ s.gstNo || '—' }}</span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 text-center">
                <span :class="['px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border inline-block', s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60']">
                  {{ s.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button @click="openView(s)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all" title="View">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button
                    v-if="authStore.hasPermission('supplier.update')"
                    @click="router.push({ name: 'pharmacy-supplier-edit', params: { id: s._id } })"
                    class="bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white p-2 rounded-xl border border-teal-100/30 transition-all"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button
                    v-if="authStore.hasPermission('supplier.delete')"
                    @click="handleDelete(s)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pharmacyStore.pagination.pages > 1" class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-medium">
          Showing page {{ currentPage }} of {{ pharmacyStore.pagination.pages }} ({{ pharmacyStore.pagination.total }} total)
        </span>
        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1" class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button @click="currentPage++" :disabled="currentPage === pharmacyStore.pagination.pages" class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>



    <!-- ── View Modal ───────────────────────────────────── -->
    <div v-if="showViewModal && selected" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button @click="showViewModal = false" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100/60 flex items-center justify-center text-teal-700 font-bold text-sm">
            {{ selected.supplierCode?.slice(0, 4) }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 leading-tight">{{ selected.supplierName }}</h3>
            <span class="text-slate-400 text-xs">{{ selected.supplierCode }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Contact section -->
          <div class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Details</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Person</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.contactPerson || '—' }}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.mobileNo || '—' }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.email || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Address section -->
          <div class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
            <p class="text-slate-700 text-sm">{{ selected.address || '—' }}</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">City</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.city || '—' }}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">State</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.state || '—' }}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pincode</span>
                <span class="text-slate-800 text-sm font-semibold">{{ selected.pincode || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- GST + Status -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GST Number</span>
              <span class="text-slate-800 text-sm font-mono font-semibold">{{ selected.gstNo || '—' }}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
              <span :class="['mt-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border inline-block', selected.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60']">
                {{ selected.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end pt-2">
            <button @click="showViewModal = false" class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
