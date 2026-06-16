<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const router = useRouter()
const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const categories = ref([])
const showAddModal = ref(false)
const submitting = ref(false)

const form = ref({
  code: '',
  name: '',
  description: ''
})

const fetchCategories = async () => {
  loading.value = true
  const res = await admissionStore.fetchChargeCategories()
  if (res.success) {
    categories.value = res.data
  } else {
    snackbarStore.show({ message: res.message || 'Failed to fetch categories', type: 'error' })
  }
  loading.value = false
}

const getCategoryIcon = (code) => {
  switch (code) {
    case 'ROOM': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16'
    case 'LAB': return 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547'
    case 'PHARMACY': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2'
    case 'DOCTOR': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    default: return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }
}

const viewCategory = (id) => {
  router.push({ name: 'ipd-charges-view', params: { id } })
}

const openAddModal = () => {
  form.value = {
    code: '',
    name: '',
    description: ''
  }
  showAddModal.value = true
}

const submitCategory = async () => {
  if (!form.value.code.trim()) {
    snackbarStore.show({ message: 'Category code is required.', type: 'warning' })
    return
  }
  if (!form.value.name.trim()) {
    snackbarStore.show({ message: 'Category name is required.', type: 'warning' })
    return
  }

  submitting.value = true
  const res = await admissionStore.createChargeCategory(form.value)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge category created successfully', type: 'success' })
    showAddModal.value = false
    await fetchCategories()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to create category', type: 'error' })
  }
  submitting.value = false
}

const isProtectedCategory = (code) => {
  return ['ROOM', 'LAB', 'PHARMACY', 'DOCTOR', 'ENDOSCOPY', 'RADIOLOGY'].includes(code?.toUpperCase())
}

const deleteCategory = async (cat) => {
  if (isProtectedCategory(cat.code)) {
    snackbarStore.show({ message: 'This is a system-protected category and cannot be deleted.', type: 'error' })
    return
  }

  if (!confirm(`Are you sure you want to delete the category "${cat.name}"? This will also delete all associated service rates and package components under it. This action cannot be undone.`)) {
    return
  }

  loading.value = true
  const res = await admissionStore.deleteChargeCategory(cat._id)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge category deleted successfully', type: 'success' })
    await fetchCategories()
  } else {
    snackbarStore.show({ message: res.message || 'Failed to delete category', type: 'error' })
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Charges Management</h1>
        <p class="text-slate-500 mt-1 text-sm">Configure billing rates, service fees, and diagnostic charges under specific categories.</p>
      </div>
      <button 
        @click="openAddModal"
        class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading charge categories...
    </div>

    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 shadow-sm">
      <p class="font-semibold text-slate-700">No charge categories found.</p>
      <p class="text-xs text-slate-400 mt-1">Please ensure seeders are run successfully to populate charge categories.</p>
    </div>

    <!-- Main List Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="cat in categories" 
        :key="cat._id" 
        class="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
      >
        <!-- Card Body -->
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="getCategoryIcon(cat.code)" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm leading-tight">{{ cat.name }}</h3>
              <span class="text-[10px] font-mono font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">{{ cat.code }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed min-h-[36px]">
            {{ cat.description || 'No description provided.' }}
          </p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-50">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</span>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold border"
              :class="cat.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'"
            >
              {{ cat.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <!-- Card Action Button -->
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-50 flex justify-between items-center gap-2">
          <div>
            <button 
              v-if="!isProtectedCategory(cat.code)"
              @click="deleteCategory(cat)"
              class="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Delete Category"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <span v-else class="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded-md flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Protected
            </span>
          </div>
          <button 
            @click="viewCategory(cat._id)"
            class="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Rates
          </button>
        </div>
      </div>
    </div>

    <!-- Add Category Modal -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Add Charge Category</h3>
            <p class="text-xs text-slate-400 mt-0.5">Create a new high-level category for inpatient billing.</p>
          </div>
          <button 
            @click="showAddModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4 overflow-y-auto">
          <!-- Code -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Category Code</label>
            <input 
              type="text" 
              v-model="form.code"
              placeholder="E.g. PHYSIO, MEALS, OT_SURGERY..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all uppercase"
            />
          </div>

          <!-- Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Category Name</label>
            <input 
              type="text" 
              v-model="form.name"
              placeholder="E.g. Physiotherapy Charges..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea 
              v-model="form.description"
              rows="3"
              placeholder="Describe what charges will be billed under this category..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" @click="showAddModal = false" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancel</button>
          <button type="button" @click="submitCategory" :disabled="submitting" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Save Category
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
