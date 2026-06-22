<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore.js'
import { useEmployeeStore } from '../../../stores/employeeStore.js'
import { useMasterDepartmentStore } from '../../../stores/masterDepartmentStore.js'
import { useMasterDesignationStore } from '../../../stores/masterDesignationStore.js'
import { useAuthStore } from '../../../stores/authStore.js'
import BaseInput from '../../../components/BaseInput.vue'
import BaseSelect from '../../../components/BaseSelect.vue'

const route = useRoute()
const router = useRouter()
const snackbarStore = useSnackbarStore()
const employeeStore = useEmployeeStore()
const masterDepartmentStore = useMasterDepartmentStore()
const masterDesignationStore = useMasterDesignationStore()
const authStore = useAuthStore()

const id = computed(() => route.params.id)

const loginEnabled = ref(false)
const userRoleName = ref('')
const rolesList = ref([])

const isLoginModalOpen = ref(false)
const loadingLoginModal = ref(false)
const loginModalError = ref('')
const loginForm = reactive({
  password: '',
  roleId: ''
})

const checkLoginStatus = async () => {
  if (!form.email) return
  try {
    const status = await authStore.checkLoginStatus(form.email)
    if (status.enabled) {
      loginEnabled.value = true
      userRoleName.value = status.user?.role?.name || ''
      loginForm.roleId = status.user?.role?._id || ''
    } else {
      loginEnabled.value = false
      userRoleName.value = ''
      loginForm.roleId = ''
    }
  } catch (err) {
    console.error(err)
  }
}

const openLoginModal = () => {
  loginForm.password = ''
  loginModalError.value = ''
  isLoginModalOpen.value = true
}

const handleCloseLoginModal = () => {
  if (loadingLoginModal.value) return
  isLoginModalOpen.value = false
}

const handleSaveLogin = async () => {
  if (!loginForm.password && !loginEnabled.value) {
    loginModalError.value = 'Password is required'
    return
  }
  if (!loginForm.roleId) {
    loginModalError.value = 'Role selection is required'
    return
  }

  loadingLoginModal.value = true
  loginModalError.value = ''

  try {
    const response = await authStore.enableLogin(id.value, loginForm.password, loginForm.roleId)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'Login profile configured successfully',
        type: 'success'
      })
      await checkLoginStatus()
      handleCloseLoginModal()
    } else {
      loginModalError.value = response.message || 'Failed to enable login'
    }
  } catch (err) {
    console.error(err)
    loginModalError.value = err.message || 'An error occurred'
  } finally {
    loadingLoginModal.value = false
  }
}

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
  isActive: true,
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  }
})

const loading = ref(false)
const error = ref('')

const handleBack = () => {
  router.push('/employee')
}

// Populate edit data
const populateEmployee = async () => {
  if (!id.value) return

  loading.value = true
  try {
    let emp = employeeStore.employees.find(e => e._id === id.value)
    if (!emp) {
      // If refreshed, fetch list first
      await employeeStore.fetchEmployees(1, 100)
      emp = employeeStore.employees.find(e => e._id === id.value)
    }

    if (emp) {
      form.employeeCode = emp.employeeCode || ''
      form.fullName = emp.fullName || ''
      form.mobile = emp.mobile || ''
      form.email = emp.email || ''
      form.departmentId = emp.departmentId?._id || emp.departmentId || ''
      form.designationId = emp.designationId?._id || emp.designationId || ''
      form.joiningDate = emp.joiningDate ? emp.joiningDate.split('T')[0] : ''
      form.employmentType = emp.employmentType || 'Permanent'
      form.basicSalary = emp.basicSalary || ''
      form.isActive = emp.isActive !== false
      if (emp.bankDetails) {
        form.bankDetails.bankName = emp.bankDetails.bankName || ''
        form.bankDetails.accountName = emp.bankDetails.accountName || ''
        form.bankDetails.accountNumber = emp.bankDetails.accountNumber || ''
        form.bankDetails.ifscCode = emp.bankDetails.ifscCode || ''
        form.bankDetails.branchName = emp.bankDetails.branchName || ''
      } else {
        form.bankDetails = {
          bankName: '',
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          branchName: ''
        }
      }
    } else {
      error.value = 'Employee profile not found.'
      snackbarStore.show({
        message: 'Employee profile not found.',
        type: 'error'
      })
    }
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load employee details.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // Load departments, designations & roles
    await Promise.all([
      masterDepartmentStore.fetchDepartments(1, 100),
      masterDesignationStore.fetchDesignations(1, 100),
      authStore.fetchRoles().then(roles => {
        rolesList.value = roles
      })
    ])
    await populateEmployee()
    await checkLoginStatus()
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
    const response = await employeeStore.updateEmployee(id.value, form)
    if (response.success) {
      snackbarStore.show({
        message: 'Employee updated successfully!',
        type: 'success'
      })
      handleBack()
    } else {
      error.value = response.message || 'Failed to update employee'
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
          Edit Employee Details
        </h1>
        <p class="text-slate-500 text-sm mt-0.5">
          Modify employee profile information and organizational settings.
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
        <span class="text-sm font-medium">Loading profile details...</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="p-8 space-y-6">
        <!-- Error Message Banner -->
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
          <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
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
            <BaseSelect
              v-model="form.departmentId"
              id="departmentId"
              label="Department"
              required
              :disabled="loading"
            >
              <option value="" disabled>Select Department...</option>
              <option v-for="d in masterDepartmentStore.departments" :key="d._id" :value="d._id">{{ d.name }}</option>
            </BaseSelect>

            <BaseSelect
              v-model="form.designationId"
              id="designationId"
              label="Designation"
              required
              :disabled="loading"
            >
              <option value="" disabled>Select Designation...</option>
              <option v-for="ds in masterDesignationStore.designations" :key="ds._id" :value="ds._id">{{ ds.designationName }}</option>
            </BaseSelect>

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

            <!-- Active & Login Row -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-6 pl-2 pt-6 md:pt-4">
              <!-- Active Checkbox -->
              <div class="flex items-center gap-3">
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

              <!-- Login Setup -->
              <div class="flex items-center gap-3">
                <!-- If login is not enabled -->
                <button 
                  v-if="!loginEnabled && (authStore.user?.roleName === 'SuperAdmin' || authStore.user?.roleName === 'HospitalAdmin' || authStore.user?.role?.name === 'SuperAdmin' || authStore.user?.role?.name === 'HospitalAdmin')"
                  type="button"
                  @click="openLoginModal"
                  :disabled="loading"
                  class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-indigo-100 shadow-sm disabled:opacity-50"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Enable Login</span>
                </button>
                <!-- If login is enabled -->
                <div v-else-if="loginEnabled" class="flex items-center gap-2.5">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Login Enabled ({{ userRoleName }})
                  </span>
                  <button 
                    v-if="authStore.user?.roleName === 'SuperAdmin' || authStore.user?.roleName === 'HospitalAdmin' || authStore.user?.role?.name === 'SuperAdmin' || authStore.user?.role?.name === 'HospitalAdmin'"
                    type="button"
                    @click="openLoginModal"
                    :disabled="loading"
                    class="text-indigo-600 hover:text-indigo-800 text-xs font-bold hover:underline focus:outline-none"
                  >
                    Manage
                  </button>
                </div>
              </div>
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
            <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Enable Login Teleport Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isLoginModalOpen" class="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          <!-- Backdrop -->
          <div @click="handleCloseLoginModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"></div>

          <!-- Dialog Box -->
          <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 class="text-lg font-bold text-slate-900">
                  {{ loginEnabled ? 'Manage Login Account' : 'Enable Login Account' }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Setup system access for <span class="font-semibold text-slate-700">{{ form.fullName }}</span>.
                </p>
              </div>
              <button 
                @click="handleCloseLoginModal" 
                class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
                :disabled="loadingLoginModal"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body / Form -->
            <form @submit.prevent="handleSaveLogin" class="p-6 space-y-5">
              <!-- Error message if any -->
              <div v-if="loginModalError" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
                <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ loginModalError }}</span>
              </div>

              <!-- Email (Read-only reference) -->
              <BaseInput 
                :model-value="form.email"
                id="loginEmail"
                label="Login Username / Email"
                placeholder="Employee email"
                :disabled="true"
              />

              <!-- Password -->
              <BaseInput 
                v-model="loginForm.password"
                id="loginPassword"
                label="Account Password"
                type="password"
                :placeholder="loginEnabled ? 'Enter new password to change' : 'Enter login password'"
                :required="!loginEnabled"
                :disabled="loadingLoginModal"
              />

              <!-- Role Selection -->
              <BaseSelect
                v-model="loginForm.roleId"
                id="loginRole"
                label="System Permission Role"
                required
                :disabled="loadingLoginModal"
              >
                <option value="" disabled>Select Role...</option>
                <option v-for="r in rolesList" :key="r._id" :value="r._id">{{ r.name }}</option>
              </BaseSelect>

              <!-- Actions Footer -->
              <div class="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  @click="handleCloseLoginModal" 
                  class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus:outline-none"
                  :disabled="loadingLoginModal"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-75"
                  :disabled="loadingLoginModal"
                >
                  <svg v-if="loadingLoginModal" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ loginEnabled ? 'Update Credentials' : 'Enable Access' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
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

/* Springy Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .bg-slate-950\/60,
.modal-fade-leave-active .bg-slate-950\/60 {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15), opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .bg-slate-950\/60,
.modal-fade-leave-to .bg-slate-950\/60 {
  opacity: 0;
}

.modal-fade-enter-from .bg-white {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-fade-leave-to .bg-white {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
