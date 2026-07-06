<script setup>
import { ref, onMounted } from 'vue'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const props = defineProps({
  admissionId: {
    type: String,
    required: true
  },
  admission: {
    type: Object,
    required: true
  }
})

const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

const loading = ref(true)
const advances = ref([])
const bills = ref([])
const unbilledCharges = ref([])
const showBillModal = ref(false)
const generatingBill = ref(false)
const selectedChargeIds = ref([])

const fetchAdvancesAndBills = async () => {
  loading.value = true
  
  // Fetch advances
  const advRes = await admissionStore.fetchAdmissionAdvances(props.admissionId)
  if (advRes.success) {
    advances.value = advRes.data || []
  }

  // Fetch bills
  const billRes = await admissionStore.fetchAdmissionBills(props.admissionId)
  if (billRes.success) {
    bills.value = billRes.data || []
  }

  loading.value = false
}

const fetchUnbilledCharges = async () => {
  const res = await admissionStore.fetchAdmissionCharges(props.admissionId)
  if (res.success) {
    // filter only unbilled charges
    unbilledCharges.value = res.data.filter(c => !c.isBilled)
  }
}

const openBillModal = async () => {
  await fetchUnbilledCharges()
  selectedChargeIds.value = unbilledCharges.value.map(c => c._id) // Select all by default
  showBillModal.value = true
}

const submitGenerateBill = async () => {
  if (selectedChargeIds.value.length === 0) {
    snackbarStore.show({ message: 'Please select at least one charge to bill.', type: 'warning' })
    return
  }
  
  generatingBill.value = true
  const res = await admissionStore.generateIpdBill({
    admissionId: props.admissionId,
    chargeIds: selectedChargeIds.value
  })

  if (res.success) {
    snackbarStore.show({ message: 'Bill generated successfully!', type: 'success' })
    showBillModal.value = false
    fetchAdvancesAndBills() // Refresh lists
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  generatingBill.value = false
}

// Expose refresh function to parent so it can trigger re-fetch after a new advance is added
const refresh = () => {
  fetchAdvancesAndBills()
}
defineExpose({ refresh })

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getChargeTotal = (charge) => {
  const base = charge.amount || 0
  const addonsTotal = (charge.addons || []).reduce((sum, a) => sum + (a.amount || 0), 0)
  return base + addonsTotal
}

onMounted(() => {
  fetchAdvancesAndBills()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h3 class="text-lg font-bold text-slate-800">Transactions & Billing</h3>
        <p class="text-xs text-slate-500 mt-1">Manage advance deposits and generate IPD bills.</p>
      </div>
      
      <div class="flex items-center gap-4">
        <button 
          @click="openBillModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Bill
        </button>
      
      <div class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
        <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-sm">
          <span class="text-emerald-600/80 font-semibold mr-1">Total Deposit:</span>
          <strong class="font-bold font-mono">₹{{ advances.reduce((sum, item) => sum + item.amount, 0).toFixed(2) }}</strong>
        </div>
      </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>

    <div v-else-if="advances.length === 0" class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h4 class="text-sm font-bold text-slate-600">No Deposits Found</h4>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">This patient does not have any advance deposits recorded yet.</p>
    </div>

    <div v-else class="overflow-x-auto border border-slate-200 rounded-xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th class="p-4">Date</th>
            <th class="p-4">Payment Mode</th>
            <th class="p-4">Reference</th>
            <th class="p-4">Amount</th>
            <th class="p-4">Received By</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="advance in advances" :key="advance._id" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-4 font-mono text-slate-600">{{ formatDate(advance.createdAt) }}</td>
            <td class="p-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {{ advance.paymentMode }}
              </span>
            </td>
            <td class="p-4 text-slate-600">{{ advance.referenceNo || '-' }}</td>
            <td class="p-4 font-bold font-mono text-emerald-600">₹{{ advance.amount.toFixed(2) }}</td>
            <td class="p-4 text-slate-600">{{ advance.receivedBy?.fullName || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Generated Bills Section -->
    <div class="mt-8 border-t border-slate-100 pt-6">
      <h3 class="text-base font-bold text-slate-800 mb-4">Generated Bills</h3>
      
      <div v-if="bills.length === 0 && !loading" class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p class="text-sm text-slate-500">No bills have been generated for this admission yet.</p>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <div 
          v-for="bill in bills" 
          :key="bill._id"
          class="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill No</span>
              <h4 class="font-bold font-mono text-indigo-600">{{ bill.billNo }}</h4>
            </div>
            <span 
              class="px-2.5 py-1 rounded-md text-[10px] font-bold border"
              :class="{
                'bg-emerald-50 text-emerald-700 border-emerald-200': bill.status === 'PAID',
                'bg-amber-50 text-amber-700 border-amber-200': bill.status === 'PARTIALLY_PAID',
                'bg-rose-50 text-rose-700 border-rose-200': bill.status === 'DRAFT' || bill.status === 'UNPAID',
              }"
            >
              {{ bill.status }}
            </span>
          </div>
          
          <div class="flex justify-between items-end">
            <div class="text-xs text-slate-500 space-y-1">
              <p>Generated: {{ formatDate(bill.generatedAt) }}</p>
              <p>Total: <strong class="text-slate-800 font-mono">₹{{ bill.netAmount.toFixed(2) }}</strong></p>
            </div>
            <div v-if="bill.status !== 'PAID'" class="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded">
              Pending Payment
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Generate Bill Modal -->
  <div v-if="showBillModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            Generate IPD Bill
          </h3>
          <p class="text-xs text-slate-500 mt-1">Select the unbilled charges you wish to include in this bill.</p>
        </div>
        <button @click="showBillModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <div v-if="unbilledCharges.length === 0" class="text-center py-8">
          <p class="text-slate-500 text-sm">No unbilled charges available.</p>
        </div>
        <div v-else class="space-y-3">
          <label 
            v-for="charge in unbilledCharges" 
            :key="charge._id"
            class="flex items-start gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <input 
              type="checkbox" 
              :value="charge._id" 
              v-model="selectedChargeIds"
              class="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            >
            <div class="flex-1">
              <div class="flex justify-between">
                <span class="font-bold text-slate-700 text-sm">{{ charge.description }}</span>
                <span class="font-mono font-bold text-slate-800">₹{{ getChargeTotal(charge).toFixed(2) }}</span>
              </div>
              <div class="text-xs text-slate-500 mt-1 flex gap-2">
                <span>{{ charge.chargeCategoryId?.name || 'Charge' }}</span> • 
                <span>{{ formatDate(charge.createdAt) }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
        <div class="text-sm">
          <span class="text-slate-500">Selected:</span> 
          <strong class="text-slate-800">{{ selectedChargeIds.length }} items</strong>
        </div>
        <div class="flex gap-3">
          <button 
            @click="showBillModal = false"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="submitGenerateBill"
            :disabled="generatingBill || selectedChargeIds.length === 0"
            class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="generatingBill">Generating...</span>
            <span v-else>Generate Bill</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
