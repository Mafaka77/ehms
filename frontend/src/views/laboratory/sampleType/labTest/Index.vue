<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLabStore } from '../../../../stores/labStore'
import { useSnackbarStore } from '../../../../stores/snackbarStore'
import CreateLabTestModal from './Create.vue'

const route = useRoute()
const router = useRouter()
const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const sampleTypeId = route.params.id
const currentSampleType = ref(null)

const isCreateModalOpen = ref(false)
const selectedTest = ref(null)
const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')

const fetchSampleTypeDetails = async () => {
  // If sample types aren't loaded or not found, try to fetch it
  if (labStore.sampleTypes.length === 0) {
    await labStore.fetchSampleTypes(1, 1000)
  }
  currentSampleType.value = labStore.sampleTypes.find(st => st._id === sampleTypeId)
}

const fetchTests = async () => {
  try {
    // Pass sampleTypeId to fetchTests to filter them
    await labStore.fetchTests(currentPage.value, limit.value, searchQuery.value, sampleTypeId)
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedTest.value = { sampleTypeId: sampleTypeId }
  isCreateModalOpen.value = true
}

const openEditModal = (test) => {
  selectedTest.value = test
  isCreateModalOpen.value = true
}

const handleTestCreated = (newTest) => {
  if (currentPage.value === 1) {
    labStore.tests.unshift(newTest)
    if (labStore.tests.length > limit.value) {
      labStore.tests.pop()
    }
    labStore.testPagination.total++
  } else {
    fetchTests()
  }
}

const handleTestUpdated = (updatedTest) => {
  fetchTests()
}

const filteredTests = computed(() => {
  return labStore.tests
})

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchTests()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchTests()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleDelete = async (test) => {
  if (confirm(`Are you sure you want to delete the ${test.name} test?`)) {
    const response = await labStore.deleteTest(test._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message,
        type: 'success'
      })
      if (labStore.tests.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchTests()
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
  fetchSampleTypeDetails()
  fetchTests()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Breadcrumb & Page Header -->
    <div>
      <nav class="flex items-center text-sm font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
        <router-link :to="{ name: 'laboratory-sample-type' }" class="hover:text-indigo-600 transition-colors">Sample Types</router-link>
        <svg class="w-4 h-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        <span class="text-slate-900" aria-current="page">{{ currentSampleType?.name || 'View details' }}</span>
      </nav>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {{ currentSampleType?.name || 'Loading...' }} 
            <span v-if="currentSampleType?.code" class="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono border border-indigo-100">{{ currentSampleType.code }}</span>
          </h1>
          <p class="text-slate-500 mt-1 text-sm">Manage laboratory tests for this sample type.</p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="router.push({ name: 'laboratory-sample-type' })"
            class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-100"
          >
            Back
          </button>
          <button 
            @click="openAddModal"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Test
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">Associated Tests</h2>
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search tests..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="labStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading tests...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTests.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No tests found for this sample type</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          {{ searchQuery ? "No results match your search query. Try typing something else." : "Get started by adding the first lab test for this sample type." }}
        </p>
        <button 
          v-if="!searchQuery"
          @click="openAddModal"
          class="mt-5 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Lab Test
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Test Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Category</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Rate</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="test in filteredTests" 
              :key="test._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Name -->
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-800 text-sm">{{ test.name }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 font-mono">{{ test.code }}</span>
                  </div>
                  <span class="text-xs text-slate-400 mt-1">TAT: {{ test.turnaroundTimeHours || '-' }} hrs | Type: {{ test.reportType }}</span>
                </div>
              </td>
              <!-- Category -->
              <td class="px-6 py-4">
                <span class="inline-flex items-center w-max px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {{ test.categoryId?.name || 'No Category' }}
                </span>
              </td>
              <!-- Rate -->
              <td class="px-6 py-4 font-medium text-slate-700 text-sm">
              ₹{{ test.rate?.toFixed(2) || '0.00' }}
              </td>
              <!-- Status -->
              <td class="px-6 py-4 text-center">
                <span 
                  :class="test.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                >
                  <span 
                    :class="test.isActive ? 'bg-emerald-500' : 'bg-slate-400'"
                    class="w-1.5 h-1.5 rounded-full mr-1.5"
                  ></span>
                  {{ test.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="router.push({ name: 'laboratory-test-params', params: { id: test._id } })"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
                    title="View Parameters"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    @click="openEditModal(test)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Test"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="handleDelete(test)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete Test"
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
        v-if="labStore.testPagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, labStore.testPagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ labStore.testPagination.total }}</span> 
          entries
        </span>

        <div v-if="labStore.testPagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            v-for="page in labStore.testPagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < labStore.testPagination.pages && currentPage++"
            :disabled="currentPage === labStore.testPagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Lab Test Modal Component -->
    <!-- We reuse the existing Create.vue for lab test but it handles its own logic -->
    <CreateLabTestModal 
      :show="isCreateModalOpen"
      :test="selectedTest"
      @close="isCreateModalOpen = false"
      @created="handleTestCreated"
      @updated="handleTestUpdated"
    />
  </div>
</template>
