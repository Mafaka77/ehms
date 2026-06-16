<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNursingStore } from '../../../stores/nursingStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const router = useRouter()
const nursingStore = useNursingStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

// State variables
const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(10)

const getWardName = (ward) => {
  if (!ward) return 'Not Assigned'
  if (typeof ward === 'object' && ward.name) {
    return ward.code ? `${ward.name} (${ward.code})` : ward.name
  }
  const wardIdStr = typeof ward === 'object' ? (ward._id || ward).toString() : ward
  const found = (nursingStore.wards || []).find(w => w._id === wardIdStr)
  return found ? (found.code ? `${found.name} (${found.code})` : found.name) : 'Not Assigned'
}

// Load master data and list
const loadData = async () => {
  try {
    await nursingStore.fetchNursingStations(currentPage.value, limit.value, searchQuery.value)
  } catch (err) {
    console.error(err)
  }
}

const loadMasterData = async () => {
  try {
    await nursingStore.fetchWards()
  } catch (err) {
    console.error(err)
  }
}

// Watch filters
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 400)
})

watch([currentPage, limit], () => {
  loadData()
})

onMounted(async () => {
  await loadMasterData()
  await loadData()
})

// Action handlers
const openCreatePage = () => {
  router.push({ name: 'nursing-station-create' })
}

const openEditPage = (station) => {
  router.push({ name: 'nursing-station-edit', params: { id: station._id } })
}

const openViewPage = (station) => {
  router.push({ name: 'nursing-station-view', params: { id: station._id } })
}

const handleDelete = async (station) => {
  if (!confirm(`Are you sure you want to delete Nursing Station: ${station.name}?`)) return
  try {
    const res = await nursingStore.deleteNursingStation(station._id)
    if (res.success) {
      snackbarStore.show({ message: 'Nursing Station deleted successfully.', type: 'success' })
      await loadData()
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to delete nursing station.', type: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header Area -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Nursing Stations</h1>
        <p class="text-slate-500 mt-1 text-sm">Configure and manage hospital nursing stations, locations, and ward assignments.</p>
      </div>
      <button 
        v-if="authStore.hasPermission('nursing_station.create')"
        @click="openCreatePage"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 transform active:scale-95"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Station
      </button>
    </div>

    <!-- Main Table Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search Panel -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">Nursing Stations Directory</h2>
          
          <!-- Search box -->
          <div class="relative w-full sm:w-80">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by code, name, location..." 
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="nursingStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading nursing stations...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="nursingStore.stations.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No nursing stations registered</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          Add a new nursing station or change your search query parameters.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Station Details</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Monitored Beds</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">In-Charge Nurse</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Contact & Location</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="station in nursingStore.stations" 
              :key="station._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="px-6 py-4.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {{ station.code }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 text-sm block">{{ station.name }}</span>
                    <span class="text-slate-400 text-[11px] font-medium block mt-0.5">ID: {{ station._id.slice(-6) }}</span>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4.5">
                <div class="flex flex-col gap-1">
                  <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100/50 w-max">
                    {{ station.assignedBeds?.length || 0 }} Beds
                  </span>
                  <span v-if="station.wardId" class="text-slate-400 text-[10px] font-semibold block">
                    Primary: {{ getWardName(station.wardId) }}
                  </span>
                </div>
              </td>

              <td class="px-6 py-4.5 text-sm text-slate-600 font-medium">
                {{ station.inchargeNurseId?.fullName || 'Not Assigned' }}
              </td>

              <td class="px-6 py-4.5">
                <span class="text-slate-700 text-sm block font-medium">{{ station.location || '-' }}</span>
                <span class="text-slate-400 text-xs block mt-0.5">{{ station.contactNo || '-' }}</span>
              </td>

              <td class="px-6 py-4.5 text-center">
                <span 
                  :class="[
                    'px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full inline-block',
                    station.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                  ]"
                >
                  {{ station.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td class="px-6 py-4.5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openViewPage(station)"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all"
                    title="View Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('nursing_station.update')"
                    @click="openEditPage(station)"
                    class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2 rounded-xl border border-indigo-100/30 transition-all"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('nursing_station.delete')"
                    @click="handleDelete(station)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Block -->
      <div v-if="nursingStore.pagination.pages > 1" class="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-medium">
          Showing page {{ currentPage }} of {{ nursingStore.pagination.pages }}
        </span>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button 
            @click="currentPage++"
            :disabled="currentPage === nursingStore.pagination.pages"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
