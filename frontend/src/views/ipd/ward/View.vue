<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIpdWardStore } from '../../../stores/ipdWardStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BedManagement from './room/bed/Index.vue'

const route = useRoute()
const router = useRouter()
const ipdWardStore = useIpdWardStore()
const snackbarStore = useSnackbarStore()

const wardId = ref(route.params.id)

const loadWardDetails = async () => {
  try {
    await ipdWardStore.fetchWardById(wardId.value)
    // Fetch initial list of beds to display stats accurately
    await ipdWardStore.fetchBeds(wardId.value)
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load ward details.', type: 'error' })
  }
}

onMounted(async () => {
  await loadWardDetails()
})

const onDataChanged = async () => {
  // Reload beds list to update stats
  await ipdWardStore.fetchBeds(wardId.value)
}

// Stats computed properties
const totalBeds = computed(() => ipdWardStore.beds.length)
const availableBeds = computed(() => ipdWardStore.beds.filter(b => b.status === 'AVAILABLE').length)
const occupiedBeds = computed(() => ipdWardStore.beds.filter(b => b.status === 'OCCUPIED').length)
const maintenanceBeds = computed(() => ipdWardStore.beds.filter(b => b.status === 'MAINTENANCE').length)

const getWardTypeClass = (type) => {
  if (!type) return ''
  switch (type) {
    case 'ICU':
    case 'NICU':
    case 'PICU':
    case 'CCU':
      return 'bg-red-50 text-red-700 border-red-100'
    case 'DELUXE':
    case 'PRIVATE':
      return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'EMERGENCY':
      return 'bg-amber-50 text-amber-700 border-amber-100'
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Breadcrumb & Header -->
    <div>
      <nav class="flex items-center text-sm font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
        <router-link :to="{ name: 'ipd-ward' }" class="hover:text-indigo-600 transition-colors">Ward Management</router-link>
        <svg class="w-4 h-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        <span class="text-slate-900" aria-current="page">{{ ipdWardStore.currentWard?.name || 'View details' }}</span>
      </nav>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
            {{ ipdWardStore.currentWard?.code || 'W' }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {{ ipdWardStore.currentWard?.name || 'Loading Ward...' }} 
              <span 
                v-if="ipdWardStore.currentWard?.wardType" 
                :class="['px-2.5 py-1 text-xs font-bold rounded-lg border uppercase', getWardTypeClass(ipdWardStore.currentWard.wardType)]"
              >
                {{ ipdWardStore.currentWard.wardType.replace('_', ' ') }}
              </span>
            </h1>
            <p class="text-slate-500 mt-1 text-sm flex items-center gap-2">
              <span class="font-medium text-slate-700">Floor:</span> {{ ipdWardStore.currentWard?.floor || 'Not Assigned' }}
              <span class="text-slate-300">|</span>
              <span class="font-medium text-slate-700">Status:</span> 
              <span :class="ipdWardStore.currentWard?.isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-semibold'">
                {{ ipdWardStore.currentWard?.isActive ? 'Active' : 'Inactive' }}
              </span>
            </p>
          </div>
        </div>
        
        <button 
          @click="router.push({ name: 'ipd-ward' })"
          class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Wards
        </button>
      </div>
    </div>

    <!-- Ward KPI Dashboard Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Total Beds -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Beds</span>
          <span class="text-2xl font-bold text-slate-800">{{ totalBeds }}</span>
        </div>
      </div>

      <!-- Available Beds -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">Available</span>
          <span class="text-2xl font-bold text-emerald-600">{{ availableBeds }}</span>
        </div>
      </div>

      <!-- Occupied Beds -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">Occupied</span>
          <span class="text-2xl font-bold text-rose-600">{{ occupiedBeds }}</span>
        </div>
      </div>

      <!-- Maintenance Beds -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block">Maintenance</span>
          <span class="text-2xl font-bold text-amber-600">{{ maintenanceBeds }}</span>
        </div>
      </div>
    </div>

    <!-- Bed List Panel Card -->
    <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div class="border-b border-slate-100 bg-slate-50/20 px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-800">Beds Directory</h2>
      </div>

      <div class="p-6">
        <BedManagement :ward-id="wardId" @beds-changed="onDataChanged" />
      </div>
    </div>
  </div>
</template>
