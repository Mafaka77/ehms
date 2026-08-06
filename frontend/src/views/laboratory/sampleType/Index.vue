<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CreateSampleTypeModal from './Create.vue'
import { useLabStore } from '../../../stores/labStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const router = useRouter()
const labStore = useLabStore()
const snackbarStore = useSnackbarStore()
const isCreateModalOpen = ref(false)
const selectedSampleType = ref(null)

const currentPage = ref(1)
const limit = ref(10)
const isExportingPdf = ref(false)

const fetchSampleTypes = async () => {
  try {
    await labStore.fetchSampleTypes(currentPage.value, limit.value, labStore.searchQuery);
  } catch (err) {
    console.error(err)
  }
}

const openAddModal = () => {
  selectedSampleType.value = null
  isCreateModalOpen.value = true
}

const openEditModal = (type) => {
  selectedSampleType.value = type
  isCreateModalOpen.value = true
}

const viewSampleType = (type) => {
  router.push({ name: 'laboratory-sample-type-view', params: { id: type._id } })
}

const handleSampleTypeCreated = (newType) => {
  if (currentPage.value === 1) {
    labStore.sampleTypes.unshift(newType)
    if (labStore.sampleTypes.length > limit.value) {
      labStore.sampleTypes.pop()
    }
    labStore.sampleTypePagination.total++
  } else {
    fetchSampleTypes()
  }
}

const handleSampleTypeUpdated = (updatedType) => {
  fetchSampleTypes()
}

const exportAllTestsPdf = async () => {
  isExportingPdf.value = true
  try {
    const tests = await labStore.fetchAllTestsForExport()
    if (!tests || tests.length === 0) {
      snackbarStore.show({ message: 'No laboratory tests found to export.', type: 'warning' })
      isExportingPdf.value = false
      return
    }

    const sortedTests = [...tests].sort((a, b) => {
      const sampleA = a.sampleTypeId?.name || 'Unassigned'
      const sampleB = b.sampleTypeId?.name || 'Unassigned'
      const sampleComp = sampleA.localeCompare(sampleB)
      if (sampleComp !== 0) return sampleComp
      return (a.name || '').localeCompare(b.name || '')
    })

    const totalTests = sortedTests.length
    const categoriesSet = new Set(sortedTests.map(t => t.categoryId?.name).filter(Boolean))
    const totalCategories = categoriesSet.size

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laboratory Test Directory & Price List - ${new Date().toLocaleDateString('en-IN')}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 18px; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 20px; color: #3730a3; text-transform: uppercase; letter-spacing: 0.8px; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            
            .meta-bar { display: flex; justify-content: space-between; background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 16px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 700; color: #3730a3; text-transform: uppercase; font-size: 9.5px; }
            .meta-val { font-weight: 600; color: #1e293b; margin-top: 2px; }

            table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
            th { background: #4f46e5; color: #ffffff; text-align: left; padding: 7px 9px; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 7px 9px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; font-family: monospace; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .badge-active { background: #dcfce7; color: #15803d; }
            .badge-inactive { background: #f1f5f9; color: #64748b; }
            .badge-cat { background: #dbeafe; color: #1e40af; }
            .badge-sample { background: #f3e8ff; color: #6b21a8; }

            .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hospital Laboratory Directory & Price List</h1>
            <p>Diagnostic Investigation Services Catalogue for Doctors & Clinical Staff</p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Scope</span>
              <span class="meta-val">Complete Lab Test Directory</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Tests Available</span>
              <span class="meta-val">${totalTests} Investigations</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Categories Covered</span>
              <span class="meta-val">${totalCategories} Specialities</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-val">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Code</th>
                <th style="width: 28%;">Test Name</th>
                <th style="width: 18%;">Category</th>
                <th style="width: 14%;">Sample Type</th>
                <th style="width: 8%; text-align: center;">TAT (hrs)</th>
                <th style="width: 8%; text-align: right;">Price (₹)</th>
                <th style="width: 6%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTests.map((t, idx) => {
                const catName = t.categoryId?.name || 'General'
                const sampleName = t.sampleTypeId?.name || '—'
                const tat = t.turnaroundTimeHours ? `${t.turnaroundTimeHours} h` : '-'
                const rateStr = t.rate != null ? `₹${Number(t.rate).toFixed(2)}` : '₹0.00'
                const stBadge = t.isActive !== false ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'

                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #4338ca;">${t.code || '-'}</td>
                    <td><strong>${t.name}</strong></td>
                    <td><span class="badge badge-cat">${catName}</span></td>
                    <td><span class="badge badge-sample">${sampleName}</span></td>
                    <td style="text-align: center;">${tat}</td>
                    <td class="amount-col">${rateStr}</td>
                    <td style="text-align: center;">${stBadge}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Document intended for medical practitioners, doctors, and clinical nursing staff.</div>
            <div class="sig-box">
              <div class="sig-line">Pathology Lab Director Signature</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printContent)
    printWin.document.close()
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to export lab test catalogue PDF', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

const filteredSampleTypes = computed(() => {
  return labStore.sampleTypes
})

let debounceTimer = null
watch(() => labStore.searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchSampleTypes()
  }, 400)
})

watch([currentPage, limit], () => {
  fetchSampleTypes()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleDelete = async (type) => {
  if (confirm(`Are you sure you want to delete the ${type.name} sample type?`)) {
    const response = await labStore.deleteSampleType(type._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message,
        type: 'success'
      })
      if (labStore.sampleTypes.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchSampleTypes()
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
  fetchSampleTypes()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Lab Sample Types</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage laboratory specimen and sample types.</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="exportAllTestsPdf"
          :disabled="isExportingPdf"
          class="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isExportingPdf" class="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Test Catalogue (PDF)
        </button>
        <button 
          @click="openAddModal"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Sample Type
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">All Sample Types</h2>
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="labStore.searchQuery"
            type="text" 
            placeholder="Search sample types..." 
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
        <span class="text-sm font-medium">Loading sample types...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSampleTypes.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No sample types found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          {{ labStore.searchQuery ? "No results match your search query. Try typing something else." : "Get started by adding the first sample type." }}
        </p>
        <button 
          v-if="!labStore.searchQuery"
          @click="openAddModal"
          class="mt-5 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Sample Type
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/4">Code</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/2">Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/6">Created Date</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[10%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="type in filteredSampleTypes" 
              :key="type._id"
              class="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              @click="viewSampleType(type)"
            >
              <!-- Code -->
              <td class="px-6 py-4">
                <span v-if="type.code" class="font-mono text-sm px-2 py-1 bg-slate-100 rounded text-slate-600 font-bold">
                  {{ type.code }}
                </span>
                <span v-else class="text-slate-400 text-sm italic">None</span>
              </td>
              <!-- Name -->
              <td class="px-6 py-4">
                <span class="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                  {{ type.name }}
                </span>
              </td>
              <!-- Created Date -->
              <td class="px-6 py-4 text-slate-500 text-sm">
                {{ formatDate(type.createdAt) }}
              </td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center" @click.stop>
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="viewSampleType(type)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer"
                    title="View Associated Tests"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    @click="openEditModal(type)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer"
                    title="Edit Sample Type"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    @click="handleDelete(type)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                    title="Delete Sample Type"
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
        v-if="labStore.sampleTypePagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, labStore.sampleTypePagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ labStore.sampleTypePagination.total }}</span> 
          entries
        </span>

        <div v-if="labStore.sampleTypePagination.pages > 1" class="flex items-center gap-2">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Previous Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            v-for="page in labStore.sampleTypePagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all cursor-pointer"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="currentPage < labStore.sampleTypePagination.pages && currentPage++"
            :disabled="currentPage === labStore.sampleTypePagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Next Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Sample Type Modal Component -->
    <CreateSampleTypeModal 
      :show="isCreateModalOpen"
      :sampleType="selectedSampleType"
      @close="isCreateModalOpen = false"
      @created="handleSampleTypeCreated"
      @updated="handleSampleTypeUpdated"
    />
  </div>
</template>
