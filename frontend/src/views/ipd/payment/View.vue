<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import InvoiceModal from './Invoice.vue'

const props = defineProps({
  admission: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['payment-success'])
const snackbarStore = useSnackbarStore()
const admissionStore = useIpdAdmissionStore()

const loading = ref(false)
const bills = ref([])
const advances = ref([])

const totalDeposit = computed(() => {
  return advances.value.reduce((sum, item) => sum + item.amount, 0)
})

const fetchDetails = async () => {
  if (!props.admission?._id) return
  loading.value = true
  
  try {
    const [billRes, advRes] = await Promise.all([
      admissionStore.fetchAdmissionBills(props.admission._id),
      admissionStore.fetchAdmissionAdvances(props.admission._id)
    ])
    
    if (billRes.success) bills.value = billRes.data
    if (advRes.success) advances.value = advRes.data
  } catch (error) {
    console.error('Error fetching IPD payment details:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.admission, fetchDetails, { immediate: true })

// Payment Modal State
const showPaymentModal = ref(false)
const processingPayment = ref(false)
const activeBill = ref(null)

const paymentForm = ref({
  deductDeposit: 0,
  amount: 0,
  paymentMode: 'CASH',
  transactionNo: '',
  remarks: ''
})

const handlePayClicked = (bill) => {
  activeBill.value = bill
  paymentForm.value = {
    deductDeposit: 0,
    amount: bill.balanceAmount,
    paymentMode: 'CASH',
    transactionNo: '',
    remarks: ''
  }
  showPaymentModal.value = true
}

const handleDepositInput = () => {
  let val = Number(paymentForm.value.deductDeposit) || 0
  const maxDeposit = totalDeposit.value
  const billTotal = activeBill.value?.balanceAmount || 0
  
  if (val > maxDeposit) val = maxDeposit
  if (val > billTotal) val = billTotal
  
  paymentForm.value.deductDeposit = val
  paymentForm.value.amount = Math.max(0, billTotal - val)
}

const submitPayment = async () => {
  const deductVal = Number(paymentForm.value.deductDeposit) || 0
  const remainingVal = Number(paymentForm.value.amount) || 0
  
  if (deductVal === 0 && remainingVal <= 0) {
    snackbarStore.show({ message: 'Please enter a valid payment amount', type: 'error' })
    return
  }

  processingPayment.value = true
  try {
    // 1. Process Deposit Deduction first
    if (deductVal > 0) {
      await api.post(`/billing/bills/${activeBill.value._id}/pay`, {
        amount: deductVal,
        paymentMode: 'ADVANCE_DEPOSIT',
        remarks: 'Deducted from IPD Advance Deposit'
      })
    }
    
    // 2. Process Remaining Amount
    if (remainingVal > 0) {
      await api.post(`/billing/bills/${activeBill.value._id}/pay`, {
        amount: remainingVal,
        paymentMode: paymentForm.value.paymentMode,
        transactionNo: paymentForm.value.transactionNo,
        remarks: paymentForm.value.remarks
      })
    }
    
    snackbarStore.show({ message: 'Payment processed successfully', type: 'success' })
    showPaymentModal.value = false
    emit('payment-success')
    fetchDetails()
  } catch (error) {
    console.error('Error processing payment:', error)
    snackbarStore.show({ 
      message: error.response?.data?.message || 'Failed to process payment', 
      type: 'error' 
    })
  } finally {
    processingPayment.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Print logic
const showInvoice = ref(false)
const invoiceBillDetails = ref(null)
const fetchingInvoice = ref(false)

const handlePrint = async (bill) => {
  fetchingInvoice.value = true
  try {
    const res = await api.get(`/billing/bills/${bill._id}`)
    invoiceBillDetails.value = res.data.data
    showInvoice.value = true
  } catch (error) {
    console.error('Error fetching bill details for print:', error)
    snackbarStore.show({ message: 'Failed to load bill details for printing', type: 'error' })
  } finally {
    fetchingInvoice.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
          <svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ admission.patientId?.fullName }}</h2>
          <div class="text-sm font-medium text-slate-500 flex gap-3 mt-1">
            <span>MRN: <strong class="text-slate-700 font-mono">{{ admission.patientId?.mrn }}</strong></span>
          </div>
        </div>
      </div>
      
      <!-- Total Deposit Widget -->
      <div class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
        <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-sm">
          <span class="text-emerald-600/80 font-semibold mr-1">Available Deposit:</span>
          <strong class="font-bold font-mono text-base">₹{{ totalDeposit.toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
      
      <div v-else-if="bills.length === 0" class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
        <p class="text-slate-500">No bills generated for this admission.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="bill in bills" 
          :key="bill._id"
          class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill Number</span>
              <h4 class="font-bold font-mono text-indigo-600 text-lg">{{ bill.billNo }}</h4>
              <p class="text-xs text-slate-500 mt-1">Generated: {{ formatDate(bill.generatedAt) }}</p>
            </div>
            
            <div class="flex flex-col items-end gap-2">
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
                    <div class="flex items-center gap-2">
                      <button 
                        @click="handlePrint(bill)"
                        class="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                      <button 
                        v-if="bill.status !== 'PAID'"
                        @click="handlePayClicked(bill)"
                        class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        Pay Now
                      </button>
                    </div>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <span class="text-xs text-slate-500">Total Amount</span>
              <div class="font-mono font-bold text-slate-800">₹{{ bill.netAmount?.toFixed(2) }}</div>
            </div>
            <div>
              <span class="text-xs text-slate-500">Paid Amount</span>
              <div class="font-mono font-bold text-emerald-600">₹{{ bill.paidAmount?.toFixed(2) }}</div>
            </div>
            <div>
              <span class="text-xs text-slate-500">Balance Amount</span>
              <div class="font-mono font-bold text-rose-600">₹{{ bill.balanceAmount?.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800">Process Payment</h3>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Deposit Deduction -->
          <div v-if="totalDeposit > 0" class="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div class="flex justify-between text-sm mb-2">
              <span class="font-bold text-emerald-800">Deduct from Deposit</span>
              <span class="text-emerald-600 font-mono">Available: ₹{{ totalDeposit.toFixed(2) }}</span>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.deductDeposit"
                @input="handleDepositInput"
                class="w-full pl-8 pr-4 py-2 border-emerald-200 rounded-lg text-emerald-800 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              >
            </div>
          </div>
          
          <div class="border-t border-slate-100 pt-4">
            <label class="block text-sm font-bold text-slate-700 mb-1">Remaining Balance to Pay</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.amount" 
                readonly
                class="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-lg text-slate-800"
              >
            </div>
          </div>

          <div v-if="paymentForm.amount > 0">
            <label class="block text-sm font-bold text-slate-700 mb-1">Payment Mode</label>
            <select v-model="paymentForm.paymentMode" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          
          <div v-if="paymentForm.amount > 0 && ['UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentForm.paymentMode)">
            <label class="block text-sm font-bold text-slate-700 mb-1">Transaction/Reference No.</label>
            <input type="text" v-model="paymentForm.transactionNo" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter reference number">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Remarks (Optional)</label>
            <input type="text" v-model="paymentForm.remarks" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any comments...">
          </div>
        </div>
        
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showPaymentModal = false" class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button @click="submitPayment" :disabled="processingPayment" class="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
            <span v-if="processingPayment">Processing...</span>
            <span v-else>Confirm Payment</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Invoice Modal Component -->
    <InvoiceModal 
      :show="showInvoice" 
      :admission="admission"
      :billDetails="invoiceBillDetails"
      @close="showInvoice = false"
    />
  </div>
</template>
