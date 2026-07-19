<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useDentalStore } from '../../../stores/dentalStore'
import DentalInvoiceModal from './Invoice.vue'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['bill-generated', 'pay-clicked'])
const snackbarStore = useSnackbarStore()
const dentalStore = useDentalStore()

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
    const data = await dentalStore.fetchBillDetails(billId)
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

// Watch for appointment changes to load bill if it exists
watch(() => props.appointment, (newAppt) => {
  if (newAppt && newAppt.billId) {
    fetchBillDetails(newAppt.billId)
  } else {
    billDetails.value = null
  }
}, { immediate: true })

const showDiscount = ref(false)
const discountMode = ref('employee') // 'employee', 'percentage', 'amount'
const discountInputVal = ref(20) // percentage or flat amount value
const discountRemarks = ref('')

// Compute final discount amount
const discountAmount = computed(() => {
  if (!showDiscount.value) return 0
  const gross = props.appointment.consultationFee || 0
  if (discountMode.value === 'employee') {
    return Number((gross * 0.20).toFixed(2)) // 20% default employee discount
  } else if (discountMode.value === 'percentage') {
    const pct = Number(discountInputVal.value) || 0
    return Number((gross * (pct / 100)).toFixed(2))
  } else {
    return Number(discountInputVal.value) || 0
  }
})

// Compute net total amount
const netAmount = computed(() => {
  return Math.max(0, (props.appointment.consultationFee || 0) - discountAmount.value)
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

// Reset/Auto-detect discount when appointment changes
watch(() => props.appointment, (newAppt) => {
  if (newAppt && !newAppt.billId && newAppt.patientId?.isEmployee) {
    showDiscount.value = true
    discountMode.value = 'employee'
    discountInputVal.value = 20
    selectedEmployee.value = {
      _id: newAppt.patientId.employeeId,
      fullName: newAppt.patientId.fullName,
      employeeCode: newAppt.patientId.employeeCode
    }
    employeeSearchQuery.value = newAppt.patientId.fullName
  } else {
    showDiscount.value = false
    discountMode.value = 'employee'
    discountInputVal.value = 20
    selectedEmployee.value = null
    employeeSearchQuery.value = ''
  }
  discountRemarks.value = ''
})

const generateConsultationBill = async () => {
  loadingBill.value = true
  try {
    const payload = {
      dentalAppointmentId: props.appointment._id,
      discountAmount: discountAmount.value,
      discountType: showDiscount.value ? (discountMode.value === 'employee' ? 'EMPLOYEE' : (discountMode.value === 'percentage' ? 'PERCENTAGE' : 'AMOUNT')) : 'CUSTOM',
      discountRemarks: showDiscount.value ? discountRemarks.value : ''
    }
    if (showDiscount.value && discountMode.value === 'employee' && selectedEmployee.value) {
      payload.employeeId = selectedEmployee.value._id
    }
    const data = await dentalStore.generateConsultationBill(payload)
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
    await dentalStore.cancelBill(billDetails.value._id)
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
    await dentalStore.cancelPayment(payment._id)
    snackbarStore.show({
      message: 'Payment reverted successfully',
      type: 'success'
    })
    
    // Refresh bill details
    if (props.appointment?.billId) {
      await fetchBillDetails(props.appointment.billId)
    }
    
    // Notify parent to refresh the appointment list
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

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Unpaid': return 'bg-rose-100 text-rose-700 border-rose-200'
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
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Appointment Details</span>
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
          <span class="font-mono">{{ appointment.appointmentId }}</span>
        </h2>
      </div>
      <div class="text-right">
        <span :class="['px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(appointment.paymentStatus)]">
          {{ appointment.paymentStatus }}
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
            {{ appointment.patientId?.fullName }}
            <span v-if="appointment.patientId?.isEmployee" class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
              Staff ({{ appointment.patientId?.employeeCode }})
            </span>
          </p>
          <p class="text-xs text-slate-500 font-mono mt-0.5">{{ appointment.patientId?.patientCode }}</p>
          <p class="text-xs text-slate-500 mt-0.5">{{ appointment.patientId?.gender }} • {{ appointment.patientId?.age }} Years</p>
          <p class="text-xs text-slate-500 mt-0.5">Mob: {{ appointment.patientId?.mobileNo }}</p>
        </div>
        <div>
          <h4 class="text-xs font-semibold uppercase text-slate-400">Consultation Details</h4>
          <p class="font-bold text-slate-800 mt-1">Dr. {{ appointment.doctorId?.fullName || 'N/A' }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Specialization: {{ appointment.doctorId?.specializationId?.name || '-' }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Date: {{ formatDate(appointment.appointmentDate) }}</p>
          <p class="text-xs text-slate-500 mt-0.5" v-if="appointment.notes">Notes: {{ appointment.notes }}</p>
        </div>
      </div>

      <!-- Item Charge List -->
      <div>
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Charges</h3>
        <div class="border border-slate-100 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th class="px-4 py-3">Charge Description</th>
                <th class="px-4 py-3 text-right">Rate</th>
                <th class="px-4 py-3 text-center">Qty</th>
                <th class="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr class="hover:bg-slate-50/50">
                <td class="px-4 py-3 font-medium text-slate-800">Dental Consultation Fee - Dr. {{ appointment.doctorId?.fullName || 'N/A' }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ formatCurrency(appointment.consultationFee) }}</td>
                <td class="px-4 py-3 text-center font-mono">1</td>
                <td class="px-4 py-3 text-right font-mono font-semibold">{{ formatCurrency(appointment.consultationFee) }}</td>
              </tr>
              <tr class="bg-slate-50/50 font-bold border-t border-slate-100">
                <td colspan="3" class="px-4 py-3 text-slate-800">Total Amount</td>
                <td class="px-4 py-3 text-right font-mono text-indigo-600 text-sm">{{ formatCurrency(appointment.consultationFee) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Discount Configuration (Only if bill not generated yet) -->
      <div v-if="false && !appointment.billId && appointment.paymentStatus === 'Unpaid'" class="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 uppercase select-none">
            <input type="checkbox" v-model="showDiscount" class="text-indigo-600 focus:ring-indigo-500 rounded border-slate-300">
            Apply Discount
          </label>
          <span v-if="showDiscount" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
            Discount Enabled
          </span>
        </div>

        <div v-if="showDiscount" class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Type</label>
            <select 
              v-model="discountMode"
              class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
            >
              <option value="employee">Employee Discount (20%)</option>
              <option value="percentage">Custom Percentage (%)</option>
              <option value="amount">Custom Flat Amount (₹)</option>
            </select>
          </div>

          <div v-if="discountMode !== 'employee'" class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {{ discountMode === 'percentage' ? 'Percentage (%)' : 'Amount (INR)' }}
            </label>
            <input 
              v-model.number="discountInputVal"
              type="number"
              min="0"
              class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-mono"
            />
          </div>

          <!-- Employee Search Select -->
          <div v-else class="col-span-2 sm:col-span-1 relative">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Employee <span class="text-rose-500">*</span></label>
            
            <div v-if="selectedEmployee" class="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div class="flex flex-col overflow-hidden w-full">
                <span class="text-xs font-bold text-indigo-900 truncate">{{ selectedEmployee.fullName }}</span>
                <span class="text-[9px] text-indigo-700 font-mono truncate">{{ selectedEmployee.employeeCode }}</span>
              </div>
              <button type="button" @click="clearEmployee" class="text-indigo-400 hover:text-indigo-600 focus:outline-none ml-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div v-else>
              <input 
                v-model="employeeSearchQuery"
                type="text" 
                placeholder="Name or employee code..." 
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <!-- Dropdown Results -->
              <div v-if="employeeSearchResults.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <ul class="py-0.5 divide-y divide-slate-50">
                  <li 
                    v-for="emp in employeeSearchResults" 
                    :key="emp._id"
                    @click="selectEmployee(emp)"
                    class="px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer flex flex-col"
                  >
                    <span class="text-xs font-semibold text-slate-800">{{ emp.fullName }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ emp.employeeCode }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Reason/Remarks Input -->
          <div class="col-span-2">
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Reason / Remarks</label>
            <input 
              v-model="discountRemarks"
              type="text"
              placeholder="e.g. Hospital staff benefit, Special management approval..."
              class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        <!-- Live Totals Summary (If discount is applied) -->
        <div v-if="showDiscount" class="pt-2.5 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
          <div class="flex justify-between items-center text-slate-500">
            <span>Gross Total:</span>
            <span class="font-mono">{{ formatCurrency(appointment.consultationFee) }}</span>
          </div>
          <div class="flex justify-between items-center text-emerald-600 font-medium">
            <span>Discount Applied:</span>
            <span class="font-mono">-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="flex justify-between items-center text-slate-800 font-bold border-t border-slate-200/50 pt-1.5">
            <span>Net Total to Bill:</span>
            <span class="font-mono text-indigo-600">{{ formatCurrency(netAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Bill Details Skeleton Loader -->
      <div v-if="loadingBill" class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-pulse mt-4">
        <div class="flex justify-between items-center border-b border-slate-200 pb-3">
          <div class="space-y-2">
            <div class="h-3 w-32 bg-slate-200 rounded"></div>
            <div class="h-4 w-24 bg-slate-200 rounded"></div>
          </div>
          <div class="h-5 w-16 bg-slate-200 rounded"></div>
        </div>
        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded"></div><div class="h-4 w-24 bg-slate-200 rounded"></div></div>
          <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded"></div><div class="h-4 w-24 bg-slate-200 rounded"></div></div>
          <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded"></div><div class="h-4 w-24 bg-slate-200 rounded"></div></div>
          <div class="space-y-1.5"><div class="h-3 w-20 bg-slate-200 rounded"></div><div class="h-4 w-24 bg-slate-200 rounded"></div></div>
          <div class="col-span-2 border-t border-slate-200 pt-3 flex justify-between">
            <div class="h-4 w-28 bg-slate-200 rounded"></div>
            <div class="h-4 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Bill summary if generated -->
      <div v-else-if="billDetails" class="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50 mt-4">
        <div class="flex justify-between items-center border-b border-indigo-100/50 pb-2">
          <div>
            <h4 class="text-xs font-bold uppercase text-indigo-500">Associated Bill Info</h4>
            <span class="font-mono font-bold text-xs text-indigo-950 mt-0.5">{{ billDetails.billNo }}</span>
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
            <p class="font-bold text-indigo-900 font-mono">{{ formatCurrency(billDetails.netAmount) }}</p>
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
                    class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded font-semibold text-[10px] transition-all active:scale-95 disabled:opacity-50"
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
      <!-- 1. Generate Bill: Show if no billId is set on appointment and payment status is Unpaid -->
      <button
        v-if="!appointment.billId && appointment.paymentStatus === 'Unpaid'"
        @click="generateConsultationBill"
        :disabled="loadingBill || (showDiscount && discountMode === 'employee' && !selectedEmployee)"
        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span v-if="loadingBill" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        Generate Bill
      </button>

      <!-- 2. Process Payment: Show if billDetails exist and status is not PAID -->
      <div v-else-if="billDetails && billDetails.status !== 'PAID'" class="w-full flex flex-col gap-2.5">
        <button
          @click="emit('pay-clicked', billDetails)"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          Process Payment ({{ formatCurrency(billDetails.balanceAmount) }})
        </button>
        <div class="flex gap-2.5 w-full">
          <button 
            @click="printBill" 
            type="button"
            class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
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
            class="flex-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <span v-if="loadingCancel" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-rose-600 border-t-transparent"></span>
            Cancel Bill
          </button>
        </div>
      </div>

      <!-- 3. Receipt Info: Show if bill is fully paid -->
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
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
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
  <DentalInvoiceModal 
    :show="showInvoiceModal" 
    :appointment="appointment" 
    :billDetails="billDetails" 
    @close="showInvoiceModal = false" 
  />
  </div>
</template>
