<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import { useNursingStore } from '../../../stores/nursingStore'
import SearchableSelect from '../../../components/SearchableSelect.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()
const nursingStore = useNursingStore()

// State variables
const station = ref(null)
const loadingStation = ref(true)
const assignments = ref([])
const loadingAssignments = ref(false)
const nurses = ref([])

// Roster pagination
const currentPage = ref(1)
const limit = ref(10)
const pagination = ref({ total: 0, page: 1, limit: 10, pages: 1 })

// Assignment Modal controls
const showFormModal = ref(false)
const showViewModal = ref(false)
const isEditMode = ref(false)
const currentAssignmentId = ref(null)
const selectedAssignment = ref(null)

const ASSIGNMENT_TYPES = [
  { value: 'STAFF_NURSE',    label: 'Staff Nurse' },
  { value: 'SENIOR_NURSE',   label: 'Senior Nurse' },
  { value: 'FLOATING_NURSE', label: 'Floating Nurse' },
  { value: 'INCHARGE',       label: 'In-Charge' }
]

const form = ref({
  nursingStationId: props.id,
  nurseId: '',
  assignmentType: 'STAFF_NURSE',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  remarks: '',
  isActive: true
})

const nurseOptions = computed(() =>
  (nurses.value || []).map(n => ({ value: n._id, label: `${n.fullName} (${n.email})` }))
)

const typeLabel = (val) => ASSIGNMENT_TYPES.find(t => t.value === val)?.label || val

const typeColors = {
  STAFF_NURSE:    'bg-indigo-50 text-indigo-700 border-indigo-100',
  SENIOR_NURSE:   'bg-violet-50 text-violet-700 border-violet-100',
  FLOATING_NURSE: 'bg-amber-50 text-amber-700 border-amber-100',
  INCHARGE:       'bg-emerald-50 text-emerald-700 border-emerald-100'
}

// Data loaders
const loadStationDetails = async () => {
  loadingStation.value = true
  try {
    station.value = await nursingStore.getNursingStationById(props.id)
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load station details', type: 'error' })
  } finally {
    loadingStation.value = false
  }
}

const loadAssignments = async () => {
  loadingAssignments.value = true
  try {
    const params = { 
      page: currentPage.value, 
      limit: limit.value, 
      nursingStationId: props.id 
    }
    const result = await nursingStore.fetchAssignments(params)
    assignments.value = result.assignments || []
    pagination.value = result.pagination || pagination.value
  } catch (err) {
    console.error(err)
  } finally {
    loadingAssignments.value = false
  }
}

const loadNurses = async () => {
  try {
    nurses.value = await nursingStore.fetchNurses()
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  await nursingStore.fetchWards()
  await loadStationDetails()
  await loadAssignments()
  await loadNurses()
})

watch([currentPage, limit], loadAssignments)

const getWardName = (ward) => {
  if (!ward) return 'Not Assigned'
  if (typeof ward === 'object' && ward.name) {
    return ward.code ? `${ward.name} (${ward.code})` : ward.name
  }
  const wardIdStr = typeof ward === 'object' ? (ward._id || ward).toString() : ward
  const found = (nursingStore.wards || []).find(w => w._id === wardIdStr)
  return found ? (found.code ? `${found.name} (${found.code})` : found.name) : 'Not Assigned'
}

// Assignment operations
const openCreateAssignment = () => {
  isEditMode.value = false
  currentAssignmentId.value = null
  form.value = {
    nursingStationId: props.id,
    nurseId: '',
    assignmentType: 'STAFF_NURSE',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    remarks: '',
    isActive: true
  }
  showFormModal.value = true
}

const openEditAssignment = (a) => {
  isEditMode.value = true
  currentAssignmentId.value = a._id
  form.value = {
    nursingStationId: props.id,
    nurseId:          a.nurseId?._id || a.nurseId || '',
    assignmentType:   a.assignmentType || 'STAFF_NURSE',
    startDate:        a.startDate ? a.startDate.slice(0, 10) : '',
    endDate:          a.endDate ? a.endDate.slice(0, 10) : '',
    remarks:          a.remarks || '',
    isActive:         a.isActive !== undefined ? a.isActive : true
  }
  showFormModal.value = true
}

const openViewAssignment = (a) => {
  selectedAssignment.value = a
  showViewModal.value = true
}

const handleAssignmentSubmit = async () => {
  if (!form.value.nurseId) {
    snackbarStore.show({ message: 'Nurse selection is required.', type: 'warning' })
    return
  }
  try {
    const payload = { ...form.value }
    if (!payload.endDate) delete payload.endDate

    let res
    if (isEditMode.value) {
      res = await nursingStore.updateAssignment(currentAssignmentId.value, payload)
    } else {
      res = await nursingStore.createAssignment(payload)
    }
    if (res.success) {
      snackbarStore.show({ message: res.message || 'Roster saved successfully', type: 'success' })
      showFormModal.value = false
      await loadAssignments()
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'An error occurred'
    snackbarStore.show({ message: msg, type: 'error' })
  }
}

const handleAssignmentDelete = async (a) => {
  if (!confirm(`Delete assignment roster for ${a.nurseId?.fullName}?`)) return
  try {
    const res = await nursingStore.deleteAssignment(a._id)
    if (res.success) {
      snackbarStore.show({ message: res.message || 'Assignment removed', type: 'success' })
      await loadAssignments()
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    snackbarStore.show({ message: err.response?.data?.message || err.message || 'Remove failed', type: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Breadcrumb & Header -->
    <div v-if="station">
      <nav class="flex items-center text-sm font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
        <router-link :to="{ name: 'nursing-station' }" class="hover:text-indigo-600 transition-colors">Nursing Stations</router-link>
        <svg class="w-4 h-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        <span class="text-slate-900" aria-current="page">{{ station.name }}</span>
      </nav>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
            {{ station.code }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {{ station.name }}
              <span 
                :class="[
                  'px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full inline-block border',
                  station.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                ]"
              >
                {{ station.isActive ? 'Active' : 'Inactive' }}
              </span>
            </h1>
            <p class="text-slate-500 mt-1 text-sm">
              <span class="font-semibold text-slate-700">Primary Ward:</span> {{ getWardName(station.wardId) }}
              <span class="text-slate-300 mx-2">|</span>
              <span class="font-semibold text-slate-700">Location:</span> {{ station.location || 'N/A' }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="router.push({ name: 'nursing-station' })"
            class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to List
          </button>
          <button 
            v-if="authStore.hasPermission('nursing_station.update')"
            @click="router.push({ name: 'nursing-station-edit', params: { id: props.id } })"
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2"
          >
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            Edit Station
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" v-if="station">
      <!-- Profile & Beds Monitored (Left Column) -->
      <div class="lg:col-span-1 space-y-8">
        <!-- Profile details -->
        <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h2 class="text-base font-bold text-slate-800">Station Overview</h2>
          
          <div class="space-y-4">
            <div class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-1">
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">In-Charge Nurse</span>
              <div v-if="station.inchargeNurseId" class="flex items-center gap-3 mt-1">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {{ station.inchargeNurseId.fullName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <span class="text-slate-800 text-sm font-bold block leading-none">{{ station.inchargeNurseId.fullName }}</span>
                  <span class="text-slate-400 text-[11px] block mt-1 leading-none">{{ station.inchargeNurseId.email }}</span>
                </div>
              </div>
              <span v-else class="text-slate-500 text-xs italic block mt-1 font-medium">No Nurse Assigned</span>
            </div>

            <div class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Contact Information</span>
              <span class="text-slate-800 text-sm font-semibold block mt-1">{{ station.contactNo || 'No Extension Number' }}</span>
            </div>

            <div class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Description / Notes</span>
              <p class="text-slate-600 text-xs mt-1.5 leading-relaxed">{{ station.description || 'No detailed capabilities or description recorded.' }}</p>
            </div>
          </div>
        </div>

        <!-- Monitored beds list -->
        <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-800">Monitored Beds</h2>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100/50">
              {{ station.assignedBeds?.length || 0 }} Beds
            </span>
          </div>

          <div class="max-h-[340px] overflow-y-auto space-y-2 pr-1">
            <div 
              v-for="bed in station.assignedBeds" 
              :key="bed._id" 
              class="flex items-center justify-between text-xs bg-slate-50/50 border border-slate-100 p-3 rounded-2xl shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">{{ bed.bedNo }}</span>
                <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold uppercase border border-indigo-100/50">{{ bed.bedType }}</span>
              </div>
              <div class="text-[10px] text-slate-500 flex flex-col items-end">
                <span class="font-medium text-slate-600">{{ getWardName(bed.wardId) }}</span>
                <span v-if="bed.floor || bed.wardId?.floor" class="text-slate-400 text-[9px] mt-0.5">{{ bed.floor || bed.wardId?.floor }}</span>
              </div>
            </div>
            <div v-if="!station.assignedBeds || station.assignedBeds.length === 0" class="text-slate-400 text-xs italic text-center py-6">
              No beds assigned to this station.
            </div>
          </div>
        </div>
      </div>

      <!-- Nurse Assignments Shift Rosters (Right Columns) -->
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <!-- Table Header / Filters -->
          <div class="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-800">Nurse Rosters & Staffing</h2>
              <p class="text-slate-400 text-xs mt-0.5">Manage nurse shift assignments and access roles assigned to this station.</p>
            </div>
            
            <button
              v-if="authStore.hasPermission('nursing_assignment.create')"
              @click="openCreateAssignment"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 transform active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Assign Nurse
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loadingAssignments" class="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium">Loading roster...</span>
          </div>

          <!-- Empty roster -->
          <div v-else-if="assignments.length === 0" class="p-6 text-center py-20">
            <svg class="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p class="text-slate-700 font-semibold text-sm">No Active Nurse Assignments</p>
            <p class="text-slate-400 text-xs mt-1">Assign staff nurses or in-charges to configure shift monitoring.</p>
          </div>

          <!-- Roster table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Nurse</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Role</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Active Period</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Status</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="a in assignments" :key="a._id" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                        {{ a.nurseId?.fullName?.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <span class="font-bold text-slate-800 text-sm block">{{ a.nurseId?.fullName || 'Unknown Nurse' }}</span>
                        <span class="text-slate-400 text-[10px] block mt-0.5">{{ a.nurseId?.email }}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4.5">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border inline-block', typeColors[a.assignmentType]]">
                      {{ typeLabel(a.assignmentType) }}
                    </span>
                  </td>

                  <td class="px-6 py-4.5 text-xs text-slate-600 font-medium">
                    <div>{{ a.startDate ? new Date(a.startDate).toLocaleDateString() : '—' }}</div>
                    <div class="text-[10px] text-slate-400 font-normal mt-0.5">
                      {{ a.endDate ? '→ ' + new Date(a.endDate).toLocaleDateString() : 'Ongoing' }}
                    </div>
                  </td>

                  <td class="px-6 py-4.5 text-center">
                    <span :class="['px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border inline-block', a.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60']">
                      {{ a.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <td class="px-6 py-4.5 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button @click="openViewAssignment(a)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all" title="View Details">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button 
                        v-if="authStore.hasPermission('nursing_assignment.update')"
                        @click="openEditAssignment(a)" 
                        class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2 rounded-xl border border-indigo-100/30 transition-all" 
                        title="Edit Roster"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button 
                        v-if="authStore.hasPermission('nursing_assignment.delete')"
                        @click="handleAssignmentDelete(a)" 
                        class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" 
                        title="Remove Assignment"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.pages > 1" class="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Page {{ currentPage }} of {{ pagination.pages }}</span>
            <div class="flex items-center gap-2">
              <button @click="currentPage--" :disabled="currentPage === 1" class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button @click="currentPage++" :disabled="currentPage === pagination.pages" class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Details Placeholder -->
    <div v-else class="flex flex-col items-center justify-center py-40 text-slate-400">
      <svg class="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-semibold">Loading nursing station overview...</span>
    </div>

    <!-- ── Assignment Create / Edit Modal ──────────────────── -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button @click="showFormModal = false" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h3 class="text-xl font-bold text-slate-900 mb-1">{{ isEditMode ? 'Edit' : 'New' }} Nurse Assignment</h3>
        <p class="text-xs text-slate-400 mb-6">Assign a nurse to this station with a specialized role and active shift dates.</p>

        <form @submit.prevent="handleAssignmentSubmit" class="space-y-5">
          <!-- Nurse Select -->
          <SearchableSelect
            v-model="form.nurseId"
            :options="nurseOptions"
            label="Nurse"
            placeholder="Select Nurse"
            required
          />

          <!-- Assignment Type -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assignment Role</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="t in ASSIGNMENT_TYPES"
                :key="t.value"
                type="button"
                @click="form.assignmentType = t.value"
                :class="[
                  'px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center',
                  form.assignmentType === t.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50/50 text-slate-600 border-slate-200 hover:border-indigo-300'
                ]"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Start Date <span class="text-rose-500">*</span></label>
              <input
                v-model="form.startDate"
                type="date"
                required
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 shadow-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">End Date <span class="text-slate-400 font-normal normal-case">(optional)</span></label>
              <input
                v-model="form.endDate"
                type="date"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 shadow-sm"
              />
            </div>
          </div>

          <!-- Remarks -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Remarks / Special Instructions</label>
            <textarea
              v-model="form.remarks"
              rows="2"
              placeholder="Roster comments, floor shift schedules..."
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 shadow-sm transition-all"
            ></textarea>
          </div>

          <!-- Active Toggle -->
          <div class="flex items-center gap-3 py-1 select-none">
            <input type="checkbox" id="assignmentIsActive" v-model="form.isActive" class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" />
            <label for="assignmentIsActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Assignment is currently active</label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="showFormModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95">
              Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Assignment View Modal ───────────────────────────── -->
    <div v-if="showViewModal && selectedAssignment" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button @click="showViewModal = false" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
            {{ selectedAssignment.nurseId?.fullName?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 leading-tight">{{ selectedAssignment.nurseId?.fullName }}</h3>
            <span class="text-slate-400 text-xs block mt-0.5">{{ selectedAssignment.nurseId?.email }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Nursing Station</span>
              <span class="text-slate-800 text-sm font-bold block mt-0.5">{{ station.name }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Role</span>
              <span :class="['mt-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border inline-block', typeColors[selectedAssignment.assignmentType]]">
                {{ typeLabel(selectedAssignment.assignmentType) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Start Date</span>
              <span class="text-slate-800 text-sm font-semibold block mt-0.5">{{ selectedAssignment.startDate ? new Date(selectedAssignment.startDate).toLocaleDateString() : '—' }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">End Date</span>
              <span class="text-slate-800 text-sm font-semibold block mt-0.5">{{ selectedAssignment.endDate ? new Date(selectedAssignment.endDate).toLocaleDateString() : 'Ongoing' }}</span>
            </div>
          </div>

          <div v-if="selectedAssignment.remarks" class="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
            <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Remarks / Notes</span>
            <p class="text-slate-600 text-xs mt-1.5 leading-relaxed">{{ selectedAssignment.remarks }}</p>
          </div>

          <div class="flex items-center justify-between border-t border-slate-100 pt-5">
            <span :class="['px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border inline-block', selectedAssignment.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60']">
              {{ selectedAssignment.isActive ? 'Active' : 'Inactive' }}
            </span>
            <button @click="showViewModal = false" class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all">
              Close Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
