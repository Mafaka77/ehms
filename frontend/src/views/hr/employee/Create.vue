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
  address: '',
  departmentId: '',
  designationId: '',
  joiningDate: '',
  employmentType: 'Permanent',
  basicSalary: '',
  isActive: true,
  profilePhoto: '',
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  }
})

const handlePhotoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.profilePhoto = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

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
          
          <!-- Profile Photo Upload -->
          <div class="mb-6 flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <div class="w-24 h-24 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-sm">
              <img v-if="form.profilePhoto" :src="form.profilePhoto" class="w-full h-full object-cover" alt="Profile Photo" />
              <div v-else class="text-slate-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              
              <!-- Hover Overlay to change photo -->
              <label v-if="form.profilePhoto && !loading" for="profilePhotoUpload" class="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span class="text-[10px] font-semibold tracking-wide uppercase">Change</span>
              </label>
            </div>
            
            <div class="flex-grow text-center sm:text-left">
              <h4 class="text-sm font-semibold text-slate-800 mb-1">Employee Photo</h4>
              <p class="text-xs text-slate-500 mb-3 max-w-sm">Upload a professional photograph for the employee's profile and ID card. Supported formats: JPG, PNG.</p>
              
              <div class="flex flex-wrap gap-3 justify-center sm:justify-start">
                <label for="profilePhotoUpload" :class="['inline-block px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm select-none', loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95']">
                  {{ form.profilePhoto ? 'Upload New Photo' : 'Choose File' }}
                </label>
                <button v-if="form.profilePhoto" type="button" @click="form.profilePhoto = ''" :disabled="loading" class="inline-block px-4 py-2 bg-white border border-rose-100 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer shadow-sm active:scale-95 select-none disabled:opacity-50 disabled:cursor-not-allowed">
                  Remove
                </button>
              </div>
              <input type="file" id="profilePhotoUpload" accept="image/png, image/jpeg" class="hidden" @change="handlePhotoUpload" :disabled="loading" />
            </div>
          </div>

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
          <div class="mt-6">
            <BaseInput 
              v-model="form.address"
              id="address"
              label="Address"
              placeholder="e.g. 123 Main St, City, State, ZIP"
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

        <!-- Section 4: Bank Details -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Bank Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput 
              v-model="form.bankDetails.bankName"
              id="bankName"
              label="Bank Name"
              placeholder="e.g. State Bank of India"
              :disabled="loading"
            />
            <BaseInput 
              v-model="form.bankDetails.accountName"
              id="accountName"
              label="Account Holder Name"
              placeholder="e.g. Arthur Dent"
              :disabled="loading"
            />
            <BaseInput 
              v-model="form.bankDetails.accountNumber"
              id="accountNumber"
              label="Account Number"
              placeholder="e.g. 1234567890"
              :disabled="loading"
            />
            <div class="grid grid-cols-2 gap-4">
              <BaseInput 
                v-model="form.bankDetails.ifscCode"
                id="ifscCode"
                label="IFSC Code"
                placeholder="e.g. SBIN0001234"
                :disabled="loading"
              />
              <BaseInput 
                v-model="form.bankDetails.branchName"
                id="branchName"
                label="Branch Name"
                placeholder="e.g. Main Branch"
                :disabled="loading"
              />
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
