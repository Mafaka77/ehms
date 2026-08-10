<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePatientStore } from '../../../stores/patientStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import CreatePatientModal from './Create.vue'
import EditPatientModal from './Edit.vue'

const patientStore = usePatientStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedPatient = ref(null)

const filters = ref({
  search: '',
  gender: '',
  bloodGroup: '',
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
  await patientStore.fetchPatients(filters.value)
}

const handleFilterChange = () => {
  filters.value.page = 1
  fetchData()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    gender: '',
    bloodGroup: '',
    page: 1,
    limit: 10
  }
  fetchData()
}

const openEditModal = (patient) => {
  selectedPatient.value = patient
  showEditModal.value = true
}

const confirmDelete = async (patient) => {
  if (confirm(`Are you sure you want to delete patient "${patient.fullName}" (${patient.patientCode})?`)) {
    const res = await patientStore.deletePatient(patient._id)
    if (res.success) {
      snackbarStore.show({ message: 'Patient record deleted', type: 'success' })
      fetchData()
    } else {
      snackbarStore.show({ message: res.message || 'Failed to delete patient', type: 'error' })
    }
  }
}

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= patientStore.pagination.pages) {
    filters.value.page = newPage
    fetchData()
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6 pb-12">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
            {{ patientStore.pagination.total }} Patients
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">Manage patient records, demographics, and contact information</p>
      </div>

      <button
        v-if="authStore.hasPermission('patient.create')"
        @click="showCreateModal = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>Register Patient</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
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
            placeholder="Search by code, name, mobile, email..."
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50"
          />
        </div>

        <!-- Gender Filter -->
        <div>
          <select
            v-model="filters.gender"
            @change="handleFilterChange"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Blood Group Filter -->
        <div>
          <select
            v-model="filters.bloodGroup"
            @change="handleFilterChange"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="flex items-center gap-2">
          <button
            @click="resetFilters"
            class="w-full px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      
      <!-- Table Loading State -->
      <div v-if="patientStore.loading" class="p-8 space-y-4 animate-pulse">
        <div v-for="i in 5" :key="i" class="h-10 bg-slate-100 rounded-xl"></div>
      </div>

      <!-- Table Content -->
      <div v-else-if="patientStore.patients.length" class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3 px-4">Patient Code</th>
              <th class="py-3 px-4">Full Name</th>
              <th class="py-3 px-4">Age / Gender</th>
              <th class="py-3 px-4">Blood Group</th>
              <th class="py-3 px-4">Mobile / Alt Contact</th>
              <th class="py-3 px-4">Address</th>
              <th class="py-3 px-4">Status</th>
              <th v-if="authStore.hasPermission('patient.update') || authStore.hasPermission('patient.delete')" class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="patient in patientStore.patients" :key="patient._id" class="hover:bg-slate-50/60 transition-all">
              
              <!-- Patient Code -->
              <td class="py-3 px-4">
                <span class="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {{ patient.patientCode }}
                </span>
              </td>

              <!-- Name & Email -->
              <td class="py-3 px-4">
                <p class="font-bold text-slate-900">{{ patient.fullName }}</p>
                <p v-if="patient.email" class="text-[10px] text-slate-400 font-normal">{{ patient.email }}</p>
              </td>

              <!-- Gender & Age -->
              <td class="py-3 px-4">
                <span>{{ patient.gender || '—' }}</span>
                <span v-if="patient.age != null" class="text-slate-400 font-normal"> ({{ patient.age }} yrs)</span>
              </td>

              <!-- Blood Group -->
              <td class="py-3 px-4">
                <span v-if="patient.bloodGroup" class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                  {{ patient.bloodGroup }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>

              <!-- Contact -->
              <td class="py-3 px-4">
                <p class="font-semibold text-slate-800">{{ patient.mobileNo }}</p>
                <p v-if="patient.alternateMobileNo" class="text-[10px] text-slate-400 font-normal">Alt: {{ patient.alternateMobileNo }}</p>
              </td>

              <!-- Address -->
              <td class="py-3 px-4 max-w-xs truncate text-slate-500" :title="patient.address">
                {{ patient.address || '—' }}
              </td>

              <!-- Status -->
              <td class="py-3 px-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="patient.isActive !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'"
                >
                  {{ patient.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td v-if="authStore.hasPermission('patient.update') || authStore.hasPermission('patient.delete')" class="py-3 px-4 text-right space-x-1">
                <button
                  v-if="authStore.hasPermission('patient.update')"
                  @click="openEditModal(patient)"
                  class="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                  title="Edit Patient"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  v-if="authStore.hasPermission('patient.delete')"
                  @click="confirmDelete(patient)"
                  class="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                  title="Delete Patient"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="p-12 text-center text-slate-400 space-y-2">
        <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-sm font-semibold text-slate-600">No patients found</p>
        <p class="text-xs text-slate-400">Try adjusting your search query or filters</p>
      </div>

      <!-- Pagination Footer -->
      <div v-if="patientStore.pagination.pages > 1" class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        <p class="text-slate-500 font-medium">
          Showing Page <span class="font-bold text-slate-800">{{ patientStore.pagination.page }}</span> of <span class="font-bold text-slate-800">{{ patientStore.pagination.pages }}</span>
        </p>

        <div class="flex items-center gap-2">
          <button
            @click="changePage(patientStore.pagination.page - 1)"
            :disabled="patientStore.pagination.page <= 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <button
            @click="changePage(patientStore.pagination.page + 1)"
            :disabled="patientStore.pagination.page >= patientStore.pagination.pages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

    </div>

    <!-- Modals -->
    <CreatePatientModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="fetchData"
    />

    <EditPatientModal
      :show="showEditModal"
      :patient="selectedPatient"
      @close="showEditModal = false"
      @updated="fetchData"
    />

  </div>
</template>
