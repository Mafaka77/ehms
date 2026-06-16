<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRadiologyStore } from '../../../stores/radiologyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const radiologyStore = useRadiologyStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

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
  rate: '',
  preparation: '',
  isActive: true
})

// ── Fetch Category ────────────────────────────────────────
const fetchCategory = async () => {
  loadingCategory.value = true
  try {
    category.value = await radiologyStore.getCategoryById(categoryId)
  } catch (err) {
    snackbarStore.show({ message: 'Failed to load category', type: 'error' })
    router.push({ name: 'radiology-category' })
  } finally {
    loadingCategory.value = false
  }
}

// ── Fetch Tests ───────────────────────────────────────────
const fetchTests = async () => {
  loadingTests.value = true
  try {
    const result = await radiologyStore.fetchTests(categoryId, testPage.value, 15, testSearch.value)
    tests.value = result.data
    testPagination.value = result.pagination
  } finally {
    loadingTests.value = false
  }
}

// ── Test Modal ────────────────────────────────────────────
const openAddTest = () => {
  editingTest.value = null
  Object.assign(testForm, { code: '', name: '', rate: '', preparation: '', isActive: true })
  testError.value = ''
  showTestModal.value = true
}

const openEditTest = (test) => {
  editingTest.value = test
  Object.assign(testForm, {
    code: test.code,
    name: test.name,
    rate: test.rate,
    preparation: test.preparation || '',
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
    const payload = { ...testForm, rate: Number(testForm.rate), radiologyId: categoryId }
    let response
    if (editingTest.value) {
      response = await radiologyStore.updateTest(editingTest.value._id, payload)
    } else {
      response = await radiologyStore.createTest(payload)
    }
    if (response.success) {
      snackbarStore.show({ message: response.message, type: 'success' })
      closeTestModal()
      fetchTests()
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
  const response = await radiologyStore.deleteTest(test._id)
  if (response.success) {
    snackbarStore.show({ message: response.message, type: 'success' })
    fetchTests()
  } else {
    snackbarStore.show({ message: response.message, type: 'error' })
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
const formatCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

let debounce = null
const onSearch = () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { testPage.value = 1; fetchTests() }, 400)
}

const categoryIconColor = (code) => {
  const colors = { XRAY: 'from-sky-500 to-cyan-400', USG: 'from-violet-500 to-purple-400', CT: 'from-amber-500 to-orange-400', MRI: 'from-indigo-500 to-blue-400', CARDIAC: 'from-rose-500 to-pink-400', NEURO: 'from-teal-500 to-emerald-400', PFT: 'from-green-500 to-lime-400' }
  return colors[code?.toUpperCase()] || 'from-indigo-500 to-violet-400'
}

onMounted(async () => {
  await fetchCategory()
  await fetchTests()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Back Button -->
    <div>
      <button
        @click="router.back()"
        class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Categories
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loadingCategory" class="animate-pulse space-y-6">
      <div class="h-36 bg-slate-100 rounded-2xl"></div>
      <div class="h-64 bg-slate-100 rounded-2xl"></div>
    </div>

    <template v-else-if="category">
      <!-- Category Hero Card -->
      <div class="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <!-- Gradient banner -->
        <div class="h-3 w-full bg-gradient-to-r" :class="categoryIconColor(category.code)"></div>
        <div class="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <!-- Icon -->
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-xl flex-shrink-0 bg-gradient-to-br"
            :class="categoryIconColor(category.code)"
          >
            {{ category.code?.charAt(0) }}
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3 mb-1">
              <h1 class="text-2xl font-bold text-slate-900">{{ category.name }}</h1>
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 tracking-widest">{{ category.code }}</span>
              <span v-if="category.isActive" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
              </span>
              <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
              </span>
            </div>
            <p class="text-slate-500 text-sm">{{ category.description || 'No description provided.' }}</p>
            <p class="text-xs text-slate-400 mt-2">Created {{ formatDate(category.createdAt) }}</p>
          </div>
          <!-- Stats -->
          <div class="flex gap-6 text-center flex-shrink-0">
            <div class="px-4">
              <p class="text-3xl font-bold text-slate-800">{{ testPagination.total }}</p>
              <p class="text-xs text-slate-400 mt-0.5 font-medium">Total Tests</p>
            </div>
            <div class="px-4">
              <p class="text-3xl font-bold text-emerald-600">{{ tests.filter(t => t.isActive).length }}</p>
              <p class="text-xs text-slate-400 mt-0.5 font-medium">Active</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tests Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">Radiology Tests</h2>
            <p class="text-sm text-slate-400 mt-0.5">All tests under this category</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Search -->
            <div class="relative w-full md:w-64">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                v-model="testSearch"
                @input="onSearch"
                type="text"
                placeholder="Search tests..."
                class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
            <!-- Add Test -->
            <button
              v-if="authStore.hasPermission('radiology.create')"
              @click="openAddTest"
              class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Test
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingTests" class="flex items-center justify-center py-20">
          <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Empty state -->
        <div v-else-if="tests.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-slate-600 font-semibold">No tests found</p>
          <p class="text-sm text-slate-400 mt-1">{{ testSearch ? 'No results match your search.' : 'Add the first test for this category.' }}</p>
          <button
            v-if="!testSearch && authStore.hasPermission('radiology.create')"
            @click="openAddTest"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add First Test
          </button>
        </div>

        <!-- Tests Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Test Name</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Code</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Rate</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Preparation</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Status</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Created</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="test in tests"
                :key="test._id"
                class="hover:bg-slate-50/50 transition-colors group"
              >
                <!-- Name -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold group-hover:bg-indigo-100 transition-colors shrink-0">
                      {{ test.name?.charAt(0) }}
                    </div>
                    <span class="font-semibold text-slate-800 text-sm">{{ test.name }}</span>
                  </div>
                </td>
                <!-- Code -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 tracking-wider">{{ test.code }}</span>
                </td>
                <!-- Rate -->
                <td class="px-6 py-4">
                  <span class="text-sm font-semibold text-emerald-700">{{ formatCurrency(test.rate) }}</span>
                </td>
                <!-- Preparation -->
                <td class="px-6 py-4 text-sm text-slate-500 max-w-xs">
                  <span class="truncate block" :title="test.preparation">{{ test.preparation || '—' }}</span>
                </td>
                <!-- Status -->
                <td class="px-6 py-4">
                  <span v-if="test.isActive" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                  </span>
                </td>
                <!-- Created -->
                <td class="px-6 py-4 text-sm text-slate-500">{{ formatDate(test.createdAt) }}</td>
                <!-- Actions -->
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      v-if="authStore.hasPermission('radiology.update')"
                      @click="openEditTest(test)"
                      class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      title="Edit Test"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      v-if="authStore.hasPermission('radiology.delete')"
                      @click="handleDeleteTest(test)"
                      class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                      title="Delete Test"
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

        <!-- Pagination -->
        <div v-if="testPagination.total > 0" class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10">
          <span class="text-sm text-slate-500">
            Showing <span class="font-semibold text-slate-800">{{ (testPage - 1) * 15 + 1 }}</span>
            to <span class="font-semibold text-slate-800">{{ Math.min(testPage * 15, testPagination.total) }}</span>
            of <span class="font-semibold text-slate-800">{{ testPagination.total }}</span> tests
          </span>
          <div v-if="testPagination.pages > 1" class="flex items-center gap-2">
            <button @click="testPage > 1 && testPage--; fetchTests()" :disabled="testPage === 1" class="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              v-for="p in testPagination.pages"
              :key="p"
              @click="testPage = p; fetchTests()"
              class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
              :class="testPage === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
            >{{ p }}</button>
            <button @click="testPage < testPagination.pages && testPage++; fetchTests()" :disabled="testPage === testPagination.pages" class="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- Add / Edit Test Modal -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTestModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div @click="closeTestModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative z-10">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 class="text-lg font-bold text-slate-900">{{ editingTest ? 'Edit Test' : 'Add New Test' }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">{{ category?.name }} — {{ category?.code }}</p>
              </div>
              <button @click="closeTestModal" :disabled="testLoading" class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <!-- Body -->
            <form @submit.prevent="submitTest" class="p-6 space-y-4">
              <!-- Error -->
              <div v-if="testError" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
                <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>{{ testError }}</span>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <!-- Code -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Code <span class="text-rose-500">*</span></label>
                  <input v-model="testForm.code" :disabled="testLoading || !!editingTest" placeholder="e.g. CT-BRAIN" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-50 uppercase" />
                </div>
                <!-- Rate -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Rate (₹) <span class="text-rose-500">*</span></label>
                  <input v-model="testForm.rate" :disabled="testLoading" type="number" min="0" placeholder="e.g. 1500" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-50" />
                </div>
              </div>

              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Test Name <span class="text-rose-500">*</span></label>
                <input v-model="testForm.name" :disabled="testLoading" placeholder="e.g. CT Brain Plain" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-50" />
              </div>

              <!-- Preparation -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Preparation Instructions <span class="text-slate-400 font-normal">(optional)</span></label>
                <textarea v-model="testForm.preparation" :disabled="testLoading" rows="2" placeholder="e.g. Fasting for 4 hours before the scan..." class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none disabled:bg-slate-50"></textarea>
              </div>

              <!-- Is Active -->
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input id="testIsActive" type="checkbox" v-model="testForm.isActive" :disabled="testLoading" class="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500" />
                <label for="testIsActive" class="text-sm font-medium text-slate-700 cursor-pointer">Active Status</label>
              </div>

              <!-- Footer -->
              <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" @click="closeTestModal" :disabled="testLoading" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" :disabled="testLoading" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                  <svg v-if="testLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ testLoading ? 'Saving...' : (editingTest ? 'Save Changes' : 'Add Test') }}</span>
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
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .bg-white { opacity: 0; transform: scale(0.92) translateY(20px); }
.modal-fade-leave-to .bg-white { opacity: 0; transform: scale(0.95); }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
.animate-shake { animation: shake 0.4s ease-in-out; }
</style>
