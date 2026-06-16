<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CreateCategoryModal from './Create.vue'
import { useRadiologyStore } from '../../../stores/radiologyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const radiologyStore = useRadiologyStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()
const router = useRouter()

const isCreateModalOpen = ref(false)
const selectedCategory = ref(null)
const currentPage = ref(1)
const limit = ref(10)

const fetchCategories = async () => {
  try {
    await radiologyStore.fetchCategories(currentPage.value, limit.value, radiologyStore.searchQuery)
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedCategory.value = null
  isCreateModalOpen.value = true
}

const viewCategory = (cat) => {
  router.push({ name: 'radiology-category-view', params: { id: cat._id } })
}

const openEditModal = (cat) => {
  selectedCategory.value = cat
  isCreateModalOpen.value = true
}

const handleCategoryCreated = (newCat) => {
  if (currentPage.value === 1) {
    radiologyStore.categories.unshift(newCat)
    if (radiologyStore.categories.length > limit.value) {
      radiologyStore.categories.pop()
    }
    radiologyStore.pagination.total++
  } else {
    fetchCategories()
  }
}

const handleCategoryUpdated = () => {
  fetchCategories()
}

const filteredCategories = computed(() => radiologyStore.categories)

let debounceTimer = null
watch(() => radiologyStore.searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchCategories()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchCategories()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleDelete = async (cat) => {
  if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
    const response = await radiologyStore.deleteCategory(cat._id)
    if (response.success) {
      snackbarStore.show({ message: response.message, type: 'success' })
      if (radiologyStore.categories.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchCategories()
      }
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  }
}

// Icon map for known radiology types
const categoryIconColor = (code) => {
  const colors = {
    XRAY: 'bg-sky-50 text-sky-600',
    USG: 'bg-violet-50 text-violet-600',
    CT: 'bg-amber-50 text-amber-600',
    MRI: 'bg-indigo-50 text-indigo-600',
    CARDIAC: 'bg-rose-50 text-rose-600',
    NEURO: 'bg-teal-50 text-teal-600',
    PFT: 'bg-emerald-50 text-emerald-600',
  }
  return colors[code?.toUpperCase()] || 'bg-indigo-50 text-indigo-600'
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <!-- Radiology icon -->
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Radiology Categories</h1>
        </div>
        <p class="text-slate-500 text-sm ml-13">Manage imaging and diagnostic radiology service types.</p>
      </div>
      <button 
        v-if="authStore.hasPermission('radiology.create')"
        @click="openAddModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-800">{{ radiologyStore.pagination.total }}</p>
          <p class="text-xs text-slate-400 font-medium">Total Categories</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-800">{{ filteredCategories.filter(c => c.isActive).length }}</p>
          <p class="text-xs text-slate-400 font-medium">Active</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-800">{{ filteredCategories.filter(c => !c.isActive).length }}</p>
          <p class="text-xs text-slate-400 font-medium">Inactive</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-800">{{ radiologyStore.pagination.pages }}</p>
          <p class="text-xs text-slate-400 font-medium">Pages</p>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">All Categories</h2>
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="radiologyStore.searchQuery"
            type="text" 
            placeholder="Search by name or code..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="radiologyStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading categories...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCategories.length === 0" class="p-6 text-center text-slate-500 py-24">
        <div class="w-20 h-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
          </svg>
        </div>
        <p class="text-slate-700 font-semibold text-lg">No categories found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          {{ radiologyStore.searchQuery ? "No results match your search. Try a different term." : "Get started by adding the first radiology category." }}
        </p>
        <button 
          v-if="!radiologyStore.searchQuery && authStore.hasPermission('radiology.create')"
          @click="openAddModal"
          class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Category
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Category</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Code</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Description</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Created</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="cat in filteredCategories" 
              :key="cat._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Category Name -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform"
                    :class="categoryIconColor(cat.code)"
                  >
                    {{ cat.code?.charAt(0) || cat.name?.charAt(0) }}
                  </div>
                  <span class="font-semibold text-slate-800 text-sm">{{ cat.name }}</span>
                </div>
              </td>
              <!-- Code -->
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 tracking-wider">
                  {{ cat.code }}
                </span>
              </td>
              <!-- Description -->
              <td class="px-6 py-4 text-sm text-slate-500 max-w-xs">
                <span class="truncate block" :title="cat.description">
                  {{ cat.description || '—' }}
                </span>
              </td>
              <!-- Status -->
              <td class="px-6 py-4">
                <span 
                  v-if="cat.isActive" 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
                <span 
                  v-else 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Inactive
                </span>
              </td>
              <!-- Created Date -->
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ formatDate(cat.createdAt) }}
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- View Button -->
                  <button 
                    @click="viewCategory(cat)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all focus:outline-none focus:ring-2 focus:ring-violet-100"
                    title="View Category & Tests"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('radiology.update')"
                    @click="openEditModal(cat)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Category"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('radiology.delete')"
                    @click="handleDelete(cat)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete Category"
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

      <!-- Pagination Footer -->
      <div 
        v-if="radiologyStore.pagination.total > 0" 
        class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <!-- Info Text -->
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, radiologyStore.pagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ radiologyStore.pagination.total }}</span> 
          entries
        </span>

        <!-- Pagination Buttons -->
        <div v-if="radiologyStore.pagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            v-for="page in radiologyStore.pagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < radiologyStore.pagination.pages && currentPage++"
            :disabled="currentPage === radiologyStore.pagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CreateCategoryModal 
      :show="isCreateModalOpen"
      :category="selectedCategory"
      @close="isCreateModalOpen = false"
      @created="handleCategoryCreated"
      @updated="handleCategoryUpdated"
    />
  </div>
</template>
