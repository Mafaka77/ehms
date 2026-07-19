<template>
  <div class="h-full flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">ER Visit Details</span>
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
          <span class="font-mono">{{ visit.visitNo }}</span>
          <span 
            v-if="visit.visitStatus === 'DISCHARGED'" 
            class="px-2 py-0.5 text-[10px] font-bold rounded uppercase border bg-slate-100 text-slate-700 border-slate-200"
          >
            DISCHARGED
          </span>
          <span 
            v-else-if="visit.visitStatus === 'ADMITTED'" 
            class="px-2 py-0.5 text-[10px] font-bold rounded uppercase border bg-blue-100 text-blue-700 border-blue-200"
          >
            ADMITTED
          </span>
        </h2>
      </div>
      <div class="text-right flex flex-col items-end gap-2">
        <button
          v-if="visit.visitStatus !== 'DISCHARGED' && canDischarge"
          @click="handleDischarge"
          :disabled="discharging"
          type="button"
          class="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-xl font-semibold text-xs shadow-lg shadow-rose-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span v-if="discharging" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
          Discharge Patient
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="isInitializing" class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Skeleton Loading / Shimmer -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div class="bg-slate-100 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
          <div class="h-4 bg-slate-300 rounded w-1/3"></div>
          <div class="h-6 w-16 bg-slate-300 rounded-md"></div>
        </div>
        <div class="p-5 space-y-4">
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div class="h-16 bg-slate-100 rounded-lg w-full border border-slate-200"></div>
          <div class="flex justify-end gap-3 pt-2">
             <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
      
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div class="bg-slate-100 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
          <div class="h-4 bg-slate-300 rounded w-1/3"></div>
          <div class="h-6 w-16 bg-slate-300 rounded-md"></div>
        </div>
        <div class="p-5 space-y-4">
          <div class="h-4 bg-slate-200 rounded w-full mb-4"></div>
          <div class="h-4 bg-slate-200 rounded w-5/6 mb-4"></div>
          <div class="h-16 bg-slate-100 rounded-lg w-full border border-slate-200"></div>
          <div class="flex justify-end gap-3 pt-2">
             <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- SECTION 1: REGISTRATION / CONSULTATION -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="bg-indigo-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
          <h3 class="font-bold text-indigo-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Stage 1: Registration / Consultation
          </h3>
          <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(consultationStatus)]">
            {{ consultationStatus }}
          </span>
        </div>

        <div class="p-5 space-y-4">
          <table class="w-full text-left text-sm">
            <thead class="text-xs text-slate-400 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th class="px-2 py-2">Item Details</th>
                <th class="px-2 py-2 text-right">Rate</th>
                <th class="px-2 py-2 text-center">Qty</th>
                <th class="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50/50">
                <td class="px-2 py-3 font-medium text-slate-800">Emergency Consultation Fee - Dr. {{ visit.doctorId?.fullName || 'On Duty' }}</td>
                <td class="px-2 py-3 text-right font-mono">{{ formatCurrency(visit.consultationFee) }}</td>
                <td class="px-2 py-3 text-center font-mono">1</td>
                <td class="px-2 py-3 text-right font-mono font-semibold">{{ formatCurrency(visit.consultationFee) }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="consultationBill" class="bg-slate-50 rounded-lg p-4 flex justify-between items-center text-sm border border-slate-100">
            <div>
              <p class="text-slate-500 mb-1">Bill No: <span class="font-mono font-bold text-slate-800">{{ consultationBill.billNo }}</span></p>
              <p class="text-slate-500 text-xs">Generated: {{ formatDate(consultationBill.generatedAt) }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-slate-800">Net Amount: <span class="text-lg font-mono text-rose-600">{{ formatCurrency(consultationBill.netAmount) }}</span></p>
              <p class="text-xs text-slate-500 font-medium mt-0.5">Balance: {{ formatCurrency(consultationBill.balanceAmount) }}</p>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button 
              v-if="!consultationBill"
              @click="generateConsultationBill"
              :disabled="loadingConsultation"
              class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span v-if="loadingConsultation" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              Generate Bill
            </button>
            <template v-else>
              <button 
                v-if="consultationBill.status !== 'PAID'"
                @click="emit('pay-clicked', consultationBill)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow transition-all"
              >
                Process Payment
              </button>
              <button 
                v-if="consultationBill.status === 'PAID'"
                @click="printBill(consultationBill)"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                Print Bill
              </button>
              <button 
                v-if="consultationBill.status !== 'PAID'"
                @click="cancelBill(consultationBill)"
                :disabled="loadingCancel === consultationBill._id"
                class="bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 px-3 rounded-lg font-semibold text-xs transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- SECTION 2: DISCHARGE / PATIENT CHARGES -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="bg-amber-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
          <h3 class="font-bold text-amber-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Stage 2: Procedures & Investigations (Discharge Summary)
          </h3>
          <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(dischargeStatus)]">
            {{ dischargeStatus }}
          </span>
        </div>

        <div class="p-5 space-y-4">
          <div class="max-h-80 overflow-y-auto pr-1">
            <table class="w-full text-left text-sm relative">
              <thead class="text-xs text-slate-400 uppercase font-semibold border-b border-slate-100 sticky top-0 bg-white z-10 shadow-sm">
                <tr>
                  <th class="px-2 py-2">Item Details</th>
                  <th class="px-2 py-2 text-right">Rate</th>
                  <th class="px-2 py-2 text-center">Qty</th>
                  <th class="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
              <tr v-if="patientCharges.length === 0" class="hover:bg-slate-50/50">
                <td colspan="4" class="px-2 py-4 text-center text-slate-500 text-sm">No additional charges added for this visit.</td>
              </tr>
              <tr v-for="charge in patientCharges" :key="charge._id" class="hover:bg-slate-50/50">
                <td class="px-2 py-3 text-slate-700">
                  <p class="font-medium text-slate-800">{{ charge.description }}</p>
                  <p class="text-[9px] text-slate-400 mt-0.5">{{ charge.chargeCategoryId?.name || 'Charge' }} • {{ formatDate(charge.createdAt) }}</p>
                  <!-- Doctor badge -->
                  <div v-if="charge.doctorId" class="text-[10px] text-indigo-500 font-bold mt-1 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                    Dr. {{ charge.doctorId.fullName || charge.doctorId.name || 'N/A' }}
                  </div>
                  <!-- Addon badges -->
                  <div v-if="charge.addons && charge.addons.length > 0" class="mt-1.5 flex flex-wrap gap-1">
                    <span 
                      v-for="addon in charge.addons" 
                      :key="addon._id" 
                      class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 inline-flex items-center gap-1.5"
                    >
                      <span>{{ addon.itemName }}</span>
                      <span v-if="addon.doctorId" class="px-1 py-0.2 text-[8px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                        Dr. {{ addon.doctorId.fullName || addon.doctorId.name || addon.doctorId }}
                      </span>
                      <span class="text-slate-500 font-extrabold">(₹{{ addon.amount?.toLocaleString() }})</span>
                    </span>
                  </div>
                </td>
                <td class="px-2 py-3 text-right font-mono">{{ formatCurrency(charge.rate) }}</td>
                <td class="px-2 py-3 text-center font-mono">{{ charge.quantity }}</td>
                <td class="px-2 py-3 text-right font-mono font-semibold">
                  {{ formatCurrency((charge.amount || 0) + (charge.addons || []).reduce((s, a) => s + (a.amount || 0), 0)) }}
                </td>
              </tr>
              <tr class="bg-slate-50/50 font-bold border-t border-slate-100" v-if="patientCharges.length > 0">
                <td colspan="3" class="px-2 py-3 text-slate-800 text-right">Subtotal:</td>
                <td class="px-2 py-3 text-right font-mono text-rose-600">{{ formatCurrency(totalChargesAmount) }}</td>
              </tr>
            </tbody>
          </table>
          </div>

          <div v-if="dischargeBill" class="bg-slate-50 rounded-lg p-4 flex justify-between items-center text-sm border border-slate-100">
            <div>
              <p class="text-slate-500 mb-1">Bill No: <span class="font-mono font-bold text-slate-800">{{ dischargeBill.billNo }}</span></p>
              <p class="text-slate-500 text-xs">Generated: {{ formatDate(dischargeBill.generatedAt) }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-slate-800">Net Amount: <span class="text-lg font-mono text-rose-600">{{ formatCurrency(dischargeBill.netAmount) }}</span></p>
              <p class="text-xs text-slate-500 font-medium mt-0.5">Balance: {{ formatCurrency(dischargeBill.balanceAmount) }}</p>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button 
              v-if="!dischargeBill && patientCharges.length > 0"
              @click="generateDischargeBill"
              :disabled="loadingDischarge"
              class="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span v-if="loadingDischarge" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              Generate Discharge Bill
            </button>
            <template v-else-if="dischargeBill">
              <button 
                v-if="dischargeBill.status !== 'PAID'"
                @click="emit('pay-clicked', dischargeBill)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow transition-all"
              >
                Process Payment
              </button>
              <button 
                v-if="dischargeBill.status === 'PAID'"
                @click="printBill(dischargeBill)"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                Print Bill
              </button>
              <button 
                v-if="dischargeBill.status !== 'PAID'"
                @click="cancelBill(dischargeBill)"
                :disabled="loadingCancel === dischargeBill._id"
                class="bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 px-3 rounded-lg font-semibold text-xs transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </template>
          </div>
        </div>
      </div>

    </div>

    <!-- Printable Invoice Modal -->
    <EmergencyInvoiceModal 
      v-if="activePrintBill"
      :show="showInvoiceModal" 
      :visit="visit" 
      :billDetails="activePrintBill" 
      :patientCharges="patientCharges"
      @close="closeInvoiceModal" 
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEmergencyStore } from '../../../stores/emergencyStore'
import EmergencyInvoiceModal from './Invoice.vue'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['bill-generated', 'pay-clicked'])
const snackbarStore = useSnackbarStore()
const emergencyStore = useEmergencyStore()

const showInvoiceModal = ref(false)
const activePrintBill = ref(null)

const consultationBill = ref(null)
const dischargeBill = ref(null)

const patientCharges = ref([])
const isInitializing = ref(false)

const fetchBillDetails = async (billId, isConsultation = true) => {
  try {
    const data = await emergencyStore.fetchBillDetails(billId)
    if (isConsultation) {
      consultationBill.value = data
    } else {
      dischargeBill.value = data
    }
  } catch (error) {
    console.error('Error fetching bill details:', error)
  }
}

// Watch for visit changes to load bills and charges
watch(() => props.visit, async (newVisit) => {
  if (newVisit) {
    isInitializing.value = true
    consultationBill.value = null
    dischargeBill.value = null
    patientCharges.value = []

    if (newVisit.consultationBillId) {
      await fetchBillDetails(newVisit.consultationBillId, true)
    }
    
    if (newVisit.dischargeBillId) {
      await fetchBillDetails(newVisit.dischargeBillId, false)
    }
    
    // Fetch patient charges
    try {
      const res = await emergencyStore.getVisitCharges(newVisit._id)
      patientCharges.value = res.data || []
    } catch (e) {
      patientCharges.value = []
    } finally {
      isInitializing.value = false
    }
  } else {
    consultationBill.value = null
    dischargeBill.value = null
    patientCharges.value = []
  }
}, { immediate: true })

const totalChargesAmount = computed(() => {
  return patientCharges.value.reduce((sum, c) => {
    const addonsTotal = (c.addons || []).reduce((s, a) => s + (a.amount || 0), 0)
    return sum + (c.amount || 0) + addonsTotal
  }, 0)
})

const consultationStatus = computed(() => {
  if (!consultationBill.value) return 'Unbilled'
  if (consultationBill.value.status === 'PAID') return 'Paid'
  if (consultationBill.value.status === 'PARTIALLY_PAID') return 'Partial'
  return 'Billed'
})

const dischargeStatus = computed(() => {
  if (patientCharges.value.length === 0) return 'No Charges'
  if (!dischargeBill.value) return 'Unbilled'
  if (dischargeBill.value.status === 'PAID') return 'Paid'
  if (dischargeBill.value.status === 'PARTIALLY_PAID') return 'Partial'
  return 'Billed'
})

const canDischarge = computed(() => {
  // Can discharge if consultation is paid (or 0) AND discharge bill is either fully paid or not needed (no charges)
  const isConsultationPaid = consultationBill.value?.status === 'PAID' || props.visit.consultationFee === 0
  const isDischargePaid = patientCharges.value.length === 0 || dischargeBill.value?.status === 'PAID'
  return isConsultationPaid && isDischargePaid
})

const loadingConsultation = ref(false)
const generateConsultationBill = async () => {
  loadingConsultation.value = true
  try {
    const payload = {
      emergencyVisitId: props.visit._id,
      discountAmount: 0,
      discountType: 'CUSTOM'
    }
    const data = await emergencyStore.generateBill(payload)
    snackbarStore.show({ message: 'Consultation bill generated', type: 'success' })
    await fetchBillDetails(data._id, true)
    emit('bill-generated', data)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to generate consultation bill', type: 'error' })
  } finally {
    loadingConsultation.value = false
  }
}

const loadingDischarge = ref(false)
const generateDischargeBill = async () => {
  loadingDischarge.value = true
  try {
    const payload = {
      emergencyVisitId: props.visit._id,
      discountAmount: 0,
      discountType: 'CUSTOM'
    }
    const data = await emergencyStore.generateDischargeBill(payload)
    snackbarStore.show({ message: 'Discharge bill generated', type: 'success' })
    await fetchBillDetails(data._id, false)
    emit('bill-generated', data)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to generate discharge bill', type: 'error' })
  } finally {
    loadingDischarge.value = false
  }
}

const printBill = (bill) => {
  activePrintBill.value = bill
  showInvoiceModal.value = true
}

const closeInvoiceModal = () => {
  showInvoiceModal.value = false
  activePrintBill.value = null
}

const loadingCancel = ref(null)
const cancelBill = async (bill) => {
  if (!confirm('Are you sure you want to cancel this bill?')) return
  
  loadingCancel.value = bill._id
  try {
    await emergencyStore.cancelBill(bill._id)
    snackbarStore.show({ message: 'Bill cancelled successfully', type: 'success' })
    
    if (bill.billType === 'EMERGENCY_CONSULTATION') {
      consultationBill.value = null
    } else {
      dischargeBill.value = null
    }
    
    emit('bill-generated', null)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to cancel bill', type: 'error' })
  } finally {
    loadingCancel.value = null
  }
}

const discharging = ref(false)
const handleDischarge = async () => {
  if (!confirm(`Are you sure you want to discharge patient ${props.visit.patientId?.fullName}?`)) return
  
  discharging.value = true
  try {
    await emergencyStore.dischargeVisit(props.visit._id)
    snackbarStore.show({ message: 'Patient discharged successfully', type: 'success' })
    emit('bill-generated', null) // Trigger refresh
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to discharge patient', type: 'error' })
  } finally {
    discharging.value = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getPaymentStatusColor = (status) => {
  const map = {
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Unpaid': 'bg-rose-100 text-rose-700 border-rose-200',
    'Partially Paid': 'bg-amber-100 text-amber-700 border-amber-200',
    'Partial': 'bg-amber-100 text-amber-700 border-amber-200',
    'Billed': 'bg-blue-100 text-blue-700 border-blue-200',
    'Unbilled': 'bg-slate-100 text-slate-500 border-slate-200',
    'No Charges': 'bg-slate-100 text-slate-400 border-slate-200'
  }
  return map[status] || map['Unpaid']
}
</script>
