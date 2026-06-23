<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorStore } from '../../stores/doctorStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import BaseInput from '../../components/BaseInput.vue'

const route = useRoute()
const router = useRouter()
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()

const loading = ref(true)
const doctorId = route.params.id

// Modal State
const showAddModal = ref(false)
const savingRule = ref(false)
const newRule = ref({
  serviceType: 'OPD',
  amount: 0,
  effectiveFrom: '',
  effectiveTo: ''
})

const handleBack = () => {
  router.push('/doctors')
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      doctorStore.fetchDoctorById(doctorId),
      doctorStore.fetchRemunerationRules(doctorId)
    ])
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load doctor data', type: 'error' })
  } finally {
    loading.value = false
  }
}

const doctor = computed(() => doctorStore.currentDoctor || {})
const rules = computed(() => doctorStore.remunerationRules || [])

const handleAddRule = async () => {
  savingRule.value = true
  try {
    const payload = { ...newRule.value }
    if (!payload.effectiveFrom) delete payload.effectiveFrom
    if (!payload.effectiveTo) delete payload.effectiveTo

    const res = await doctorStore.addRemunerationRule(doctorId, payload)
    if (res.success) {
      snackbarStore.show({ message: 'Remuneration rule added', type: 'success' })
      showAddModal.value = false
      newRule.value = { serviceType: 'OPD', amount: 0, effectiveFrom: '', effectiveTo: '' }
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
  } finally {
    savingRule.value = false
  }
}

const handleDeleteRule = async (ruleId) => {
  if (!confirm('Are you sure you want to delete this rule?')) return
  const res = await doctorStore.deleteRemunerationRule(ruleId)
  if (res.success) {
    snackbarStore.show({ message: 'Rule deleted successfully', type: 'success' })
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
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

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 pb-10">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <button 
        @click="handleBack"
        class="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-sm focus:outline-none"
        title="Go Back"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Doctor Profile</h1>
        <p class="text-slate-500 text-sm mt-0.5">View details and manage remuneration rules.</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-100">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading profile...</span>
    </div>

    <template v-else>
      <!-- Doctor Details Card (Compact) -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-start">
        <div class="w-20 h-20 rounded-2xl bg-indigo-50 flex flex-shrink-0 items-center justify-center text-indigo-600 font-bold text-3xl">
          {{ doctor.fullName?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          <div>
            <h2 class="text-lg font-bold text-slate-900">{{ doctor.fullName }}</h2>
            <p class="text-sm text-slate-500 mt-1">{{ doctor.specializationId?.name || 'General' }}</p>
            <div class="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
              {{ doctor.doctorType }}
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Contact</p>
            <p class="text-sm text-slate-700 font-medium">{{ doctor.email }}</p>
            <p class="text-sm text-slate-600 mt-0.5">{{ doctor.mobileNo }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Medical Info</p>
            <p class="text-sm text-slate-700 font-medium">{{ doctor.qualification }}</p>
            <p class="text-sm text-slate-600 mt-0.5">Reg: {{ doctor.registrationNo || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Status</p>
            <p class="text-sm font-semibold" :class="doctor.isActive ? 'text-emerald-600' : 'text-rose-600'">
              {{ doctor.isActive ? 'Active' : 'Inactive' }}
            </p>
            <p class="text-sm text-slate-600 mt-0.5">Fee: {{ formatCurrency(doctor.consultationFee) }}</p>
          </div>
        </div>
      </div>

      <!-- Remuneration Rules Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">Remuneration Rules</h2>
            <p class="text-sm text-slate-500 mt-0.5">Manage payout rules for specific services.</p>
          </div>
          <button 
            @click="showAddModal = true"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Rule
          </button>
        </div>

        <div v-if="rules.length === 0" class="p-10 text-center text-slate-500">
          <svg class="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-slate-700 font-medium">No remuneration rules configured.</p>
          <p class="text-slate-400 text-sm mt-1">Add a rule to automatically calculate doctor payouts.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Service Type</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Amount (₹)</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Valid From</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider">Valid To</th>
                <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4 tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="rule in rules" :key="rule._id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {{ rule.serviceType }}
                  </span>
                </td>
                <td class="px-6 py-4 font-mono font-semibold text-slate-700">
                  {{ formatCurrency(rule.amount) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ formatDate(rule.effectiveFrom) }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ formatDate(rule.effectiveTo) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <button 
                    @click="handleDeleteRule(rule._id)"
                    class="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none"
                    title="Delete Rule"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Add Rule Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">Add Remuneration Rule</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-6">
          <form @submit.prevent="handleAddRule" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Service Type</label>
              <div class="relative">
                <select v-model="newRule.serviceType" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-700 shadow-sm" required>
                  <option value="OPD">OPD Consultation</option>
                  <option value="SURGERY">Surgery</option>
                  <option value="PROCEDURE">Medical Procedure</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="IPD_ROUND">IPD Round</option>
                  <option value="DENTAL">Dental</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            
            <BaseInput v-model.number="newRule.amount" id="amount" type="number" label="Amount (₹)" placeholder="e.g. 500" required />
            
            <div class="grid grid-cols-2 gap-4">
              <BaseInput v-model="newRule.effectiveFrom" id="effectiveFrom" type="date" label="Effective From" />
              <BaseInput v-model="newRule.effectiveTo" id="effectiveTo" type="date" label="Effective To" />
            </div>
            
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" @click="showAddModal = false" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" :disabled="savingRule" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                <svg v-if="savingRule" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Save Rule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
