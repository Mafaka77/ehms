<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmergencyStore } from '../../stores/emergencyStore'
import { useIpdAdmissionStore } from '../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import { useAuthStore } from '../../stores/authStore'

// Import Tab Components
import OverviewTab from './tabs/OverviewTab.vue'
import ChargesTab from './tabs/ChargesTab.vue'
import DischargeSummaryTab from './tabs/DischargeSummaryTab.vue'

const route = useRoute()
const router = useRouter()
const emergencyStore = useEmergencyStore()
const ipdAdmissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const loading = ref(true)
const visit = ref(null)
const charges = ref([])
const chargeCategories = ref([])
const activeTab = ref('overview')

onMounted(async () => {
  await fetchDetails()
})

const fetchDetails = async () => {
  loading.value = true
  try {
    const [visitRes, charRes, catRes, docRes] = await Promise.all([
      emergencyStore.getVisitById(route.params.id),
      emergencyStore.fetchPatientCharges(route.params.id),
      ipdAdmissionStore.fetchChargeCategories(),
      emergencyStore.fetchEmergencyDoctors()
    ])
    
    visit.value = visitRes.data || visitRes
    if (charRes.success) charges.value = charRes.data
    if (catRes.success) {
      chargeCategories.value = catRes.data.filter(c => c.code && c.code.toUpperCase().includes('EMERGENCY'))
      if(chargeCategories.value.length === 0) chargeCategories.value = catRes.data; // fallback
    }
  } catch (error) {
    console.error(error)
    snackbarStore.show({ message: 'Error loading details', type: 'error' })
  } finally {
    loading.value = false
  }
}

const totalChargesAmount = computed(() => {
  return charges.value.reduce((sum, c) => sum + (c.amount || 0), 0)
})

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200/80'
    case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200/80'
    case 'MEDIUM': return 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
    case 'LOW': return 'bg-slate-50 text-slate-600 border-slate-200/80'
    default: return 'bg-slate-50 text-slate-600 border-slate-200/80'
  }
}

const getPriorityDot = (priority) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-rose-500'
    case 'HIGH': return 'bg-amber-500'
    case 'MEDIUM': return 'bg-indigo-500'
    default: return 'bg-slate-400'
  }
}

const tabs = computed(() => {
  const list = [
    {
      key: 'overview',
      label: 'Overview',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
    }
  ]
  if (authStore.hasPermission('emergency.treatmentcharges')) {
    list.push({
      key: 'charges',
      label: 'Treatment Charges',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>`
    })
  }
  return list
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-5">

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-5">
      <div class="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-slate-200"></div>
          <div class="space-y-2 flex-1">
            <div class="h-5 bg-slate-200 rounded w-48"></div>
            <div class="h-4 bg-slate-200 rounded w-64"></div>
            <div class="h-4 bg-slate-200 rounded w-40"></div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 p-6 h-64 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-full mb-3"></div>
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Visit Not Found -->
    <div v-else-if="!visit" class="text-center p-16 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div class="w-14 h-14 mx-auto bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mb-4 border border-rose-100">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-slate-700 font-bold text-base">Visit not found</p>
      <p class="text-slate-400 text-sm mt-1">The requested emergency visit record could not be found.</p>
      <button
        @click="router.push({ name: 'emergency-visits' })"
        class="mt-5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
      >
        Back to Emergency List
      </button>
    </div>

    <!-- Visit Loaded -->
    <template v-else>

      <!-- Header / Patient Card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <!-- Top accent bar -->
        <div class="h-1 w-full bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400"></div>

        <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <!-- Patient Info -->
          <div class="flex items-center gap-4">
            <!-- Back Button -->
            <button
              @click="router.push({ name: 'emergency-visits' })"
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer shrink-0"
              title="Back to list"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Avatar -->
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center text-xl font-black shadow-md shrink-0">
              {{ visit.patientId?.fullName?.charAt(0)?.toUpperCase() || 'P' }}
            </div>

            <div>
              <div class="flex items-center gap-2.5 flex-wrap">
                <h1 class="text-lg font-black text-slate-800 tracking-tight leading-tight">
                  {{ visit.patientId?.fullName || 'Unknown Patient' }}
                </h1>
                <!-- Priority Badge -->
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs"
                  :class="getPriorityColor(visit.priority)"
                >
                  <span class="w-1.5 h-1.5 rounded-full inline-block" :class="getPriorityDot(visit.priority)"></span>
                  {{ visit.priority }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2 mt-1.5">
                <span class="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-bold font-mono text-[11px] border border-slate-200/80">
                  {{ visit.patientId?.patientCode || '—' }}
                </span>
                <span class="text-slate-300 text-xs">•</span>
                <span class="text-slate-500 text-xs font-medium">{{ visit.patientId?.mobileNo || '—' }}</span>
                <span v-if="visit.visitNo" class="text-slate-300 text-xs">•</span>
                <span v-if="visit.visitNo" class="font-mono text-rose-600 font-bold text-[11px] bg-rose-50/80 px-1.5 py-0.5 rounded border border-rose-100">
                  {{ visit.visitNo }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Meta Info -->
          <div class="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {{ visit.doctorId?.fullName || 'On Duty' }}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ visit.arrivalDateTime
                  ? new Date(visit.arrivalDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                  : '—'
              }}
            </div>
            <span
              class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
              :class="visit.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : visit.paymentStatus === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
            >
              {{ visit.paymentStatus || 'Unpaid' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-slate-100/80 p-1 rounded-2xl flex flex-col sm:flex-row gap-1 border border-slate-200/60 shadow-inner w-full md:max-w-xl">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === tab.key
            ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-900/5'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="tab.icon"></svg>
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        <OverviewTab
          v-if="activeTab === 'overview'"
          :visit="visit"
        />

        <ChargesTab
          v-if="activeTab === 'charges' && authStore.hasPermission('emergency.treatmentcharges')"
          :visit="visit"
          @refresh="fetchDetails"
        />
      </div>

    </template>
  </div>
</template>
