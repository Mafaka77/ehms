<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEmployeeStore } from '../../../stores/employeeStore'
import { useSalaryBonusStore } from '../../../stores/salaryBonusStore'
import BaseInput from '../../../components/BaseInput.vue'
import BaseSelect from '../../../components/BaseSelect.vue'
import { useAuthStore } from '../../../stores/authStore'

const route = useRoute()
const router = useRouter()
const snackbarStore = useSnackbarStore()
const employeeStore = useEmployeeStore()
const salaryBonusStore = useSalaryBonusStore()
const authStore = useAuthStore()

const employeeId = computed(() => route.params.id)
const employee = ref(null)
const loadingEmployee = ref(false)

// Month and Year selections for modal
const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i) // e.g. [2024, 2025, 2026, 2027, 2028]

// Modal states
const isModalOpen = ref(false)
const modalError = ref('')
const loadingModal = ref(false)
const editingBonusId = ref(null)

const form = reactive({
  isRecurring: false,
  month: new Date().getMonth() + 1,
  year: currentYear,
  bonus: '',
  bonusType: 'Performance',
  remarks: ''
})

const handleBack = () => {
  router.push('/salary-bonus')
}

const fetchEmployeeData = async () => {
  if (!employeeId.value) return
  loadingEmployee.value = true
  try {
    let emp = employeeStore.employees.find(e => e._id === employeeId.value)
    if (!emp) {
      await employeeStore.fetchEmployees(1, 100)
      emp = employeeStore.employees.find(e => e._id === employeeId.value)
    }
    if (emp) {
      employee.value = emp
    } else {
      snackbarStore.show({
        message: 'Employee details not found.',
        type: 'error'
      })
      handleBack()
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({
      message: 'Failed to load employee info.',
      type: 'error'
    })
  } finally {
    loadingEmployee.value = false
  }
}

const fetchBonuses = async () => {
  if (!employeeId.value) return
  await salaryBonusStore.fetchBonuses('', '', employeeId.value)
}

// Modal Handlers
const openCreateModal = () => {
  editingBonusId.value = null
  form.isRecurring = false
  form.month = new Date().getMonth() + 1
  form.year = currentYear
  form.bonus = ''
  form.bonusType = 'Performance'
  form.remarks = ''
  modalError.value = ''
  isModalOpen.value = true
}

const openEditModal = (bonus) => {
  editingBonusId.value = bonus._id
  form.isRecurring = bonus.recurring || false
  
  if (bonus.month) {
    const bonusDate = new Date(bonus.month)
    form.month = bonusDate.getUTCMonth() + 1
  } else {
    form.month = new Date().getMonth() + 1
  }
  form.year = bonus.year || currentYear
  form.bonus = bonus.bonus || ''
  form.bonusType = bonus.bonusType || 'Performance'
  form.remarks = bonus.remarks || ''
  modalError.value = ''
  isModalOpen.value = true
}

const handleCloseModal = () => {
  if (loadingModal.value) return
  isModalOpen.value = false
  editingBonusId.value = null
}

const handleSaveBonus = async () => {
  if (form.bonus === '' || parseFloat(form.bonus) <= 0) {
    modalError.value = 'Please enter a valid bonus amount'
    return
  }

  loadingModal.value = true
  modalError.value = ''

  try {
    const m = String(form.month).padStart(2, '0')
    const monthDateString = `${form.year}-${m}-01`

    const payload = {
      employeeId: employeeId.value,
      month: monthDateString,
      year: parseInt(form.year),
      bonus: parseFloat(form.bonus),
      bonusType: form.bonusType,
      remarks: form.remarks,
      recurring: form.isRecurring
    }

    const response = await salaryBonusStore.upsertBonus(payload)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'Salary bonus saved successfully',
        type: 'success'
      })
      await fetchBonuses()
      handleCloseModal()
    } else {
      modalError.value = response.message || 'Failed to save salary bonus'
    }
  } catch (err) {
    console.error(err)
    modalError.value = err.message || 'An error occurred'
  } finally {
    loadingModal.value = false
  }
}

const handleDeleteBonus = async (id) => {
  if (!confirm('Are you sure you want to remove this salary bonus?')) return
  try {
    const response = await salaryBonusStore.deleteBonus(id)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'Salary bonus removed successfully',
        type: 'success'
      })
      await fetchBonuses()
    } else {
      snackbarStore.show({
        message: response.message || 'Failed to delete salary bonus',
        type: 'error'
      })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({
      message: err.message || 'An error occurred',
      type: 'error'
    })
  }
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '₹0'
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)
}

const getBonusPeriodLabel = (bonus) => {
  if (bonus.recurring) return 'Every Month (Recurring)'
  if (!bonus.month) return '-'
  const date = new Date(bonus.month)
  const monthName = months.find(m => m.value === date.getUTCMonth() + 1)?.label || ''
  return `${monthName} ${bonus.year || date.getFullYear()}`
}

onMounted(async () => {
  await fetchEmployeeData()
  await fetchBonuses()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
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
          Salary Bonus Ledger
        </h1>
        <p class="text-slate-500 text-sm mt-0.5">
          View all bonuses and setup recurring or one-time compensation for this staff member.
        </p>
      </div>
    </div>

    <!-- Loading State for Page -->
    <div v-if="loadingEmployee" class="flex flex-col items-center justify-center py-32 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading employee details...</span>
    </div>

    <template v-else-if="employee">
      <!-- Employee Profile Card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {{ employee.fullName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <span class="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 font-semibold text-[10px] uppercase tracking-wider inline-block mb-1">
                {{ employee.employeeCode }}
              </span>
              <h2 class="text-xl font-bold text-slate-900">{{ employee.fullName }}</h2>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8">
            <div class="text-left md:text-right">
              <span class="text-slate-400 text-xs font-medium block">Basic Salary</span>
              <span class="text-slate-800 font-bold text-lg font-mono">{{ formatCurrency(employee.basicSalary) }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-xs font-medium block">Employment Type</span>
              <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold text-xs border border-slate-200/50 inline-block mt-0.5">
                {{ employee.employmentType }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6">
          <div>
            <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Department</span>
            <span class="text-slate-700 text-sm font-semibold block mt-1">{{ employee.departmentId?.name || 'Unassigned' }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Designation</span>
            <span class="text-slate-700 text-sm font-semibold block mt-1">{{ employee.designationId?.designationName || 'Unassigned' }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email Address</span>
            <span class="text-slate-700 text-sm font-medium block mt-1 break-all">{{ employee.email }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mobile Number</span>
            <span class="text-slate-700 text-sm font-medium block mt-1">{{ employee.mobile || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Bonus Management Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Assigned Bonuses</h3>
            <p class="text-slate-500 text-xs mt-0.5">All recurring and one-time payroll bonuses for this employee.</p>
          </div>
          <button 
            v-if="authStore.hasPermission('salary_bonus.create')"
            @click="openCreateModal"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-1.5 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Bonus</span>
          </button>
        </div>

        <!-- Table / Empty State -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div v-if="salaryBonusStore.loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold">Updating bonuses...</span>
          </div>

          <div v-else-if="salaryBonusStore.bonuses.length === 0" class="p-6 text-center text-slate-500 py-20">
            <svg class="w-14 h-14 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 8h6m-6 4h6m-6 4h6M4 4h16v16H4V4z" />
            </svg>
            <p class="text-slate-700 font-semibold text-base">No bonuses assigned yet</p>
            <p class="text-slate-400 text-xs mt-1">Click the "Add Bonus" button to create one.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[20%]">Type</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[22%]">Period</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[18%]">Category</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[15%]">Amount</th>
                  <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[15%]">Remarks</th>
                  <th v-if="authStore.hasPermission('salary_bonus.create') || authStore.hasPermission('salary_bonus.delete')" class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr 
                  v-for="bonus in salaryBonusStore.bonuses" 
                  :key="bonus._id"
                  class="hover:bg-slate-50/50 transition-colors group"
                >
                  <!-- Type -->
                  <td class="px-6 py-4">
                    <span 
                      class="px-2.5 py-1 rounded-full text-xs font-semibold"
                      :class="bonus.recurring ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                    >
                      {{ bonus.recurring ? 'Recurring' : 'One-time' }}
                    </span>
                  </td>

                  <!-- Period -->
                  <td class="px-6 py-4 text-sm text-slate-700 font-medium">
                    {{ getBonusPeriodLabel(bonus) }}
                  </td>

                  <!-- Category -->
                  <td class="px-6 py-4 text-xs font-semibold text-slate-600">
                    <span class="px-2 py-0.5 bg-emerald-50 rounded text-emerald-700 border border-emerald-100">
                      {{ bonus.bonusType }}
                    </span>
                  </td>

                  <!-- Amount -->
                  <td class="px-6 py-4 text-sm font-semibold font-mono text-emerald-600">
                    {{ formatCurrency(bonus.bonus) }}
                  </td>

                  <!-- Remarks -->
                  <td class="px-6 py-4 text-xs text-slate-500 truncate max-w-[150px]" :title="bonus.remarks">
                    {{ bonus.remarks || '-' }}
                  </td>

                  <!-- Actions -->
                  <td v-if="authStore.hasPermission('salary_bonus.create') || authStore.hasPermission('salary_bonus.delete')" class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button 
                        v-if="authStore.hasPermission('salary_bonus.create')"
                        @click="openEditModal(bonus)"
                        class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none"
                        title="Edit Bonus"
                      >
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        v-if="authStore.hasPermission('salary_bonus.delete')"
                        @click="handleDeleteBonus(bonus._id)"
                        class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none"
                        title="Remove Bonus"
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
        </div>
      </div>
    </template>

    <!-- Manage Bonus Teleport Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isModalOpen" class="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          <!-- Backdrop -->
          <div @click="handleCloseModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"></div>

          <!-- Dialog Box -->
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 class="text-lg font-bold text-slate-900">
                  {{ editingBonusId ? 'Edit Salary Bonus' : 'Add Salary Bonus' }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Configure compensation details for <span class="font-semibold text-slate-700">{{ employee?.fullName }}</span>.
                </p>
              </div>
              <button 
                @click="handleCloseModal" 
                class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
                :disabled="loadingModal"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body / Form -->
            <form @submit.prevent="handleSaveBonus" class="p-6 space-y-5">
              <!-- Error message if any -->
              <div v-if="modalError" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
                <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ modalError }}</span>
              </div>

              <!-- Bonus Type Radio Option (Recurring vs One-time) -->
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-700 tracking-wide uppercase">Bonus Schedule</label>
                <div class="grid grid-cols-2 gap-4">
                  <label 
                    class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                    :class="form.isRecurring ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-100' : ''"
                  >
                    <input 
                      type="radio" 
                      name="isRecurring" 
                      :value="true" 
                      v-model="form.isRecurring" 
                      :disabled="loadingModal"
                      class="text-indigo-600 focus:ring-0 focus:ring-offset-0 border-slate-300 w-4 h-4"
                    />
                    <div>
                      <span class="text-sm font-bold text-slate-800 block">Recurring</span>
                      <span class="text-[11px] text-slate-500">Paid every month</span>
                    </div>
                  </label>

                  <label 
                    class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                    :class="!form.isRecurring ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-100' : ''"
                  >
                    <input 
                      type="radio" 
                      name="isRecurring" 
                      :value="false" 
                      v-model="form.isRecurring" 
                      :disabled="loadingModal"
                      class="text-indigo-600 focus:ring-0 focus:ring-offset-0 border-slate-300 w-4 h-4"
                    />
                    <div>
                      <span class="text-sm font-bold text-slate-800 block">One-time</span>
                      <span class="text-[11px] text-slate-500">Paid once in a month</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- One-Time Month/Year selections -->
              <div v-if="!form.isRecurring" class="grid grid-cols-2 gap-4 animate-fade-in">
                <BaseSelect
                  v-model="form.month"
                  id="modalMonth"
                  label="Target Month"
                  required
                  :disabled="loadingModal"
                >
                  <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                </BaseSelect>

                <BaseSelect
                  v-model="form.year"
                  id="modalYear"
                  label="Target Year"
                  required
                  :disabled="loadingModal"
                >
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </BaseSelect>
              </div>

              <!-- Bonus Amount -->
              <BaseInput 
                v-model.number="form.bonus"
                id="bonusAmount"
                label="Bonus Amount (₹)"
                type="number"
                placeholder="e.g. 5000"
                required
                :disabled="loadingModal"
              />

              <!-- Bonus Type/Category -->
              <BaseSelect
                v-model="form.bonusType"
                id="bonusCategory"
                label="Bonus Category"
                required
                :disabled="loadingModal"
              >
                <option value="Performance">Performance Bonus</option>
                <option value="Festival">Festival Bonus</option>
                <option value="Referral">Referral Incentive</option>
                <option value="Overtime">Overtime Reward</option>
                <option value="Other">Other Special Payment</option>
              </BaseSelect>

              <!-- Remarks -->
              <div class="space-y-1.5 w-full">
                <label for="modalRemarks" class="text-xs font-semibold text-slate-700 tracking-wide uppercase">Remarks</label>
                <textarea 
                  id="modalRemarks" 
                  v-model="form.remarks"
                  rows="3"
                  placeholder="Enter reference notes, comments..." 
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  :disabled="loadingModal"
                ></textarea>
              </div>

              <!-- Actions Footer -->
              <div class="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  @click="handleCloseModal" 
                  class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus:outline-none"
                  :disabled="loadingModal"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-75"
                  :disabled="loadingModal"
                >
                  <svg v-if="loadingModal" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ editingBonusId ? 'Save Changes' : 'Create Bonus' }}</span>
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

/* Shake Animation for Form Errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

/* Fade-in for sub-inputs */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
