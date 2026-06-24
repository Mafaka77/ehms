<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmergencyStore } from '../../stores/emergencyStore'
import { useIpdAdmissionStore } from '../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../stores/snackbarStore'

// Import Tab Components
import OverviewTab from './tabs/OverviewTab.vue'
import ChargesTab from './tabs/ChargesTab.vue'
import DischargeSummaryTab from './tabs/DischargeSummaryTab.vue'

const route = useRoute()
const router = useRouter()
const emergencyStore = useEmergencyStore()
const ipdAdmissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

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
    case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'MEDIUM': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'LOW': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="flex justify-center p-12">
      <svg class="animate-spin h-8 w-8 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    
    <div v-else-if="!visit" class="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
      <p class="text-slate-500 font-medium">Visit not found.</p>
      <button @click="router.push({ name: 'emergency-visits' })" class="mt-4 text-rose-600 hover:underline">Back to List</button>
    </div>
    
    <template v-else>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            {{ visit.patientId?.fullName?.charAt(0) }}
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ visit.patientId?.fullName }}</h1>
            <p class="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
              <span class="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold font-mono">{{ visit.patientId?.patientCode }}</span>
              <span>•</span>
              <span>{{ visit.patientId?.mobileNo }}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-3 w-full sm:w-auto">
          <span 
            class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
            :class="getPriorityColor(visit.priority)"
          >
            {{ visit.priority }} PRIORITY
          </span>
          <p class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Dr. {{ visit.doctorId?.fullName || 'On Duty' }}
          </p>
        </div>
      </div>

      <!-- Professional Segmented Control Tabs -->
      <div class="bg-slate-100/80 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1 border border-slate-200/60 shadow-inner w-full md:max-w-2xl">
        <button 
          @click="activeTab = 'overview'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'overview' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Overview
        </button>
        <button 
          @click="activeTab = 'charges'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'charges' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          Treatment Charges
        </button>
        <button 
          @click="activeTab = 'discharge'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'discharge' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Discharge Summary
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        <OverviewTab 
          v-if="activeTab === 'overview'" 
          :visit="visit" 
        />
        
        <ChargesTab 
          v-if="activeTab === 'charges'" 
          :visit="visit"
          @refresh="fetchDetails"
        />

        <DischargeSummaryTab 
          v-if="activeTab === 'discharge'" 
          :visit="visit"
          @refresh="fetchDetails"
        />
      </div>
    </template>
  </div>
</template>
