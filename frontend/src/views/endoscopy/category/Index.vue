<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CreateCategoryModal from './Create.vue'
import { useEndoscopyStore } from '../../../stores/endoscopyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const endoscopyStore = useEndoscopyStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()
const router = useRouter()

const isCreateModalOpen = ref(false)
const selectedCategory = ref(null)
const currentPage = ref(1)
const limit = ref(10)

const fetchCategories = async () => {
  try {
    await endoscopyStore.fetchCategories(currentPage.value, limit.value, endoscopyStore.searchQuery)
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedCategory.value = null
  isCreateModalOpen.value = true
}

const viewCategory = (cat) => {
  router.push({ name: 'endoscopy-category-view', params: { id: cat._id } })
}

const openEditModal = (cat) => {
  selectedCategory.value = cat
  isCreateModalOpen.value = true
}

const handleCategoryCreated = (newCat) => {
  if (currentPage.value === 1) {
    endoscopyStore.categories.unshift(newCat)
    if (endoscopyStore.categories.length > limit.value) {
      endoscopyStore.categories.pop()
    }
    endoscopyStore.pagination.total++
  } else {
    fetchCategories()
  }
}

const handleCategoryUpdated = () => {
  fetchCategories()
}

const filteredCategories = computed(() => endoscopyStore.categories)

let debounceTimer = null
watch(() => endoscopyStore.searchQuery, () => {
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
    const response = await endoscopyStore.deleteCategory(cat._id)
    if (response.success) {
      snackbarStore.show({ message: response.message, type: 'success' })
      if (endoscopyStore.categories.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchCategories()
      }
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  }
}

const categoryIconColor = (code) => {
  const colors = {
    UGI: 'bg-teal-50 text-teal-600',
    LGI: 'bg-emerald-50 text-emerald-600',
    ERCP: 'bg-indigo-50 text-indigo-600',
    EUS: 'bg-amber-50 text-amber-600',
    BRONCHO: 'bg-sky-50 text-sky-600',
  }
  return colors[code?.toUpperCase()] || 'bg-teal-50 text-teal-600'
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
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-200">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Endoscopy Categories</h1>
        </div>
        <p class="text-slate-500 text-sm ml-13">Manage endoscopic diagnostic procedure types and service categories.</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-teal-100 hover:shadow-teal-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
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
        <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium uppercase">Total Categories</p>
          <p class="text-xl font-bold text-slate-800">{{ endoscopyStore.pagination.total }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium uppercase">Active Categories</p>
          <p class="text-xl font-bold text-slate-800">
            {{ endoscopyStore.categories.filter(c => c.isActive).length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="relative w-full sm:w-80">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          v-model="endoscopyStore.searchQuery" 
          type="text" 
          placeholder="Search by code or name..." 
          class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
        />
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <span class="text-xs text-slate-400 font-medium">Rows per page:</span>
        <select 
          v-model="limit" 
          class="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all font-medium"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- Content / Cards -->
    <div v-if="endoscopyStore.loading && filteredCategories.length === 0" class="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-100">
      <svg class="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-sm font-medium">Loading endoscopy categories...</p>
    </div>

    <div v-else-if="filteredCategories.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 text-center px-4">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-base font-semibold text-slate-800">No categories found</h3>
      <p class="text-slate-400 text-sm mt-1 max-w-sm">
        {{ endoscopyStore.searchQuery ? `No category matching "${endoscopyStore.searchQuery}".` : 'Get started by creating your first endoscopy service category.' }}
      </p>
      <button 
        @click="openAddModal"
        class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 shadow-md transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    </div>

    <!-- Category Grid Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="cat in filteredCategories" 
        :key="cat._id" 
        class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden"
      >
        <!-- Card Top Bar -->
        <div class="p-6 pb-4 flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm font-mono shadow-sm', categoryIconColor(cat.code)]">
              {{ cat.code }}
            </div>
            <div>
              <h3 @click="viewCategory(cat)" class="font-bold text-slate-800 group-hover:text-teal-600 transition-colors cursor-pointer text-base line-clamp-1">
                {{ cat.name }}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Order: {{ cat.displayOrder || 0 }}</p>
            </div>
          </div>

          <!-- Status badge -->
          <span :class="['px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0', cat.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200']">
            {{ cat.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <!-- Card Body -->
        <div class="px-6 py-2 flex-grow">
          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2rem]">
            {{ cat.description || 'No description provided.' }}
          </p>

          <!-- Metric -->
          <div class="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span class="font-medium flex items-center gap-1.5 text-slate-600">
              <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tests Available:
            </span>
            <span class="font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              {{ cat.testCount || 0 }}
            </span>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          <button 
            @click="viewCategory(cat)"
            class="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View Tests</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div class="flex items-center gap-1">
            <button 
              @click="openEditModal(cat)"
              title="Edit Category"
              class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              @click="handleDelete(cat)"
              title="Delete Category"
              class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Footer -->
    <div v-if="endoscopyStore.pagination.pages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
      <p class="text-xs text-slate-500 font-medium">
        Showing Page <span class="font-bold text-slate-700">{{ endoscopyStore.pagination.page }}</span> of <span class="font-bold text-slate-700">{{ endoscopyStore.pagination.pages }}</span> (Total {{ endoscopyStore.pagination.total }} categories)
      </p>

      <div class="flex items-center gap-2">
        <button 
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Previous
        </button>
        <button 
          @click="currentPage++"
          :disabled="currentPage >= endoscopyStore.pagination.pages"
          class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <CreateCategoryModal 
      :show="isCreateModalOpen"
      :category="selectedCategory"
      @close="isCreateModalOpen = false"
      @created="handleCategoryCreated"
      @updated="handleCategoryUpdated"
    />
  </div>
</template>
