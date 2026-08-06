<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEndoscopyStore } from '../../../stores/endoscopyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const endoscopyStore = useEndoscopyStore()
const snackbarStore = useSnackbarStore()

const categoryId = props.id || route.params.id

// ── State ────────────────────────────────────────────────
const category = ref(null)
const tests = ref([])
const testPagination = ref({ total: 0, pages: 1 })
const loadingCategory = ref(true)
const loadingTests = ref(false)
const testPage = ref(1)
const testSearch = ref('')

// ── Add/Edit Test Modal state ─────────────────────────────
const showTestModal = ref(false)
const editingTest = ref(null)
const testLoading = ref(false)
const testError = ref('')
const testForm = reactive({
  code: '',
  name: '',
  duration: 30,
  rate: '',
  preparation: '',
  indications: '',
  contraindications: '',
  isActive: true
})

// ── Fetch Category ────────────────────────────────────────
const fetchCategory = async () => {
  loadingCategory.value = true
  try {
    category.value = await endoscopyStore.getCategoryById(categoryId)
  } catch (err) {
    snackbarStore.show({ message: 'Failed to load endoscopy category', type: 'error' })
    router.push({ name: 'endoscopy-category' })
  } finally {
    loadingCategory.value = false
  }
}

// ── Fetch Tests ───────────────────────────────────────────
const fetchTests = async () => {
  loadingTests.value = true
  try {
    const result = await endoscopyStore.fetchTests(categoryId, testPage.value, 15, testSearch.value)
    tests.value = result.data
    testPagination.value = result.pagination
  } finally {
    loadingTests.value = false
  }
}

// ── Test Modal ────────────────────────────────────────────
const openAddTest = () => {
  editingTest.value = null
  Object.assign(testForm, {
    code: '',
    name: '',
    duration: 30,
    rate: '',
    preparation: '',
    indications: '',
    contraindications: '',
    isActive: true
  })
  testError.value = ''
  showTestModal.value = true
}

const openEditTest = (test) => {
  editingTest.value = test
  Object.assign(testForm, {
    code: test.code,
    name: test.name,
    duration: test.duration || 30,
    rate: test.rate,
    preparation: test.preparation || '',
    indications: test.indications || '',
    contraindications: test.contraindications || '',
    isActive: test.isActive
  })
  testError.value = ''
  showTestModal.value = true
}

const closeTestModal = () => {
  if (testLoading.value) return
  showTestModal.value = false
}

const submitTest = async () => {
  if (!testForm.code.trim()) { testError.value = 'Code is required'; return }
  if (!testForm.name.trim()) { testError.value = 'Name is required'; return }
  if (!testForm.rate || isNaN(testForm.rate) || Number(testForm.rate) < 0) { testError.value = 'Valid rate is required'; return }

  testLoading.value = true
  testError.value = ''
  try {
    const payload = {
      ...testForm,
      duration: Number(testForm.duration) || 30,
      rate: Number(testForm.rate),
      categoryId
    }
    let response
    if (editingTest.value) {
      response = await endoscopyStore.updateTest(editingTest.value._id, payload)
    } else {
      response = await endoscopyStore.createTest(payload)
    }
    if (response.success) {
      snackbarStore.show({ message: response.message, type: 'success' })
      closeTestModal()
      fetchTests()
      fetchCategory()
    } else {
      testError.value = response.message
    }
  } catch (err) {
    testError.value = err.message || 'An error occurred'
  } finally {
    testLoading.value = false
  }
}

const handleDeleteTest = async (test) => {
  if (!confirm(`Delete test "${test.name}"?`)) return
  const response = await endoscopyStore.deleteTest(test._id)
  if (response.success) {
    snackbarStore.show({ message: response.message, type: 'success' })
    fetchTests()
    fetchCategory()
  } else {
    snackbarStore.show({ message: response.message, type: 'error' })
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}

onMounted(() => {
  fetchCategory()
  fetchTests()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Back Button & Breadcrumbs -->
    <div class="flex items-center gap-4">
      <button 
        @click="router.push({ name: 'endoscopy-category' })"
        class="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider">
          <span>Endoscopy Module</span>
          <span>/</span>
          <span>Category View</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mt-0.5">
          {{ loadingCategory ? 'Loading...' : category?.name }}
        </h1>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loadingCategory" class="bg-white rounded-2xl p-8 border border-slate-100 animate-pulse space-y-4">
      <div class="h-6 bg-slate-200 rounded w-1/4"></div>
      <div class="h-4 bg-slate-100 rounded w-1/2"></div>
    </div>

    <template v-else-if="category">
      <!-- Category Banner Card -->
      <div class="bg-gradient-to-br from-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <!-- Abstract Shapes -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-mono font-bold text-xs rounded-lg uppercase tracking-wider border border-white/20">
                Code: {{ category.code }}
              </span>
              <span :class="['px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider', category.isActive ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30']">
                {{ category.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <h2 class="text-3xl font-extrabold tracking-tight">{{ category.name }}</h2>
            <p class="text-teal-100 text-sm max-w-2xl leading-relaxed">
              {{ category.description || 'No detailed description provided for this endoscopy category.' }}
            </p>
          </div>

          <div class="flex items-center gap-4 shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-auto">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-teal-200 font-medium uppercase">Configured Tests</p>
              <p class="text-2xl font-bold font-mono">{{ category.testCount || tests.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Endoscopy Tests Section -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-6">
        <!-- Section Header -->
        <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Endoscopy Tests</h3>
            <p class="text-xs text-slate-500 mt-0.5">Define procedures, rates, durations, and preparations for this category.</p>
          </div>

          <button 
            @click="openAddTest"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Endoscopy Test
          </button>
        </div>

        <!-- Search Bar -->
        <div class="px-6 flex items-center justify-between gap-4">
          <div class="relative w-full sm:w-72">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="testSearch" 
              @input="fetchTests"
              type="text" 
              placeholder="Search tests by code or name..." 
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <!-- Tests Table -->
        <div class="overflow-x-auto">
          <div v-if="loadingTests" class="p-12 text-center text-slate-400">
            <svg class="animate-spin h-8 w-8 text-teal-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs">Loading tests...</span>
          </div>

          <div v-else-if="tests.length === 0" class="p-12 text-center text-slate-400">
            <svg class="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-slate-700 font-semibold text-sm">No endoscopy tests registered</p>
            <p class="text-slate-400 text-xs mt-0.5">Click "Add Endoscopy Test" above to configure tests for {{ category.name }}.</p>
          </div>

          <table v-else class="w-full text-left text-xs whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th class="px-6 py-4">Test Code</th>
                <th class="px-6 py-4">Test Name</th>
                <th class="px-6 py-4">Duration</th>
                <th class="px-6 py-4">Preparation & Instructions</th>
                <th class="px-6 py-4 text-right">Rate</th>
                <th class="px-6 py-4 text-center">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="t in tests" :key="t._id" class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-slate-900">
                  {{ t.code }}
                </td>
                <td class="px-6 py-4 font-semibold text-slate-800">
                  {{ t.name }}
                </td>
                <td class="px-6 py-4 text-slate-500">
                  {{ t.duration || 30 }} mins
                </td>
                <td class="px-6 py-4 text-slate-500 max-w-xs truncate">
                  {{ t.preparation || '-' }}
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-teal-700">
                  {{ formatCurrency(t.rate) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase border', t.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200']">
                    {{ t.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button 
                      @click="openEditTest(t)" 
                      class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Test"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click="handleDeleteTest(t)" 
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Test"
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
      </div>
    </template>

    <!-- Add/Edit Endoscopy Test Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTestModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          <div @click="closeTestModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"></div>

          <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative z-10">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 class="text-base font-bold text-slate-900">{{ editingTest ? 'Edit Endoscopy Test' : 'Add Endoscopy Test' }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">Under Category: <span class="font-semibold text-teal-700">{{ category?.name }}</span></p>
              </div>
              <button @click="closeTestModal" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="submitTest" class="p-6 space-y-4">
              <div v-if="testError" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-xs">
                {{ testError }}
              </div>

              <div class="grid grid-cols-2 gap-4">
                <BaseInput 
                  v-model="testForm.code"
                  id="testCode"
                  label="Test Code"
                  placeholder="e.g. EGD01, COL01"
                  required
                  :disabled="testLoading || !!editingTest"
                />

                <BaseInput 
                  v-model.number="testForm.rate"
                  id="testRate"
                  type="number"
                  step="0.01"
                  label="Rate / Fee (INR)"
                  placeholder="0.00"
                  required
                  :disabled="testLoading"
                />
              </div>

              <BaseInput 
                v-model="testForm.name"
                id="testName"
                label="Test Name"
                placeholder="e.g. Diagnostic Upper GI Endoscopy"
                required
                :disabled="testLoading"
              />

              <BaseInput 
                v-model.number="testForm.duration"
                id="testDuration"
                type="number"
                label="Duration (minutes)"
                placeholder="30"
                :disabled="testLoading"
              />

              <div>
                <label for="preparation" class="block text-xs font-semibold text-slate-700 mb-1">Patient Preparation Instructions</label>
                <textarea 
                  id="preparation"
                  v-model="testForm.preparation"
                  rows="2"
                  placeholder="e.g. Fasting 8 hours prior to procedure..."
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all resize-none"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="indications" class="block text-xs font-semibold text-slate-700 mb-1">Indications</label>
                  <textarea 
                    id="indications"
                    v-model="testForm.indications"
                    rows="2"
                    placeholder="Clinical indications..."
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all resize-none"
                  ></textarea>
                </div>
                <div>
                  <label for="contraindications" class="block text-xs font-semibold text-slate-700 mb-1">Contraindications</label>
                  <textarea 
                    id="contraindications"
                    v-model="testForm.contraindications"
                    rows="2"
                    placeholder="Contraindications..."
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input id="testIsActive" type="checkbox" v-model="testForm.isActive" class="w-4 h-4 text-teal-600 rounded">
                <label for="testIsActive" class="text-xs font-medium text-slate-700 cursor-pointer">Active Status</label>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" @click="closeTestModal" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" :disabled="testLoading" class="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  <span v-if="testLoading" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                  <span>{{ editingTest ? 'Update Test' : 'Save Test' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
