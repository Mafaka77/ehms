<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEmployeeStore } from '../../../stores/employeeStore'
import { useMasterDepartmentStore } from '../../../stores/masterDepartmentStore'
import { useAuthStore } from '../../../stores/authStore'

const router = useRouter()
const snackbarStore = useSnackbarStore()
const employeeStore = useEmployeeStore()
const masterDepartmentStore = useMasterDepartmentStore()
const authStore = useAuthStore()

// Pagination & Search States
const currentPage = ref(1)
const limit = ref(10)

const selectedDeptFilter = ref('')
const selectedTypeFilter = ref('')
const selectedStatusFilter = ref('')

const fetchEmployees = async () => {
  try {
    await employeeStore.fetchEmployees(
      currentPage.value, 
      limit.value, 
      employeeStore.searchQuery, 
      selectedDeptFilter.value, 
      selectedTypeFilter.value, 
      selectedStatusFilter.value
    )
  } catch (err) {
    console.error(err)
  }
}

// Watch filters & search
let debounceTimer = null
watch(() => employeeStore.searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchEmployees()
  }, 400)
})

watch([currentPage, limit, selectedDeptFilter, selectedTypeFilter, selectedStatusFilter], () => {
  fetchEmployees()
})

const openAddPage = () => {
  router.push('/employee/create')
}

const openEditPage = (emp) => {
  router.push(`/employee/edit/${emp._id}`)
}

const handleDelete = async (emp) => {
  if (confirm(`Are you sure you want to remove employee ${emp.fullName} (${emp.employeeCode})?`)) {
    const response = await employeeStore.deleteEmployee(emp._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'Employee profile removed successfully',
        type: 'success'
      })
      if (employeeStore.employees.length === 0 && currentPage.value > 1) {
        currentPage.value--
      } else {
        fetchEmployees()
      }
    } else {
      snackbarStore.show({
        message: response.message || 'Failed to delete employee',
        type: 'error'
      })
    }
  }
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '₹0'
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    await masterDepartmentStore.fetchDepartments(1, 100)
    await fetchEmployees()
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
        <h1 class="text-2xl font-bold text-slate-900">Employees</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage hospital staff directory, organizational settings, and salary allocations.</p>
      </div>
      <button 
        v-if="authStore.hasPermission('employee.create')"
        @click="openAddPage"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
      >
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Add Employee
      </button>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">Staff Directory</h2>
          
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
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <!-- Department Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Department</label>
            <select 
              v-model="selectedDeptFilter"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Departments</option>
              <option v-for="d in masterDepartmentStore.departments" :key="d._id" :value="d._id">{{ d.name }}</option>
            </select>
          </div>

          <!-- Employment Type Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Type</label>
            <select 
              v-model="selectedTypeFilter"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Status</label>
            <select 
              v-model="selectedStatusFilter"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
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
        <span class="text-sm font-medium">Loading employees...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="employeeStore.employees.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No staff profiles found</p>
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
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[18%]">Dept / Job Title</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%]">Type</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%]">Salary</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[10%] text-center">Status</th>
              <th v-if="authStore.hasPermission('employee.update') || authStore.hasPermission('employee.delete')" class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[12%] text-center">Actions</th>
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
                    <span class="text-slate-400 text-[11px] block">{{ emp.mobile }}</span>
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

              <!-- Employment Type -->
              <td class="px-6 py-4 text-sm text-slate-600 font-medium">
                {{ emp.employmentType }}
              </td>

              <!-- Salary -->
              <td class="px-6 py-4 text-sm text-slate-700 font-semibold font-mono">
                {{ formatCurrency(emp.basicSalary) }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4 text-center">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="emp.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="emp.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  {{ emp.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td v-if="authStore.hasPermission('employee.update') || authStore.hasPermission('employee.delete')" class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    v-if="authStore.hasPermission('employee.update')"
                    @click="openEditPage(emp)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    title="Edit Profile"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('employee.delete')"
                    @click="handleDelete(emp)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Remove Profile"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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