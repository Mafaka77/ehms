<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLabStore } from '../../../../../stores/labStore'
import { useSnackbarStore } from '../../../../../stores/snackbarStore'
import CreateParamModal from './Create.vue'

const route = useRoute()
const router = useRouter()
const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const testId = route.params.id
const currentTest = ref(null)

const isCreateModalOpen = ref(false)
const selectedParam = ref(null)
const currentPage = ref(1)
const limit = ref(10)
const searchQuery = ref('')

const fetchTestDetails = async () => {
  if (labStore.tests.length === 0) {
    // We fetch tests if not loaded
    await labStore.fetchTests(1, 1000)
  }
  currentTest.value = labStore.tests.find(t => t._id === testId)
}

const fetchTestParameters = async () => {
  try {
    await labStore.fetchTestParameters(currentPage.value, limit.value, searchQuery.value, testId)
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedParam.value = { testId: testId }
  isCreateModalOpen.value = true
}

const openEditModal = (param) => {
  selectedParam.value = param
  isCreateModalOpen.value = true
}

const handleParamCreated = (newParam) => {
  if (currentPage.value === 1) {
    labStore.testParameters.unshift(newParam)
    // Sort by display order dynamically
    labStore.testParameters.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    if (labStore.testParameters.length > limit.value) {
      labStore.testParameters.pop()
    }
    labStore.testParameterPagination.total++
  } else {
    fetchTestParameters()
  }
}

const handleParamUpdated = (updatedParam) => {
  fetchTestParameters()
}

const groupedParams = computed(() => {
  const groups = {}
  labStore.testParameters.forEach(param => {
    const section = param.section || 'General'
    if (!groups[section]) groups[section] = []
    groups[section].push(param)
  })
  
  return Object.keys(groups).map(section => {
    return {
      section,
      params: groups[section].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }
  }).sort((a, b) => a.section.localeCompare(b.section))
})

let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchTestParameters()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchTestParameters()
})

const handleDelete = async (param) => {
  if (confirm(`Are you sure you want to delete the parameter ${param.name}?`)) {
    const response = await labStore.deleteTestParameter(param._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message,
        type: 'success'
      })
      if (labStore.testParameters.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchTestParameters()
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
  fetchTestDetails()
  fetchTestParameters()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Breadcrumb & Page Header -->
    <div>
      <nav class="flex items-center text-sm font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
        <router-link :to="{ name: 'laboratory-sample-type' }" class="hover:text-indigo-600 transition-colors">Sample Types</router-link>
        <svg class="w-4 h-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        <button v-if="currentTest?.sampleTypeId" @click="router.push({ name: 'laboratory-sample-type-view', params: { id: currentTest.sampleTypeId._id || currentTest.sampleTypeId } })" class="hover:text-indigo-600 transition-colors">
          {{ currentTest.sampleTypeId.name || 'Sample Type Tests' }}
        </button>
        <span v-else class="hover:text-indigo-600 transition-colors cursor-pointer" @click="router.go(-1)">Test List</span>
        <svg class="w-4 h-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        <span class="text-slate-900" aria-current="page">{{ currentTest?.name || 'Test Parameters' }}</span>
      </nav>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {{ currentTest?.name || 'Loading...' }} 
            <span v-if="currentTest?.code" class="text-xs px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono border border-indigo-100">{{ currentTest.code }}</span>
          </h1>
          <p class="text-slate-500 mt-1 text-sm">Manage individual test parameters and normal ranges.</p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="router.go(-1)"
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
            Add Parameter
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">Test Parameters</h2>
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search parameters..." 
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
        <span class="text-sm font-medium">Loading parameters...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTests?.length === 0 || groupedParams?.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No parameters found for this test</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          {{ searchQuery ? "No results match your search query." : "Add parameters to define what is being tested." }}
        </p>
        <button 
          v-if="!searchQuery"
          @click="openAddModal"
          class="mt-5 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add First Parameter
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-16 text-center">Order</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Parameter Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Unit</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Reference Ranges</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody v-for="group in groupedParams" :key="group.section" class="divide-y divide-slate-100 border-b-[3px] border-slate-100/80">
            <!-- Group Header -->
            <tr class="bg-slate-50/80">
              <td colspan="5" class="px-6 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-y border-slate-200">
                {{ group.section }}
              </td>
            </tr>
            <tr 
              v-for="param in group.params" 
              :key="param._id"
              class="hover:bg-slate-50/50 transition-colors group bg-white"
            >
              <!-- Order -->
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {{ param.displayOrder || 0 }}
                </span>
              </td>
              <!-- Name -->
              <td class="px-6 py-4">
                <span class="font-semibold text-slate-800 text-sm">{{ param.name }}</span>
              </td>
              <!-- Unit -->
              <td class="px-6 py-4">
                <span v-if="param.unit" class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono">{{ param.unit }}</span>
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <!-- Ranges -->
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1 text-xs text-slate-600">
                  <template v-if="param.referenceIntervals && param.referenceIntervals.length > 0">
                    <div v-for="(interval, idx) in param.referenceIntervals" :key="idx" class="flex gap-1">
                      <span class="font-semibold text-indigo-600 min-w-[70px] inline-block">{{ interval.label }}:</span>
                      <span>{{ interval.range }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div v-if="param.normalRangeMale"><span class="font-semibold text-blue-600 w-4 inline-block">M:</span> {{ param.normalRangeMale }}</div>
                    <div v-if="param.normalRangeFemale"><span class="font-semibold text-pink-600 w-4 inline-block">F:</span> {{ param.normalRangeFemale }}</div>
                    <div v-if="param.normalRangeChild"><span class="font-semibold text-emerald-600 w-4 inline-block">C:</span> {{ param.normalRangeChild }}</div>
                    <div v-if="!param.normalRangeMale && !param.normalRangeFemale && !param.normalRangeChild" class="text-slate-400 italic">No ranges defined</div>
                  </template>
                </div>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(param)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Parameter"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="handleDelete(param)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete Parameter"
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
        v-if="labStore.testParameterPagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, labStore.testParameterPagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ labStore.testParameterPagination.total }}</span> 
          entries
        </span>

        <div v-if="labStore.testParameterPagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            v-for="page in labStore.testParameterPagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < labStore.testParameterPagination.pages && currentPage++"
            :disabled="currentPage === labStore.testParameterPagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Lab Test Parameter Modal Component -->
    <CreateParamModal 
      :show="isCreateModalOpen"
      :param="selectedParam"
      @close="isCreateModalOpen = false"
      @created="handleParamCreated"
      @updated="handleParamUpdated"
    />
  </div>
</template>
