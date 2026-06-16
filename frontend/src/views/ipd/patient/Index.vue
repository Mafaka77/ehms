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

onMounted(async () => {
  loading.value = true
  try {
    // 1. Fetch the logged-in nurse's assigned station
    const myStation = await nursingStore.fetchMyStation()
    if (myStation) {
      filters.value.nursingStationId = myStation._id
    }
    
    // 2. Fetch all nursing stations for the filter select dropdown
    await nursingStore.fetchNursingStations(1, 100)
    
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
    case 'ADMITTED': return 'bg-sky-50 border-sky-100 text-sky-700'
    case 'DISCHARGED': return 'bg-emerald-50 border-emerald-100 text-emerald-700'
    case 'CANCELLED': return 'bg-rose-50 border-rose-100 text-rose-700'
    default: return 'bg-slate-50 border-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Ward Patient Monitoring</h1>
        <p class="text-slate-500 mt-1 text-sm">Real-time status of admitted patients at your assigned nursing station.</p>
      </div>

      <!-- Current Assigned Station Badge -->
      <div v-if="nursingStore.myStation" class="bg-indigo-50 border border-indigo-100/80 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
          NS
        </div>
        <div>
          <span class="text-[10px] text-indigo-500 uppercase tracking-wider font-bold block leading-none">Your Assigned Station</span>
          <span class="text-sm font-bold text-indigo-900 mt-0.5 inline-block">{{ nursingStore.myStation.name }} ({{ nursingStore.myStation.code }})</span>
        </div>
      </div>
    </div>

    <!-- Station KPI Dashboard -->
    <div v-if="selectedStationDetails" class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Total Assigned Beds -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Assigned Beds</span>
          <span class="text-3xl font-extrabold text-slate-800">{{ totalBedsCount }}</span>
          <span class="text-[11px] text-slate-400 block mt-1">Total physical beds in ward</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </div>
      </div>

      <!-- Occupied Beds -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Occupied Beds</span>
          <span class="text-3xl font-extrabold text-indigo-600">{{ occupiedBedsCount }}</span>
          <span class="text-[11px] text-indigo-500 font-semibold block mt-1">Occupancy: {{ occupancyRate }}%</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
      </div>

      <!-- Available Beds -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Available Beds</span>
          <span class="text-3xl font-extrabold text-emerald-600">{{ availableBedsCount }}</span>
          <span class="text-[11px] text-emerald-500 font-semibold block mt-1">Ready for admission</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>

      <!-- Emergency Cases -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Emergency Cases</span>
          <span class="text-3xl font-extrabold text-rose-600">{{ emergencyCount }}</span>
          <span class="text-[11px] text-rose-500 font-semibold block mt-1">Requires immediate attention</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
      </div>

    </div>

    <!-- Main Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Filters header -->
      <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          <!-- Nursing Station Selector -->
          <div class="flex flex-col">
            <select 
              v-model="filters.nursingStationId"
              class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[200px]"
            >
              <option value="" disabled>Select Nursing Station...</option>
              <option v-for="s in nursingStore.stations" :key="s._id" :value="s._id">
                {{ s.name }} ({{ s.code }})
              </option>
            </select>
          </div>

          <!-- Text Search -->
          <input 
            v-model="filters.search"
            type="text" 
            placeholder="Search patient name, code or IPD..." 
            class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[220px]"
          />

          <!-- Status Filter -->
          <select 
            v-model="filters.status" 
            class="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 min-w-[140px]"
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
            class="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        <div class="text-sm font-semibold text-slate-600 whitespace-nowrap">
          Monitored Patients: {{ admissionStore.pagination.total }}
        </div>
      </div>

      <!-- Patients Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
            <tr>
              <th class="px-6 py-4">IPD No. / Date</th>
              <th class="px-6 py-4">Patient Info</th>
              <th class="px-6 py-4">Bed & Floor Location</th>
              <th class="px-6 py-4">Days In Ward</th>
              <th class="px-6 py-4">Consultant Doctor</th>
              <th class="px-6 py-4">Diagnosis</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading patients registry...
              </td>
            </tr>
            <tr v-else-if="admissionStore.admissions.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <p class="font-semibold text-slate-600">No active admissions for this station.</p>
                <p class="text-xs text-slate-400 mt-1">Please select another nursing station or verify assignments.</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="adm in admissionStore.admissions" 
              :key="adm._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- IPD No & Date -->
              <td class="px-6 py-4">
                <span class="font-mono text-indigo-600 font-bold block">{{ adm.admissionNo }}</span>
                <span class="text-slate-400 text-xs mt-0.5 block">{{ formatDate(adm.admissionDate) }}</span>
              </td>
              
              <!-- Patient Info -->
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800">{{ adm.patientId?.fullName || 'N/A' }}</p>
                <p class="text-xs text-slate-500">{{ adm.patientId?.patientCode || '-' }} • {{ adm.patientId?.gender }}, {{ adm.patientId?.age || '?' }}y</p>
              </td>
              
              <!-- Location -->
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-800">Bed {{ adm.bedId?.bedNo || 'N/A' }}</p>
                <p class="text-xs text-slate-500">{{ adm.bedId?.wardId?.name || 'Unknown Ward' }} • Floor {{ adm.bedId?.floor || '-' }}</p>
              </td>
              
              <!-- Days Admitted -->
              <td class="px-6 py-4 text-slate-600 font-bold text-sm">
                {{ getDaysAdmitted(adm.admissionDate) }} Days
              </td>
              
              <!-- Doctor -->
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800">Dr. {{ adm.consultantDoctorId?.fullName || 'N/A' }}</p>
                <p class="text-xs text-slate-500 font-medium">{{ adm.consultantDoctorId?.specializationId?.name || 'General Consultant' }}</p>
              </td>
              
              <!-- Diagnosis -->
              <td class="px-6 py-4">
                <span class="text-xs px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-slate-600 inline-block max-w-[150px] truncate" :title="adm.diagnosis">
                  {{ adm.diagnosis || 'None Specified' }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span 
                  class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border"
                  :class="getStatusColor(adm.status)"
                >
                  {{ adm.status }}
                </span>
              </td>
              
              <!-- Action -->
              <td class="px-6 py-4 text-center">
                <button 
                  @click="router.push({ name: 'ipd-patient-view', params: { id: adm._id } })"
                  class="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 p-2 rounded-xl transition-all border border-slate-200 shadow-sm cursor-pointer inline-flex items-center justify-center"
                  title="View Patient Dashboard"
                >
                  <!-- Eye Icon -->
                  <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="admissionStore.pagination.pages > 1" class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
        <button 
          @click="filters.page--" 
          :disabled="filters.page === 1"
          class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Previous
        </button>
        <span class="text-sm font-semibold text-slate-600">
          Page {{ filters.page }} of {{ admissionStore.pagination.pages }}
        </span>
        <button 
          @click="filters.page++" 
          :disabled="filters.page === admissionStore.pagination.pages"
          class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>

    </div>

  </div>
</template>