<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEndoscopyStore } from '../../../stores/endoscopyStore'
import EndoscopyInvoiceModal from './Invoice.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['bill-generated', 'pay-clicked'])
const snackbarStore = useSnackbarStore()
const endoscopyStore = useEndoscopyStore()

const showInvoiceModal = ref(false)
const loadingBill = ref(false)
const billDetails = ref(null)

const fetchBillDetails = async (billId) => {
  if (!billId) {
    billDetails.value = null
    return
  }
  loadingBill.value = true
  try {
    const data = await endoscopyStore.fetchBillDetails(billId)
    billDetails.value = data
  } catch (error) {
    console.error('Error fetching bill details:', error)
    snackbarStore.show({
      message: error.response?.data?.message || error.message || 'Failed to load bill details',
      type: 'error'
    })
  } finally {
    loadingBill.value = false
  }
}

watch(() => props.order, (newOrder) => {
  if (newOrder && newOrder.billId) {
    fetchBillDetails(newOrder.billId)
  } else {
    billDetails.value = null
  }
}, { immediate: true })

const showDiscount = ref(false)
const discountMode = ref('employee')
const discountInputVal = ref(20)
const discountRemarks = ref('')

const discountAmount = computed(() => {
  if (!showDiscount.value) return 0
  if (discountMode.value === 'employee') {
    return Number((props.order.totalAmount * 0.20).toFixed(2))
  } else if (discountMode.value === 'percentage') {
    const pct = Number(discountInputVal.value) || 0
    return Number((props.order.totalAmount * (pct / 100)).toFixed(2))
  } else {
    return Number(discountInputVal.value) || 0
  }
})

const netAmount = computed(() => {
  return Math.max(0, props.order.totalAmount - discountAmount.value)
})

const employeeSearchQuery = ref('')
const isSearchingEmployees = ref(false)
const employeeSearchResults = ref([])
const selectedEmployee = ref(null)

const searchEmployees = async () => {
  if (employeeSearchQuery.value.length < 2) {
    employeeSearchResults.value = []
    return
  }
  isSearchingEmployees.value = true
  try {
    const res = await api.get('/employees', { params: { search: employeeSearchQuery.value, limit: 10 } })
    employeeSearchResults.value = res.data.data
  } catch (err) {
    console.error('Error searching employees:', err)
  } finally {
    isSearchingEmployees.value = false
  }
}

let employeeSearchTimeout = null
watch(employeeSearchQuery, () => {
  if (employeeSearchTimeout) clearTimeout(employeeSearchTimeout)
  if (selectedEmployee.value && employeeSearchQuery.value === selectedEmployee.value.fullName) return
  employeeSearchTimeout = setTimeout(() => {
    searchEmployees()
  }, 400)
})

const selectEmployee = (emp) => {
  selectedEmployee.value = emp
  employeeSearchQuery.value = emp.fullName
  employeeSearchResults.value = []
}

const clearEmployee = () => {
  selectedEmployee.value = null
  employeeSearchQuery.value = ''
}

watch(() => props.order, () => {
  showDiscount.value = false
  discountMode.value = 'employee'
  discountInputVal.value = 0
  selectedEmployee.value = null
  employeeSearchQuery.value = ''
  discountRemarks.value = ''
})

const generateBill = async () => {
  loadingBill.value = true
  try {
    const payload = {
      endoscopyOrderId: props.order._id,
      discountAmount: discountAmount.value,
      discountType: showDiscount.value ? (discountMode.value === 'employee' ? 'EMPLOYEE' : (discountMode.value === 'percentage' ? 'PERCENTAGE' : 'AMOUNT')) : 'CUSTOM',
      discountRemarks: showDiscount.value ? discountRemarks.value : ''
    }
    if (showDiscount.value && discountMode.value === 'employee' && selectedEmployee.value) {
      payload.employeeId = selectedEmployee.value._id
    }
    const data = await endoscopyStore.generateBill(payload)
    snackbarStore.show({
      message: 'Bill generated successfully',
      type: 'success'
    })
    await fetchBillDetails(data._id)
    emit('bill-generated', data)
  } catch (error) {
    console.error('Error generating bill:', error)
    snackbarStore.show({
      message: error.response?.data?.message || error.message || 'Failed to generate bill',
      type: 'error'
    })
  } finally {
    loadingBill.value = false
  }
}

const printBill = () => {
  showInvoiceModal.value = true
}

const loadingCancel = ref(false)

const cancelBill = async () => {
  if (!billDetails.value?._id) return
  if (!confirm('Are you sure you want to cancel this bill? This will delete the draft bill and reset any discount details.')) return
  
  loadingCancel.value = true
  try {
    await endoscopyStore.cancelBill(billDetails.value._id)
    snackbarStore.show({
      message: 'Bill cancelled successfully',
      type: 'success'
    })
    billDetails.value = null
    emit('bill-generated', null)
  } catch (error) {
    console.error('Error cancelling bill:', error)
    snackbarStore.show({
      message: error.response?.data?.message || error.message || 'Failed to cancel bill',
      type: 'error'
    })
  } finally {
    loadingCancel.value = false
  }
}

const revertingPaymentId = ref(null)

const handleRevertPayment = async (payment) => {
  if (!confirm(`Are you sure you want to revert payment ${payment.paymentNo} of ${formatCurrency(payment.amount)}?`)) return
  
  revertingPaymentId.value = payment._id
  try {
    await endoscopyStore.cancelPayment(payment._id)
    snackbarStore.show({
      message: 'Payment reverted successfully',
      type: 'success'
    })
    if (props.order?.billId) {
      await fetchBillDetails(props.order.billId)
    }
    emit('bill-generated', billDetails.value)
  } catch (error) {
    console.error('Error reverting payment:', error)
    snackbarStore.show({
      message: error.response?.data?.message || error.message || 'Failed to revert payment',
      type: 'error'
    })
  } finally {
    revertingPaymentId.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'STAT': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'URGENT': return 'bg-amber-100 text-amber-700 border-amber-200'
    default: return 'bg-teal-100 text-teal-700 border-teal-200'
  }
}

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'UNPAID': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'IPD': return 'bg-teal-100 text-teal-700 border-teal-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <div>
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full">
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Order Details</span>
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
          <span class="font-mono">{{ order.orderNo }}</span>
          <span :class="['px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border', getPriorityColor(order.priority)]">
            {{ order.priority }}
          </span>
        </h2>
      </div>
      <div class="text-right">
        <span :class="['px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(order.paymentStatus)]">
          {{ order.paymentStatus }}
        </span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="p-6 flex-grow overflow-y-auto space-y-6">
      <!-- Patient & Doctor Info Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h4 class="text-xs font-semibold uppercase text-slate-400">Patient Details</h4>
          <p class="font-bold text-slate-800 mt-1 flex items-center gap-1.5 flex-wrap">
            {{ order.patientId?.fullName }}
            <span v-if="order.patientId?.isEmployee" class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-700 border border-teal-200">
              Staff ({{ order.patientId?.employeeCode }})
            </span>
          </p>
          <p class="text-xs text-slate-500 font-mono mt-0.5">{{ order.patientId?.patientCode }}</p>
          <p class="text-xs text-slate-500 mt-0.5">{{ order.patientId?.gender }} • {{ order.patientId?.age || '-' }} Years</p>
          <p class="text-xs text-slate-500 mt-0.5">Mob: {{ order.patientId?.mobileNo }}</p>
        </div>
        <div>
          <h4 class="text-xs font-semibold uppercase text-slate-400">Clinical details</h4>
          <p class="font-bold text-slate-800 mt-1">{{ order.doctorId?.fullName || 'Self/Referral' }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Order Date: {{ formatDate(order.orderDate) }}</p>
          <p class="text-xs text-slate-500 mt-0.5" v-if="order.clinicalNotes">Notes: {{ order.clinicalNotes }}</p>
        </div>
      </div>

      <!-- Test list -->
      <div>
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Ordered Endoscopy Tests</h3>
        <div class="border border-slate-100 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th class="px-4 py-3">Test Name</th>
                <th class="px-4 py-3 text-right">Rate</th>
                <th class="px-4 py-3 text-center">Qty</th>
                <th class="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="item in order.items" :key="item._id" class="hover:bg-slate-50/50">
                <td class="px-4 py-3 font-medium text-slate-800">{{ item.endoscopyTestId?.name || 'Endoscopy Test' }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ formatCurrency(item.rate) }}</td>
                <td class="px-4 py-3 text-center font-mono">{{ item.quantity || 1 }}</td>
                <td class="px-4 py-3 text-right font-mono font-semibold">{{ formatCurrency(item.amount) }}</td>
              </tr>
              <tr class="bg-slate-50/50 font-bold border-t border-slate-100">
                <td colspan="3" class="px-4 py-3 text-slate-800">Total amount</td>
                <td class="px-4 py-3 text-right font-mono text-teal-600 text-sm">{{ formatCurrency(order.totalAmount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bill summary if generated -->
      <div v-if="billDetails" class="space-y-3 bg-teal-50/40 p-4 rounded-xl border border-teal-100/50">
        <div class="flex justify-between items-center border-b border-teal-100/50 pb-2">
          <div>
            <h4 class="text-xs font-bold uppercase text-teal-600">Associated Bill Info</h4>
            <span class="font-mono font-bold text-xs text-teal-950 mt-0.5">{{ billDetails.billNo }}</span>
          </div>
          <span :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase border', 
            billDetails.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200']">
            {{ billDetails.status }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-slate-500">Gross Amount:</span>
            <p class="font-bold text-slate-800 font-mono">{{ formatCurrency(billDetails.grossAmount) }}</p>
          </div>
          <div>
            <span class="text-slate-500">Discount:</span>
            <p class="font-bold text-emerald-600 font-mono">-{{ formatCurrency(billDetails.discountAmount) }}</p>
          </div>
          <div>
            <span class="text-slate-500">Net Amount:</span>
            <p class="font-bold text-teal-900 font-mono">{{ formatCurrency(billDetails.netAmount) }}</p>
          </div>
          <div>
            <span class="text-slate-500">Paid Amount:</span>
            <p class="font-bold text-slate-800 font-mono">{{ formatCurrency(billDetails.paidAmount) }}</p>
          </div>
          <div class="col-span-2 border-t border-slate-100 pt-2 flex justify-between items-center text-sm">
            <span class="text-slate-700 font-semibold">Balance Payable:</span>
            <span class="font-bold text-rose-600 font-mono">{{ formatCurrency(billDetails.balanceAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment History if payments exist -->
      <div v-if="billDetails && billDetails.payments && billDetails.payments.length > 0" class="space-y-3">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment History</h3>
        <div class="max-h-48 overflow-y-auto border border-slate-100 rounded-xl bg-white">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-4 py-2.5">Ref No</th>
                <th class="px-4 py-2.5">Mode</th>
                <th class="px-4 py-2.5 text-right">Amount</th>
                <th class="px-4 py-2.5 text-center">Status</th>
                <th class="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="pay in billDetails.payments" :key="pay._id" class="hover:bg-slate-50/50">
                <td class="px-4 py-3 font-mono">
                  <p class="font-bold text-slate-900 text-[10px]">{{ pay.paymentNo }}</p>
                  <p class="text-[9px] text-slate-400 mt-0.5" v-if="pay.transactionNo">TXN: {{ pay.transactionNo }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="font-medium">{{ pay.paymentMode }}</span>
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold">{{ formatCurrency(pay.amount) }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="['px-1.5 py-0.5 text-[9px] font-bold rounded uppercase', 
                    pay.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700']">
                    {{ pay.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button 
                    v-if="pay.status === 'SUCCESS'"
                    @click="handleRevertPayment(pay)"
                    :disabled="revertingPaymentId === pay._id"
                    type="button"
                    class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded font-semibold text-[10px] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <span v-if="revertingPaymentId === pay._id" class="animate-spin inline-block h-2 w-2 border border-rose-600 border-t-transparent rounded-full mr-1"></span>
                    Revert
                  </button>
                  <span v-else class="text-[10px] text-slate-400 font-medium">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
      <!-- 1. Generate Bill -->
      <button
        v-if="!order.billId && order.paymentStatus === 'UNPAID'"
        @click="generateBill"
        :disabled="loadingBill || (showDiscount && discountMode === 'employee' && !selectedEmployee)"
        class="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-100 hover:shadow-teal-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <span v-if="loadingBill" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        Generate Bill
      </button>

      <!-- 2. Process Payment -->
      <div v-else-if="billDetails && billDetails.status !== 'PAID'" class="w-full flex flex-col gap-2.5">
        <button
          @click="emit('pay-clicked', billDetails)"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          Process Payment ({{ formatCurrency(billDetails.balanceAmount) }})
        </button>
        <div class="flex gap-2.5 w-full">
          <button 
            @click="printBill" 
            type="button"
            class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Bill
          </button>
          <button 
            @click="cancelBill" 
            :disabled="loadingCancel" 
            type="button"
            class="flex-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="loadingCancel" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-rose-600 border-t-transparent"></span>
            Cancel Bill
          </button>
        </div>
      </div>

      <!-- 3. Receipt Info -->
      <div v-else-if="billDetails && billDetails.status === 'PAID'" class="w-full flex flex-col gap-2.5">
        <div class="text-center text-emerald-600 font-bold text-sm bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Bill Fully Settled
        </div>
        <button
          @click="printBill"
          type="button"
          class="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-100 hover:shadow-teal-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>
    </div>
  </div>

  <!-- Printable Invoice Modal -->
  <EndoscopyInvoiceModal 
    :show="showInvoiceModal" 
    :order="order" 
    :billDetails="billDetails" 
    @close="showInvoiceModal = false" 
  />
  </div>
</template>
