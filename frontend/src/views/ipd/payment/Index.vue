<script setup>
import { ref, onMounted } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import IpdPaymentView from './View.vue'

const snackbarStore = useSnackbarStore()
const admissionStore = useIpdAdmissionStore()

// State
const selectedAdmission = ref(null)

// Filtering & Pagination
const searchQuery = ref('')
const statusFilter = ref('ADMITTED')
const currentPage = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)

const fetchAdmissions = async () => {
  try {
    await admissionStore.fetchAdmissions({
      page: currentPage.value,
      limit: limit.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
    
    const pag = admissionStore.pagination
    if (pag) {
      totalPages.value = pag.pages || 1
      totalItems.value = pag.total || admissionStore.admissions.length
    } else {
      totalPages.value = 1
      totalItems.value = admissionStore.admissions.length
    }
  } catch (error) {
    console.error('Error fetching admissions:', error)
    snackbarStore.show({
      message: admissionStore.error || 'Failed to fetch admissions',
      type: 'error'
    })
  }
}

const handleSelectAdmission = async (admission) => {
  selectedAdmission.value = admission
}

onMounted(() => {
  fetchAdmissions()
})

const handleSearch = () => {
  currentPage.value = 1
  fetchAdmissions()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'ADMITTED': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'DISCHARGED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">IPD Payments</h1>
        <p class="text-sm text-slate-500 mt-1">Manage IPD bills and deposit deductions</p>
      </div>
    </div>

    <div class="flex-1 min-h-0 flex gap-6">
      <!-- Left Panel: Admissions List -->
      <div class="w-[400px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-shrink-0">
        <div class="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div class="relative">
            <input 
              type="text" 
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Search by Patient Name or MRN" 
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="flex gap-2">
            <select 
              v-model="statusFilter"
              @change="handleSearch"
              class="flex-1 bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ADMITTED">Admitted</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3">
          <div v-if="admissionStore.loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          
          <div v-else-if="admissionStore.admissions.length === 0" class="text-center py-8">
            <p class="text-slate-500 text-sm">No admissions found</p>
          </div>

          <div v-else class="space-y-2">
            <button
              v-for="admission in admissionStore.admissions"
              :key="admission._id"
              @click="handleSelectAdmission(admission)"
              class="w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden"
              :class="selectedAdmission?._id === admission._id 
                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'"
            >
              <div v-if="selectedAdmission?._id === admission._id" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
              
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {{ admission.patientId?.mrn }}
                </span>
                <span 
                  class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                  :class="getStatusClass(admission.status)"
                >
                  {{ admission.status }}
                </span>
              </div>
              
              <h3 class="font-bold text-slate-800 text-base mb-1 truncate">
                {{ admission.patientId?.fullName || 'Unknown Patient' }}
              </h3>
              
              <div class="text-xs text-slate-500 space-y-1">
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>Admitted: {{ formatDate(admission.admissionDate) }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span class="text-xs text-slate-500 font-medium">Page {{ currentPage }} of {{ totalPages }}</span>
          <div class="flex gap-1">
            <button 
              @click="currentPage > 1 && (currentPage--, fetchAdmissions())"
              :disabled="currentPage === 1"
              class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              @click="currentPage < totalPages && (currentPage++, fetchAdmissions())"
              :disabled="currentPage === totalPages"
              class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Detailed View -->
      <div class="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div v-if="!selectedAdmission" class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
          <div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
            <svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800">No Admission Selected</h3>
          <p class="text-sm text-slate-500 max-w-sm mt-2">Select an admission from the list on the left to view and process IPD bills and deposit deductions.</p>
        </div>

        <template v-else>
          <IpdPaymentView 
            :admission="selectedAdmission" 
            @payment-success="fetchAdmissions" 
          />
        </template>
      </div>
    </div>
  </div>
</template>
