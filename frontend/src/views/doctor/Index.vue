<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDoctorStore } from '../../stores/doctorStore'
import { useMasterSpecializationStore } from '../../stores/masterSpecializationStore'
import { useAuthStore } from '../../stores/authStore'
import { useSnackbarStore } from '../../stores/snackbarStore'

const router = useRouter()
const doctorStore = useDoctorStore()
const specializationStore = useMasterSpecializationStore()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()

const searchQuery = ref('')
const selectedType = ref('')
const selectedSpecialization = ref('')
const currentPage = ref(1)
const limit = ref(10)

const loadDoctors = async () => {
  try {
    await doctorStore.fetchDoctors(currentPage.value, limit.value, searchQuery.value, selectedType.value, selectedSpecialization.value)
  } catch (err) {
    console.error(err)
  }
}

// Watch filters & search
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadDoctors()
  }, 400)
})

watch([selectedType, selectedSpecialization], () => {
  currentPage.value = 1
  loadDoctors()
})

watch([currentPage, limit], () => {
  loadDoctors()
})

onMounted(async () => {
  await specializationStore.fetchSpecializations(1, 100)
  await loadDoctors()
})

const handleCreate = () => {
  router.push('/doctors/create')
}

const openViewPage = (doctor) => {
  router.push(`/doctors/view/${doctor._id}`)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Manage Doctors</h1>
        <p class="text-slate-500 mt-1 text-sm">View and manage clinical staff.</p>
      </div>
      <button 
        @click="handleCreate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Doctor
      </button>
    </div>

    <!-- Data Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">Doctor Directory</h2>
          
          <!-- Search box -->
          <div class="relative w-full lg:w-80">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by name or code..." 
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <!-- Type Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Type</label>
            <select 
              v-model="selectedType"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Types</option>
              <option value="PERMANENT">Permanent</option>
              <option value="CONSULTANT">Consultant</option>
              <option value="VISITING">Visiting</option>
            </select>
          </div>

          <!-- Specialization Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Specialization</label>
            <select 
              v-model="selectedSpecialization"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Specializations</option>
              <option v-for="spec in specializationStore.specializations" :key="spec._id" :value="spec._id">{{ spec.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="doctorStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading doctors...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="doctorStore.doctors.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No doctors found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          No records match your criteria. Try adjusting the filter dropdowns or typing another search term.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%]">Code</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[24%]">Full Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[18%]">Specialization</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%]">Type</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[10%] text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="doctor in doctorStore.doctors" 
              :key="doctor._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Code -->
              <td class="px-6 py-4 text-slate-700 font-mono text-xs font-semibold">
                {{ doctor.doctorCode || 'Pending' }}
              </td>

              <!-- Name & Contact -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                    {{ doctor.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="font-semibold text-slate-800 text-sm block">{{ doctor.fullName }}</span>
                    <span class="text-slate-500 text-[11px] block mt-0.5">{{ doctor.email }}</span>
                    <span class="text-slate-400 text-[11px] block">{{ doctor.mobileNo }}</span>
                  </div>
                </div>
              </td>

              <!-- Org Details -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[11px] border border-slate-200/50 inline-block">
                    {{ doctor.specializationId?.name || 'N/A' }}
                  </span>
                </div>
              </td>

              <!-- Employment Type -->
              <td class="px-6 py-4 text-sm text-slate-600 font-medium">
                {{ doctor.doctorType }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4 text-center">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="doctor.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="doctor.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  {{ doctor.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openViewPage(doctor)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="View Details"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
        v-if="doctorStore.pagination && doctorStore.pagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <!-- Info Text -->
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, doctorStore.pagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ doctorStore.pagination.total }}</span> 
          entries
        </span>

        <!-- Pagination Buttons -->
        <div v-if="doctorStore.pagination.pages > 1" class="flex items-center gap-2">
          <!-- Previous Button -->
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Page Numbers -->
          <button 
            v-for="page in doctorStore.pagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>

          <!-- Next Button -->
          <button 
            @click="currentPage < doctorStore.pagination.pages && currentPage++"
            :disabled="currentPage === doctorStore.pagination.pages"
            class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next Page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
