<script setup>
import { ref, onMounted, computed, watch } from 'vue'
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

const handleSelectAdmission = (admission) => {
  selectedAdmission.value = admission
}

let searchDebounce = null
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchAdmissions()
  }, 350)
})

watch(statusFilter, () => {
  currentPage.value = 1
  fetchAdmissions()
})

onMounted(() => {
  fetchAdmissions()
})

const clearSearch = () => {
  searchQuery.value = ''
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
    case 'ADMITTED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'DISCHARGED': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

const statsSummary = computed(() => {
  const total = totalItems.value
  const list = admissionStore.admissions || []
  const admitted = list.filter(a => a.status === 'ADMITTED').length
  const discharged = list.filter(a => a.status === 'DISCHARGED').length
  return { total, admitted, discharged }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-4rem)] flex flex-col">
    <!-- Header & Summary Cards -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-xs">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">IPD Billing & Payment Desk</h1>
            <p class="text-xs font-semibold text-slate-500 mt-0.5">Manage inpatient billing, advance deposits, daily bed charges, and final discharge billing settlement.</p>
          </div>
        </div>
      </div>

      <!-- Quick KPI Stats -->
      <div class="grid grid-cols-3 gap-3 shrink-0">
        <div class="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Admitted</span>
            <span class="text-base font-black text-slate-900 font-mono">{{ statsSummary.admitted }}</span>
          </div>
        </div>

        <div class="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discharged</span>
            <span class="text-base font-black text-slate-900 font-mono">{{ statsSummary.discharged }}</span>
          </div>
        </div>

        <div class="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Listed</span>
            <span class="text-base font-black text-slate-900 font-mono">{{ totalItems }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Workspace Split Panels -->
    <div class="flex-1 min-h-[620px] flex flex-col lg:flex-row gap-6">
      <!-- Left Panel: Admissions List -->
      <div class="w-full lg:w-[420px] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <!-- Search & Filter Controls -->
        <div class="p-4 border-b border-slate-100 space-y-3 bg-slate-50/40">
          <div class="relative">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search by Patient Name, MRN or Code..." 
              class="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            >
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button 
              v-if="searchQuery" 
              @click="clearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Filter Pills -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex bg-slate-100/80 p-0.5 rounded-xl text-xs font-bold w-full">
              <button 
                @click="statusFilter = 'ADMITTED'"
                :class="['flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer', statusFilter === 'ADMITTED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
              >
                Admitted
              </button>
              <button 
                @click="statusFilter = 'DISCHARGED'"
                :class="['flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer', statusFilter === 'DISCHARGED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
              >
                Discharged
              </button>
              <button 
                @click="statusFilter = ''"
                :class="['flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer', statusFilter === '' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800']"
              >
                All
              </button>
            </div>
          </div>
        </div>

        <!-- Admissions List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div v-if="admissionStore.loading" class="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
            <svg class="animate-spin h-7 w-7 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold">Loading IPD admissions...</span>
          </div>
          
          <div v-else-if="admissionStore.admissions.length === 0" class="text-center py-16 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-2">
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p class="text-xs font-bold text-slate-700">No Admissions Found</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Try modifying your search or filter settings.</p>
          </div>

          <div v-else class="space-y-2">
            <button
              v-for="admission in admissionStore.admissions"
              :key="admission._id"
              @click="handleSelectAdmission(admission)"
              class="w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative overflow-hidden cursor-pointer"
              :class="selectedAdmission?._id === admission._id 
                ? 'bg-gradient-to-r from-indigo-50/90 to-indigo-50/30 border-indigo-200 shadow-sm ring-1 ring-indigo-200/50' 
                : 'bg-white border-slate-100 hover:border-indigo-150 hover:bg-slate-50/80'"
            >
              <!-- Active highlight bar -->
              <div 
                v-if="selectedAdmission?._id === admission._id" 
                class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r"
              ></div>
              
              <!-- Patient Header Row -->
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/80 shrink-0">
                    {{ admission.patientId?.mrn || admission.patientId?.patientCode || 'N/A' }}
                  </span>
                  <span 
                    v-if="admission.bedId"
                    class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate"
                  >
                    Bed {{ admission.bedId?.bedNo || '' }} {{ admission.bedId?.wardId?.name ? `(${admission.bedId.wardId.name})` : '' }}
                  </span>
                </div>
                <span 
                  class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0"
                  :class="getStatusClass(admission.status)"
                >
                  {{ admission.status }}
                </span>
              </div>
              
              <!-- Patient Name -->
              <h3 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                {{ admission.patientId?.fullName || 'Unknown Patient' }}
              </h3>
              
              <!-- Meta Info -->
              <div class="text-[11px] text-slate-500 space-y-0.5 mt-1.5 pt-1.5 border-t border-slate-100/70 flex items-center justify-between">
                <span class="flex items-center gap-1 text-slate-400 font-medium">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Admitted: {{ formatDate(admission.admissionDate) }}
                </span>
                <span v-if="admission.consultantDoctorId?.fullName" class="text-indigo-600 font-semibold truncate max-w-[120px]">
                  Dr. {{ admission.consultantDoctorId.fullName.replace(/^Dr\.\s*/i, '') }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Pagination Footer -->
        <div class="p-3 px-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <span class="text-slate-500 font-semibold">
            Page <strong class="text-slate-800">{{ currentPage }}</strong> of <strong class="text-slate-800">{{ totalPages }}</strong>
          </span>
          <div class="flex gap-1.5">
            <button 
              @click="currentPage > 1 && (currentPage--, fetchAdmissions())"
              :disabled="currentPage === 1"
              class="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-2xs font-bold text-xs cursor-pointer transition-all"
            >
              Prev
            </button>
            <button 
              @click="currentPage < totalPages && (currentPage++, fetchAdmissions())"
              :disabled="currentPage === totalPages"
              class="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-2xs font-bold text-xs cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Detailed View -->
      <div class="flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <!-- Empty State when no admission is selected -->
        <div v-if="!selectedAdmission" class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
          <div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100/80 shadow-xs">
            <svg class="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800">No Patient Selected</h3>
          <p class="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
            Select an active or discharged inpatient from the list on the left to review billing details, process advance deposit deductions, and complete settlement.
          </p>
        </div>

        <!-- Selected Admission Details -->
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
