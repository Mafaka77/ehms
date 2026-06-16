<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import CreateDesignationModal from './Create.vue'
import { useMasterDesignationStore } from '../../../stores/masterDesignationStore.js'
import { useSnackbarStore } from '../../../stores/snackbarStore.js'
import { useAuthStore } from '../../../stores/authStore'

const masterDesignationStore = useMasterDesignationStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const isCreateModalOpen = ref(false)
const selectedDesignation = ref(null)

const currentPage = ref(1)
const limit = ref(10)

const fetchDesignations = async () => {
  try {
    await masterDesignationStore.fetchDesignations(currentPage.value, limit.value, masterDesignationStore.searchQuery);
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedDesignation.value = null
  isCreateModalOpen.value = true
}

const openEditModal = (desig) => {
  selectedDesignation.value = desig
  isCreateModalOpen.value = true
}

const handleDesignationCreated = (newDesig) => {
  if (currentPage.value === 1) {
    masterDesignationStore.designations.unshift(newDesig)
    if (masterDesignationStore.designations.length > limit.value) {
      masterDesignationStore.designations.pop()
    }
    masterDesignationStore.pagination.total++
  } else {
    fetchDesignations()
  }
}

const handleDesignationUpdated = () => {
  fetchDesignations()
}

const filteredDesignations = computed(() => {
  return masterDesignationStore.designations
})

let debounceTimer = null
watch(() => masterDesignationStore.searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchDesignations()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchDesignations()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleDelete = async (desig) => {
  if (confirm(`Are you sure you want to delete the designation "${desig.designationName}"?`)) {
    const response = await masterDesignationStore.deleteDesignation(desig._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message,
        type: 'success'
      })
      if (masterDesignationStore.designations.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchDesignations()
      }
    } else {
      snackbarStore.show({
        message: response.message,
        type: 'error'
      })
    }
  }
}

onMounted(() => {
  fetchDesignations()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Designations</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage medical and operational staff job roles.</p>
      </div>
      <button 
        v-if="authStore.hasPermission('designation.create')"
        @click="openAddModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
      >
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Add Designation
      </button>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">All Designations</h2>
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="masterDesignationStore.searchQuery"
            type="text" 
            placeholder="Search designations..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="masterDesignationStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading designations...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDesignations.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No designations found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          {{ masterDesignationStore.searchQuery ? "No results match your search query. Try typing something else." : "Get started by adding the first designation to the hospital master data." }}
        </p>
        <button 
          v-if="!masterDesignationStore.searchQuery && authStore.hasPermission('designation.create')"
          @click="openAddModal"
          class="mt-5 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Designation
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Designation Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/6">Status</th>
              <th v-if="authStore.hasPermission('designation.update') || authStore.hasPermission('designation.delete')" class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[15%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="desig in filteredDesignations" 
              :key="desig._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Name -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                    {{ desig.designationName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-semibold text-slate-800 text-sm">{{ desig.designationName }}</span>
                </div>
              </td>
              <!-- Department -->
              <td class="px-6 py-4">
                <span class="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium text-xs border border-slate-200/55">
                  {{ desig.departmentId?.name || 'Unassigned' }}
                </span>
              </td>
              <!-- Status -->
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="desig.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="desig.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  {{ desig.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <!-- Actions -->
              <td v-if="authStore.hasPermission('designation.update') || authStore.hasPermission('designation.delete')" class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    v-if="authStore.hasPermission('designation.update')"
                    @click="openEditModal(desig)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Designation"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('designation.delete')"
                    @click="handleDelete(desig)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete Designation"
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
        v-if="masterDesignationStore.pagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <!-- Info Text -->
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, masterDesignationStore.pagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ masterDesignationStore.pagination.total }}</span> 
          entries
        </span>

        <!-- Pagination Buttons -->
        <div v-if="masterDesignationStore.pagination.pages > 1" class="flex items-center gap-2">
          <!-- Previous Button -->
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Page Numbers -->
          <button 
            v-for="page in masterDesignationStore.pagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>

          <!-- Next Button -->
          <button 
            @click="currentPage < masterDesignationStore.pagination.pages && currentPage++"
            :disabled="currentPage === masterDesignationStore.pagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal Component -->
    <CreateDesignationModal 
      :show="isCreateModalOpen"
      :designation="selectedDesignation"
      @close="isCreateModalOpen = false"
      @created="handleDesignationCreated"
      @updated="handleDesignationUpdated"
    />
  </div>
</template>