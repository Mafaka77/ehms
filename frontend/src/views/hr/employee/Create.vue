<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore.js'
import { useEmployeeStore } from '../../../stores/employeeStore.js'
import { useMasterDepartmentStore } from '../../../stores/masterDepartmentStore.js'
import { useMasterDesignationStore } from '../../../stores/masterDesignationStore.js'
import BaseInput from '../../../components/BaseInput.vue'
import BaseSelect from '../../../components/BaseSelect.vue'

const router = useRouter()
const snackbarStore = useSnackbarStore()
const employeeStore = useEmployeeStore()
const masterDepartmentStore = useMasterDepartmentStore()
const masterDesignationStore = useMasterDesignationStore()

const form = reactive({
  employeeCode: '',
  fullName: '',
  mobile: '',
  email: '',
  departmentId: '',
  designationId: '',
  joiningDate: '',
  employmentType: 'Permanent',
  basicSalary: '',
  isActive: true
})

const loading = ref(false)
const error = ref('')
const selectedDesignationName = ref('')

const isNursingDesignation = computed(() =>
  /nurs/i.test(selectedDesignationName.value)
)

const deptSearch = ref('')
const isDeptOpen = ref(false)

const desigSearch = ref('')
const isDesigOpen = ref(false)

const filteredDepartments = computed(() => {
  return masterDepartmentStore.departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.value.toLowerCase())
  )
})

const filteredDesignations = computed(() => {
  return masterDesignationStore.designations.filter(d => 
    d.designationName.toLowerCase().includes(desigSearch.value.toLowerCase())
  )
})

const selectDepartment = (dept) => {
  form.departmentId = dept._id
  deptSearch.value = dept.name
  isDeptOpen.value = false
}

const selectDesignation = (desig) => {
  form.designationId = desig._id
  desigSearch.value = desig.designationName
  selectedDesignationName.value = desig.designationName
  isDesigOpen.value = false
}

const clearDepartment = () => {
  form.departmentId = ''
  deptSearch.value = ''
}

const clearDesignation = () => {
  form.designationId = ''
  desigSearch.value = ''
  selectedDesignationName.value = ''
}

const handleBack = () => {
  router.push('/employee')
}

onMounted(async () => {
  loading.value = true
  try {
    // Load departments & designations for select dropdowns
    await Promise.all([
      masterDepartmentStore.fetchDepartments(1, 100),
      masterDesignationStore.fetchDesignations(1, 100)
    ])
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  if (!form.fullName.trim()) {
    error.value = 'Full name is required'
    return
  }
  if (!form.mobile) {
    error.value = 'Mobile number is required'
    return
  }
  if (!form.email.trim()) {
    error.value = 'Email address is required'
    return
  }
  if (!form.departmentId) {
    error.value = 'Department selection is required'
    return
  }
  if (!form.designationId) {
    error.value = 'Designation selection is required'
    return
  }
  if (!form.joiningDate) {
    error.value = 'Joining date is required'
    return
  }
  if (form.basicSalary === '' || form.basicSalary <= 0) {
    error.value = 'Basic salary must be greater than zero'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await employeeStore.createEmployee(form)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'Employee registered successfully!',
        type: 'success'
      })
      handleBack()
    } else {
      error.value = response.message || 'Failed to create employee'
      snackbarStore.show({
        message: error.value,
        type: 'error'
      })
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    snackbarStore.show({
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <button 
        @click="handleBack"
        class="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-sm focus:outline-none"
        title="Go Back"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">
          Register New Employee
        </h1>
        <p class="text-slate-500 text-sm mt-0.5">
          Fill in the administrative and payroll details to register a new staff member.
        </p>
      </div>
    </div>

    <!-- Form Panel Card -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading form options...</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="p-8 space-y-6">
        <!-- Error Message Banner -->
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
          <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Nursing Role Notice Banner -->
        <div v-if="isNursingDesignation" class="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5">
          <svg class="w-5 h-5 flex-shrink-0 text-sky-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span class="font-bold block">Nursing role detected</span>
            <span class="text-sky-700">A system login account will be automatically created for this employee with the <strong>Nurse</strong> role. Default password will be their <strong>mobile number</strong>.</span>
          </div>
        </div>

        <!-- Section 1: Basic Information -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput 
              v-model="form.fullName"
              id="fullName"
              label="Full Name"
              placeholder="e.g. Dr. Arthur Dent"
              required
              :disabled="loading"
            />
            <BaseInput 
              v-model.number="form.mobile"
              id="mobile"
              label="Mobile Number"
              type="number"
              placeholder="e.g. 9876543210"
              required
              :disabled="loading"
            />
            <BaseInput 
              v-model="form.email"
              id="email"
              label="Email Address"
              type="email"
              placeholder="e.g. arthur@hms.com"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Section 2: Organization & Work Info -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Organization & Contract</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Department Autocomplete -->
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Department <span class="text-rose-500">*</span></label>
              
              <div v-if="form.departmentId" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span class="text-sm font-bold text-indigo-900">{{ deptSearch }}</span>
                <button type="button" @click="clearDepartment" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div v-else class="relative">
                <input 
                  type="text" 
                  v-model="deptSearch" 
                  @focus="isDeptOpen = true"
                  @blur="setTimeout(() => isDeptOpen = false, 200)"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Search department..."
                  :disabled="loading"
                />
                
                <div v-if="isDeptOpen && filteredDepartments.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li 
                      v-for="d in filteredDepartments" 
                      :key="d._id" 
                      @mousedown.prevent="selectDepartment(d)"
                      class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col"
                    >
                      <span class="text-sm font-semibold text-slate-700">{{ d.name }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Designation Autocomplete -->
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Designation <span class="text-rose-500">*</span></label>
              
              <div v-if="form.designationId" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span class="text-sm font-bold text-indigo-900">{{ desigSearch }}</span>
                <button type="button" @click="clearDesignation" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div v-else class="relative">
                <input 
                  type="text" 
                  v-model="desigSearch" 
                  @focus="isDesigOpen = true"
                  @blur="setTimeout(() => isDesigOpen = false, 200)"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Search designation..."
                  :disabled="loading"
                />
                
                <div v-if="isDesigOpen && filteredDesignations.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li 
                      v-for="ds in filteredDesignations" 
                      :key="ds._id" 
                      @mousedown.prevent="selectDesignation(ds)"
                      class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col"
                    >
                      <span class="text-sm font-semibold text-slate-700">{{ ds.designationName }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <BaseInput 
              v-model="form.joiningDate"
              id="joiningDate"
              label="Joining Date"
              type="date"
              required
              :disabled="loading"
            />

            <BaseSelect
              v-model="form.employmentType"
              id="employmentType"
              label="Employment Type"
              required
              :disabled="loading"
            >
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
            </BaseSelect>
          </div>
        </div>

        <!-- Section 3: Payroll & Status -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Payroll & Status</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <!-- Employee Code (Read-only/auto-generated) -->
              <BaseInput 
                v-model="form.employeeCode"
                id="employeeCode"
                label="Employee Code"
                placeholder="Auto-generated"
                :disabled="true"
              />
              <BaseInput 
                v-model.number="form.basicSalary"
                id="basicSalary"
                label="Basic Salary (₹)"
                type="number"
                placeholder="e.g. 50000"
                required
                :disabled="loading"
              />
            </div>

            <!-- Active Checkbox -->
            <div class="flex items-center gap-3 pl-2 pt-6 md:pt-4">
              <input 
                type="checkbox" 
                id="isActive"
                v-model="form.isActive"
                :disabled="loading"
                class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <label for="isActive" class="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                Active & Currently Employed
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions Footer -->
        <div class="flex justify-end items-center gap-3 pt-6 border-t border-slate-100">
          <button 
            type="button" 
            @click="handleBack" 
            class="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100"
            :disabled="loading"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-100 transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Saving...' : 'Register Employee' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Shake Animation for Form Errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
