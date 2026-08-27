<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useNursingStore } from '../../../stores/nursingStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

const router = useRouter()
const admissionStore = useIpdAdmissionStore()
const nursingStore = useNursingStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const loading = ref(false)

// Filters State
const filters = ref({
  page: 1,
  limit: 10,
  status: 'ADMITTED', // Default to currently admitted patients
  nursingStationId: '',
  search: '',
  date: ''
})

const fetchMyPatients = async () => {
  loading.value = true
  const res = await admissionStore.fetchAdmissions(filters.value)
  if (!res.success) {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// Watch filters
watch(() => [filters.value.status, filters.value.nursingStationId, filters.value.date, filters.value.search], () => {
  filters.value.page = 1
  fetchMyPatients()
})

watch(() => filters.value.page, () => {
  fetchMyPatients()
})

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    status: 'ADMITTED',
    nursingStationId: nursingStore.myStation?._id || '',
    search: '',
    date: ''
  }
}

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return roleName === 'SuperAdmin' || roleName === 'Super Admin'
})

onMounted(async () => {
  loading.value = true
  try {
    // 1. Fetch the logged-in nurse's assigned station
    const myStation = await nursingStore.fetchMyStation()
    if (myStation) {
      filters.value.nursingStationId = myStation._id
    }
    
    // 2. Fetch all nursing stations for SuperAdmin filter select dropdown
    if (isSuperAdmin.value) {
      await nursingStore.fetchNursingStations(1, 100)
    }
    
    // 3. Fetch patient list based on the station
    await fetchMyPatients()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

// Station Details & KPIs
const selectedStationDetails = computed(() => {
  if (!filters.value.nursingStationId) return null
  return nursingStore.stations.find(s => s._id === filters.value.nursingStationId) || nursingStore.myStation
})

const totalBedsCount = computed(() => {
  return selectedStationDetails.value?.assignedBeds?.length || 0
})

const occupiedBedsCount = computed(() => {
  if (!selectedStationDetails.value?.assignedBeds) return 0
  return selectedStationDetails.value.assignedBeds.filter(b => b.status === 'OCCUPIED').length
})

const availableBedsCount = computed(() => {
  if (!selectedStationDetails.value?.assignedBeds) return 0
  return selectedStationDetails.value.assignedBeds.filter(b => b.status === 'AVAILABLE').length
})

const occupancyRate = computed(() => {
  if (totalBedsCount.value === 0) return 0
  return Math.round((occupiedBedsCount.value / totalBedsCount.value) * 100)
})

const emergencyCount = computed(() => {
  return admissionStore.admissions.filter(a => a.admissionType === 'EMERGENCY' && a.status === 'ADMITTED').length
})

// Helpers
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const getDaysAdmitted = (dateString) => {
  if (!dateString) return 0
  const start = new Date(dateString)
  const today = new Date()
  const diffTime = Math.abs(today - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getStatusColor = (status) => {
  switch (status) {
    case 'ADMITTED': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'DISCHARGED': return 'bg-slate-100 border-slate-200 text-slate-700'
    case 'CANCELLED': return 'bg-rose-50 border-rose-200 text-rose-700'
    default: return 'bg-slate-50 border-slate-200 text-slate-700'
  }
}

const getPayerTypeLabel = (type) => {
  switch (type) {
    case 'MUHCS': return 'MUHCS'
    case 'MR_STATE': return 'MR (STATE)'
    case 'MR_CENTRAL': return 'MR (CENTRAL)'
    case 'HEALTH_INSURANCE': return 'HEALTH INSURANCE'
    case 'NORMAL':
    default: return 'NORMAL'
  }
}

const getPayerTypeColor = (type) => {
  switch (type) {
    case 'MUHCS':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'MR_STATE':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'MR_CENTRAL':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'HEALTH_INSURANCE':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'NORMAL':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    
    <!-- Top Header & Station Info -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-xs">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Ward Patient Monitoring</h1>
          <p class="text-xs font-semibold text-slate-500 mt-0.5">Real-time status of admitted inpatients at your assigned nursing station desk.</p>
        </div>
      </div>

      <!-- Current Assigned Station Badge -->
      <div v-if="nursingStore.myStation" class="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl px-4 py-2.5 flex items-center gap-3 text-white shadow-md shadow-indigo-100">
        <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs shrink-0">
          NS
        </div>
        <div>
          <span class="text-[9px] uppercase tracking-wider font-bold block text-indigo-100 leading-tight">Assigned Station</span>
          <span class="text-xs font-black tracking-wide">{{ nursingStore.myStation.name }} ({{ nursingStore.myStation.code }})</span>
        </div>
      </div>
    </div>

    <!-- Station KPI Dashboard -->
    <div v-if="selectedStationDetails" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      
      <!-- Total Assigned Beds -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Beds</span>
          <span class="text-2xl font-black text-slate-900 font-mono">{{ totalBedsCount }}</span>
          <span class="text-[10px] text-slate-400 block font-medium mt-0.5">Physical ward beds</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </div>
      </div>

      <!-- Occupied Beds -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Occupied Beds</span>
          <span class="text-2xl font-black text-indigo-600 font-mono">{{ occupiedBedsCount }}</span>
          <span class="text-[10px] text-indigo-600 font-bold block mt-0.5">Occupancy: {{ occupancyRate }}%</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
      </div>

      <!-- Available Beds -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Beds</span>
          <span class="text-2xl font-black text-emerald-600 font-mono">{{ availableBedsCount }}</span>
          <span class="text-[10px] text-emerald-600 font-bold block mt-0.5">Ready for admission</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>

      <!-- Emergency Cases -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Cases</span>
          <span class="text-2xl font-black text-rose-600 font-mono">{{ emergencyCount }}</span>
          <span class="text-[10px] text-rose-500 font-bold block mt-0.5">Urgent priority</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
      </div>

    </div>

    <!-- Main Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      
      <!-- Filters header -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col lg:flex-row justify-between items-center gap-3">
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          <!-- Nursing Station Selector (SuperAdmin only) -->
          <select 
            v-if="isSuperAdmin"
            v-model="filters.nursingStationId"
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[200px]"
          >
            <option value="">All Nursing Stations</option>
            <option v-for="s in nursingStore.stations" :key="s._id" :value="s._id">
              {{ s.name }} ({{ s.code }})
            </option>
          </select>

          <!-- Text Search -->
          <div class="relative min-w-[220px]">
            <input 
              v-model="filters.search"
              type="text" 
              placeholder="Search patient name, code or IPD..." 
              class="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 shadow-2xs"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <select 
            v-model="filters.status" 
            class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="ADMITTED">Active Admitted</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <!-- Clear Filters -->
          <button 
            v-if="filters.search || filters.date || filters.status !== 'ADMITTED'"
            @click="clearFilters"
            class="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer transition-all"
          >
            Clear Filters
          </button>
        </div>

        <div class="text-xs font-bold text-slate-500 whitespace-nowrap self-end lg:self-center">
          Monitored Inpatients: <span class="text-slate-800 font-mono text-sm font-black">{{ admissionStore.pagination.total }}</span>
        </div>
      </div>

      <!-- Patients Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
            <tr>
              <th class="px-5 py-3.5">IPD No. / Date</th>
              <th class="px-5 py-3.5">Patient Details</th>
              <th class="px-5 py-3.5">Length of Stay</th>
              <th class="px-5 py-3.5">Consultant Doctor</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-16 text-center text-slate-400">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="text-xs font-semibold">Loading monitored patients registry...</span>
              </td>
            </tr>
            <tr v-else-if="admissionStore.admissions.length === 0">
              <td colspan="6" class="px-6 py-16 text-center text-slate-500">
                <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <p class="font-bold text-slate-700 text-sm">No active admissions for this station.</p>
                <p class="text-xs text-slate-400 mt-0.5">Select another nursing station or adjust your filter criteria.</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="adm in admissionStore.admissions" 
              :key="adm._id"
              class="hover:bg-slate-50/60 transition-colors group"
            >
              <!-- IPD No & Date -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-mono text-indigo-700 font-bold text-xs">{{ adm.admissionNo }}</span>
                  <span 
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider inline-block"
                    :class="getPayerTypeColor(adm.payerType)"
                  >
                    {{ getPayerTypeLabel(adm.payerType) }}
                  </span>
                </div>
                <span class="text-slate-400 text-[11px] mt-0.5 block">{{ formatDate(adm.admissionDate) }}</span>
              </td>
              
              <!-- Patient Info -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                    {{ (adm.patientId?.fullName || 'P')[0] }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 leading-snug">{{ adm.patientId?.fullName || 'N/A' }}</p>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ adm.patientId?.patientCode || '-' }} • {{ adm.patientId?.gender || '-' }}, {{ adm.patientId?.age || '?' }}y</p>
                  </div>
                </div>
              </td>
              
              <!-- Days Admitted -->
              <td class="px-5 py-3.5">
                <span class="px-2.5 py-1 bg-slate-100 rounded-md font-mono font-bold text-slate-800 text-xs inline-block">
                  {{ getDaysAdmitted(adm.admissionDate) }} Days
                </span>
              </td>
              
              <!-- Doctor -->
              <td class="px-5 py-3.5">
                <p class="font-bold text-slate-800">{{ adm.consultantDoctorId?.fullName || 'N/A' }}</p>
                <p class="text-[11px] text-slate-400">{{ adm.consultantDoctorId?.specializationId?.name || 'General Consultant' }}</p>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <span 
                  class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                  :class="getStatusColor(adm.status)"
                >
                  {{ adm.status }}
                </span>
              </td>
              
              <!-- Action -->
              <td class="px-5 py-3.5 text-center">
                <button 
                  @click="router.push({ name: 'ipd-patient-view', params: { id: adm._id } })"
                  class="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 transition-all border border-indigo-100 cursor-pointer inline-flex items-center justify-center shadow-2xs"
                  title="Open Patient Clinical Chart & Dashboard"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="admissionStore.pagination.pages > 1" class="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
        <span class="text-slate-500 font-semibold">
          Page <strong class="text-slate-800">{{ filters.page }}</strong> of <strong class="text-slate-800">{{ admissionStore.pagination.pages }}</strong>
        </span>
        <div class="flex gap-1.5">
          <button 
            @click="filters.page--" 
            :disabled="filters.page === 1"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            Previous
          </button>
          <button 
            @click="filters.page++" 
            :disabled="filters.page === admissionStore.pagination.pages"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>

    </div>

  </div>
</template>