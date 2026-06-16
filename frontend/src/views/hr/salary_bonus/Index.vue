<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../../../stores/employeeStore'
import { useMasterDepartmentStore } from '../../../stores/masterDepartmentStore'

const router = useRouter()
const employeeStore = useEmployeeStore()
const masterDepartmentStore = useMasterDepartmentStore()

// Pagination & Search States
const currentPage = ref(1)
const limit = ref(10)
const selectedDeptFilter = ref('')

const fetchAllData = async () => {
  try {
    await employeeStore.fetchEmployees(
      currentPage.value,
      limit.value,
      employeeStore.searchQuery,
      selectedDeptFilter.value,
      '', // employmentType
      'true' // isActive (only list active employees for salary bonus setup)
    )
  } catch (err) {
    console.error(err)
  }
}

// Watch filters, search
let debounceTimer = null
watch(() => employeeStore.searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchAllData()
  }, 400)
})

watch([currentPage, limit, selectedDeptFilter], () => {
  fetchAllData()
})

const viewBonuses = (empId) => {
  router.push(`/salary-bonus/view/${empId}`)
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '₹0'
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)
}

onMounted(async () => {
  try {
    await masterDepartmentStore.fetchDepartments(1, 100)
    await fetchAllData()
  } catch (err) {
    console.error(err)
  }
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Salary & Bonus</h1>
        <p class="text-slate-500 mt-1 text-sm">Select an employee to view and manage their recurring and one-time salary bonuses.</p>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">Employee Directory</h2>
          
          <!-- Search box -->
          <div class="relative w-full lg:w-80">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="employeeStore.searchQuery"
              type="text" 
              placeholder="Search by name or code..." 
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <!-- Department Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Department</label>
            <select 
              v-model="selectedDeptFilter"
              class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Departments</option>
              <option v-for="d in masterDepartmentStore.departments" :key="d._id" :value="d._id">{{ d.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="employeeStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading employee list...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="employeeStore.employees.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No staff profiles found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          No active employees match the search filter.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[15%]">Code</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[35%]">Full Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[25%]">Dept / Job Title</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[15%]">Basic Salary</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[10%] text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="emp in employeeStore.employees" 
              :key="emp._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Code -->
              <td class="px-6 py-4 text-slate-700 font-mono text-xs font-semibold">
                {{ emp.employeeCode }}
              </td>

              <!-- Name & Contact -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                    {{ emp.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="font-semibold text-slate-800 text-sm block">{{ emp.fullName }}</span>
                    <span class="text-slate-500 text-[11px] block mt-0.5">{{ emp.email }}</span>
                  </div>
                </div>
              </td>

              <!-- Org Details -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[11px] border border-slate-200/50 inline-block">
                    {{ emp.departmentId?.name || 'Unassigned' }}
                  </span>
                  <span class="text-slate-500 text-xs block font-medium pl-1">
                    {{ emp.designationId?.designationName || 'Unassigned' }}
                  </span>
                </div>
              </td>

              <!-- Salary -->
              <td class="px-6 py-4 text-sm text-slate-600 font-medium font-mono">
                {{ formatCurrency(emp.basicSalary) }}
              </td>

              <!-- Action -->
              <td class="px-6 py-4 text-center">
                <button 
                  @click="viewBonuses(emp._id)"
                  class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 mx-auto border border-indigo-100 shadow-sm"
                >
                  <span>View Bonuses</span>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div 
        v-if="employeeStore.pagination.total > 0" 
        class="px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10"
      >
        <!-- Info Text -->
        <span class="text-sm text-slate-500 font-medium">
          Showing 
          <span class="text-slate-800 font-semibold">{{ (currentPage - 1) * limit + 1 }}</span> 
          to 
          <span class="text-slate-800 font-semibold">{{ Math.min(currentPage * limit, employeeStore.pagination.total) }}</span> 
          of 
          <span class="text-slate-800 font-semibold">{{ employeeStore.pagination.total }}</span> 
          entries
        </span>

        <!-- Pagination Buttons -->
        <div v-if="employeeStore.pagination.pages > 1" class="flex items-center gap-2">
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
            v-for="page in employeeStore.pagination.pages" 
            :key="page"
            @click="currentPage = page"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
            :class="currentPage === page ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ page }}
          </button>

          <!-- Next Button -->
          <button 
            @click="currentPage < employeeStore.pagination.pages && currentPage++"
            :disabled="currentPage === employeeStore.pagination.pages"
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
