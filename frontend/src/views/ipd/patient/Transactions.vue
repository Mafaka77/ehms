<script setup>
import { ref, onMounted } from 'vue'
import api from '../../../axios/api'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import InvoiceModal from '../payment/Invoice.vue'

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

// Modal States
const showBillModal = ref(false)
const generatingBill = ref(false)
const selectedChargeIds = ref([])

// Edit Modal States
const showEditBillModal = ref(false)
const updatingBill = ref(false)
const editingBill = ref(null)
const editAvailableCharges = ref([])
const selectedEditChargeIds = ref([])

// Invoice Preview Modal States
const showInvoiceModal = ref(false)
const invoiceBillDetails = ref(null)

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

// Edit Bill Logic
const openEditBillModal = async (bill) => {
  if (bill.status === 'PAID') {
    snackbarStore.show({ message: 'Paid bills cannot be edited.', type: 'warning' })
    return
  }

  editingBill.value = bill

  const res = await admissionStore.fetchAdmissionCharges(props.admissionId)
  if (res.success) {
    // Show charges that are unbilled OR already attached to this bill
    const allCharges = res.data || []
    editAvailableCharges.value = allCharges.filter(c => !c.isBilled || c.billId === bill._id)
    selectedEditChargeIds.value = allCharges.filter(c => c.billId === bill._id).map(c => c._id)
  }

  showEditBillModal.value = true
}

const submitUpdateBill = async () => {
  if (selectedEditChargeIds.value.length === 0) {
    snackbarStore.show({ message: 'Please select at least one charge for the bill.', type: 'warning' })
    return
  }

  updatingBill.value = true
  const res = await admissionStore.updateIpdBill(editingBill.value._id, {
    chargeIds: selectedEditChargeIds.value,
    discountAmount: 0
  })

  if (res.success) {
    snackbarStore.show({ message: 'Bill updated successfully!', type: 'success' })
    showEditBillModal.value = false
    fetchAdvancesAndBills()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  updatingBill.value = false
}

// Delete Bill Logic
const handleDeleteBill = async (bill) => {
  if (bill.status === 'PAID') {
    snackbarStore.show({ message: 'Paid bills cannot be deleted.', type: 'warning' })
    return
  }

  if (!confirm(`Are you sure you want to delete bill "${bill.billNo}"? All billed charges in this bill will revert to unbilled.`)) {
    return
  }

  const res = await admissionStore.deleteIpdBill(bill._id)
  if (res.success) {
    snackbarStore.show({ message: 'Bill deleted successfully!', type: 'success' })
    fetchAdvancesAndBills()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// View Invoice Logic
const handleViewInvoice = async (bill) => {
  try {
    const res = await api.get(`/billing/bills/${bill._id}`)
    invoiceBillDetails.value = res.data.data
    showInvoiceModal.value = true
  } catch (error) {
    console.error('Error fetching invoice details:', error)
    snackbarStore.show({ message: 'Failed to load invoice details.', type: 'error' })
  }
}

// Expose refresh function to parent
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

const formatPaymentModes = (bill) => {
  if (!bill.payments || bill.payments.length === 0) return null
  const modeNames = {
    'CASH': 'Cash',
    'UPI': 'UPI',
    'CARD': 'Card',
    'BANK_TRANSFER': 'Bank Transfer',
    'CHEQUE': 'Cheque',
    'INSURANCE': 'Insurance',
    'ADVANCE_DEPOSIT': 'Advance'
  }
  const modes = [...new Set(bill.payments.map(p => modeNames[p.paymentMode] || p.paymentMode))]
  return modes.join(' + ')
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
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
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
          class="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
        >
          <div>
            <div class="flex justify-between items-start mb-3">
              <div>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill No</span>
                <h4 class="font-bold font-mono text-indigo-600">{{ bill.billNo }}</h4>
              </div>
              <div class="flex flex-col items-end gap-1">
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
                <span v-if="formatPaymentModes(bill)" class="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Via {{ formatPaymentModes(bill) }}
                </span>
              </div>
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

          <!-- Bill Action Buttons -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button 
              @click="handleViewInvoice(bill)" 
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Invoice
            </button>

            <div class="flex items-center gap-1">
              <button 
                @click="openEditBillModal(bill)" 
                :disabled="bill.status === 'PAID'"
                title="Edit Bill"
                class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                @click="handleDeleteBill(bill)" 
                :disabled="bill.status === 'PAID'"
                title="Delete Bill"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
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
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="submitGenerateBill"
            :disabled="generatingBill || selectedChargeIds.length === 0"
            class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <span v-if="generatingBill">Generating...</span>
            <span v-else>Generate Bill</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Bill Modal -->
  <div v-if="showEditBillModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            Edit IPD Bill ({{ editingBill?.billNo }})
          </h3>
          <p class="text-xs text-slate-500 mt-1">Select charges to include or exclude from this bill.</p>
        </div>
        <button @click="showEditBillModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Included Charges</label>
          <div v-if="editAvailableCharges.length === 0" class="text-center py-6 text-slate-500 text-sm">
            No charges available.
          </div>
          <div v-else class="space-y-3">
            <label 
              v-for="charge in editAvailableCharges" 
              :key="charge._id"
              class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors"
              :class="selectedEditChargeIds.includes(charge._id) ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:bg-slate-50'"
            >
              <input 
                type="checkbox" 
                :value="charge._id" 
                v-model="selectedEditChargeIds"
                class="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
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
      </div>

      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
        <div class="text-sm">
          <span class="text-slate-500">Selected:</span> 
          <strong class="text-slate-800">{{ selectedEditChargeIds.length }} items</strong>
        </div>
        <div class="flex gap-3">
          <button 
            @click="showEditBillModal = false"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="submitUpdateBill"
            :disabled="updatingBill || selectedEditChargeIds.length === 0"
            class="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <span v-if="updatingBill">Updating...</span>
            <span v-else>Update Bill</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Invoice Preview Modal -->
  <InvoiceModal 
    :show="showInvoiceModal"
    :admission="admission"
    :billDetails="invoiceBillDetails"
    @close="showInvoiceModal = false"
  />
</template>
