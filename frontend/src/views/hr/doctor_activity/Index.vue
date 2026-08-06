<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDoctorActivityStore } from '../../../stores/doctorActivityStore'
import { useMasterSpecializationStore } from '../../../stores/masterSpecializationStore'

const router = useRouter()
const doctorActivityStore = useDoctorActivityStore()
const specializationStore = useMasterSpecializationStore()

const filters = ref({
  search: '',
  doctorType: '',
  specializationId: '',
  page: 1,
  limit: 10
})

let searchDebounce = null

const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    filters.value.page = 1
    fetchData()
  }, 300)
}

const fetchData = async () => {
  await doctorActivityStore.fetchDoctorActivities(filters.value)
}

const handleFilterChange = () => {
  filters.value.page = 1
  fetchData()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    doctorType: '',
    specializationId: '',
    page: 1,
    limit: 10
  }
  fetchData()
}

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= doctorActivityStore.pagination.pages) {
    filters.value.page = newPage
    fetchData()
  }
}

// Summary Metrics
const totalDoctors = computed(() => doctorActivityStore.pagination.total)
const totalOpdToday = computed(() => {
  return doctorActivityStore.doctors.reduce((acc, doc) => acc + (doc.opdTodayCount || 0), 0)
})
const totalActiveIpd = computed(() => {
  return doctorActivityStore.doctors.reduce((acc, doc) => acc + (doc.activeIpdCount || 0), 0)
})

const doctorTypeClass = (type) => {
  switch (type) {
    case 'PERMANENT': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'CONSULTANT': return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'VISITING': return 'bg-amber-50 text-amber-700 border-amber-100'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

onMounted(async () => {
  specializationStore.fetchSpecializations()
  fetchData()
})
</script>

<template>
  <div class="space-y-6 pb-12">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Doctor Activity Summary</h1>
        <p class="text-xs text-slate-500 mt-1">Overview of OPD consultations, active IPD admissions, and performance per doctor</p>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      
      <!-- Total Doctors -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Registered Doctors</p>
          <p class="text-3xl font-black text-slate-900 mt-1">{{ totalDoctors }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>

      <!-- OPD Today -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">OPD Today</p>
          <p class="text-3xl font-black text-sky-600 mt-1">{{ totalOpdToday }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Consultations today</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Active IPD Admissions -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active IPD Patients</p>
          <p class="text-3xl font-black text-violet-600 mt-1">{{ totalActiveIpd }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Under doctor supervision</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      </div>

    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        <!-- Search Input -->
        <div class="relative">
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            v-model="filters.search"
            @input="onSearchInput"
            placeholder="Search doctor by name, code, contact..."
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50"
          />
        </div>

        <!-- Doctor Type Filter -->
        <div>
          <select
            v-model="filters.doctorType"
            @change="handleFilterChange"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Doctor Types</option>
            <option value="PERMANENT">Permanent</option>
            <option value="CONSULTANT">Consultant</option>
            <option value="VISITING">Visiting</option>
          </select>
        </div>

        <!-- Specialization Filter -->
        <div>
          <select
            v-model="filters.specializationId"
            @change="handleFilterChange"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Specializations</option>
            <option
              v-for="spec in specializationStore.specializations"
              :key="spec._id"
              :value="spec._id"
            >
              {{ spec.name }}
            </option>
          </select>
        </div>

        <!-- Reset Button -->
        <div>
          <button
            @click="resetFilters"
            class="w-full px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

      </div>
    </div>

    <!-- Doctor Activity Data Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      
      <!-- Loading State -->
      <div v-if="doctorActivityStore.loading" class="p-8 space-y-4 animate-pulse">
        <div v-for="i in 5" :key="i" class="h-12 bg-slate-100 rounded-xl"></div>
      </div>

      <!-- Table -->
      <div v-else-if="doctorActivityStore.doctors.length" class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3 px-4">Doctor</th>
              <th class="py-3 px-4">Specialization</th>
              <th class="py-3 px-4">Type</th>
              <th class="py-3 px-4 text-center">OPD Today</th>
              <th class="py-3 px-4 text-center">Total OPD</th>
              <th class="py-3 px-4 text-center">Active IPD</th>
              <th class="py-3 px-4 text-center">Remuneration Rules</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr
              v-for="doc in doctorActivityStore.doctors"
              :key="doc._id"
              class="hover:bg-slate-50/60 transition-all cursor-pointer"
              @click="router.push(`/doctor-activity/view/${doc._id}`)"
            >
              <!-- Doctor Info -->
              <td class="py-3.5 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                    {{ (doc.fullName || 'D')[0] }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 text-xs">Dr. {{ doc.fullName }}</p>
                    <p class="text-[10px] text-slate-400 font-normal">
                      {{ doc.doctorCode }} • {{ doc.mobileNo || 'No phone' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Specialization -->
              <td class="py-3.5 px-4">
                <p class="font-semibold text-slate-800">{{ doc.specializationId?.name || 'General' }}</p>
                <p v-if="doc.qualification" class="text-[10px] text-slate-400 font-normal">{{ doc.qualification }}</p>
              </td>

              <!-- Doctor Type -->
              <td class="py-3.5 px-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  :class="doctorTypeClass(doc.doctorType)"
                >
                  {{ doc.doctorType || 'REGULAR' }}
                </span>
              </td>

              <!-- OPD Today -->
              <td class="py-3.5 px-4 text-center">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold"
                  :class="doc.opdTodayCount > 0 ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'text-slate-400'"
                >
                  {{ doc.opdTodayCount || 0 }}
                </span>
              </td>

              <!-- Total OPD -->
              <td class="py-3.5 px-4 text-center font-bold text-slate-800">
                {{ doc.opdTotalCount || 0 }}
              </td>

              <!-- Active IPD -->
              <td class="py-3.5 px-4 text-center">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold"
                  :class="doc.activeIpdCount > 0 ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'text-slate-400'"
                >
                  {{ doc.activeIpdCount || 0 }}
                </span>
              </td>

              <!-- Rules Count -->
              <td class="py-3.5 px-4 text-center font-semibold text-slate-600">
                {{ doc.rulesCount || 0 }} rules
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right" @click.stop>
                <button
                  @click="router.push(`/doctor-activity/view/${doc._id}`)"
                  class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-xs transition-all cursor-pointer"
                >
                  View Activity →
                </button>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="p-12 text-center text-slate-400 space-y-2">
        <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p class="text-sm font-semibold text-slate-600">No doctors found</p>
        <p class="text-xs text-slate-400">Try adjusting your search query or filters</p>
      </div>

      <!-- Pagination -->
      <div v-if="doctorActivityStore.pagination.pages > 1" class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        <p class="text-slate-500 font-medium">
          Showing Page <span class="font-bold text-slate-800">{{ doctorActivityStore.pagination.page }}</span> of <span class="font-bold text-slate-800">{{ doctorActivityStore.pagination.pages }}</span>
        </p>

        <div class="flex items-center gap-2">
          <button
            @click="changePage(doctorActivityStore.pagination.page - 1)"
            :disabled="doctorActivityStore.pagination.page <= 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <button
            @click="changePage(doctorActivityStore.pagination.page + 1)"
            :disabled="doctorActivityStore.pagination.page >= doctorActivityStore.pagination.pages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

    </div>

  </div>
</template>
