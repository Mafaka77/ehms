<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useDentalStore } from '../../../stores/dentalStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import Invoice from '../Invoice.vue'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  },
  installments: {
    type: Array,
    required: true
  },
  processedCharges: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const dentalStore = useDentalStore()
const snackbarStore = useSnackbarStore()

const showInstallmentModal = ref(false)
const addingInstallment = ref(false)
const newInstallment = ref({
  chargeId: '',
  amount: 0,
  paymentMode: 'CASH'
})

const showPrintReceiptModal = ref(false)
const selectedInstallmentForPrint = ref(null)

const printReceipt = (inst) => {
  selectedInstallmentForPrint.value = inst
  showPrintReceiptModal.value = true
}

const submitInstallment = async () => {
  addingInstallment.value = true
  const res = await dentalStore.addInstallment(props.appointment._id, newInstallment.value.chargeId, {
    amount: newInstallment.value.amount,
    paymentMode: newInstallment.value.paymentMode
  })
  if (res.success) {
    snackbarStore.show({ message: 'Installment payment recorded', type: 'success' })
    showInstallmentModal.value = false
    newInstallment.value = { chargeId: '', amount: 0, paymentMode: 'CASH' }
    
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  addingInstallment.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center border-b border-slate-100 pb-3">
      <h2 class="text-lg font-bold text-slate-800">Installment Payments</h2>
      <button 
        @click="showInstallmentModal = true"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
        Add Installment
      </button>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
          <tr>
            <th class="px-4 py-3 border-b border-slate-200">Date</th>
            <th class="px-4 py-3 border-b border-slate-200">Procedure</th>
            <th class="px-4 py-3 border-b border-slate-200">Received By</th>
            <th class="px-4 py-3 border-b border-slate-200 text-right">Paid Amount</th>
            <th class="px-4 py-3 border-b border-slate-200 text-right">Remaining Balance</th>
            <th class="px-4 py-3 border-b border-slate-200 text-center">Status</th>
            <th class="px-4 py-3 border-b border-slate-200 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="installments.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-slate-500">No installments recorded.</td>
          </tr>
          <tr v-for="inst in installments" :key="inst._id" class="hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-600">{{ new Date(inst.paidDate).toLocaleString() }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ inst.dentalPatientChargesId?.description || 'Unknown Procedure' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ inst.createdBy?.fullName || 'N/A' }}</td>
            <td class="px-4 py-3 text-right font-bold text-emerald-600">₹{{ inst.amount }}</td>
            <td class="px-4 py-3 text-right font-medium text-slate-600">₹{{ inst.balance }}</td>
            <td class="px-4 py-3 text-center">
              <span class="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                {{ inst.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button @click="printReceipt(inst)" class="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Print Receipt">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Installment Modal -->
    <div v-if="showInstallmentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" @click.self="showInstallmentModal = false">
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col my-8 mx-auto">
          <div class="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
            <h3 class="font-bold text-lg text-slate-800">Add Installment</h3>
            <button @click="showInstallmentModal = false" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form @submit.prevent="submitInstallment" class="p-6 space-y-6">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Select Procedure Charge</label>
              <select v-model="newInstallment.chargeId" required class="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500">
                <option value="">Select Charge</option>
                <option v-for="c in processedCharges.filter(c => c.balance > 0)" :key="c._id" :value="c._id">
                  {{ c.description }} (Total: ₹{{ c.chargeTotal?.toLocaleString() }} | Balance: ₹{{ c.balance?.toLocaleString() }})
                </option>
              </select>
              <!-- Show addons for selected charge -->
              <div v-if="newInstallment.chargeId" class="mt-2">
                <div v-for="addon in (processedCharges.find(c => c._id === newInstallment.chargeId)?.addons || [])" :key="addon._id" class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 mr-1 mb-1">
                  <span>{{ addon.itemName }}</span>
                  <span class="text-slate-500 font-extrabold">(₹{{ addon.amount?.toLocaleString() }})</span>
                </div>
              </div>
            </div>
            
            <div v-if="newInstallment.chargeId">
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-700">Current Balance:</span>
                <span class="text-lg font-bold text-rose-600">₹{{ processedCharges.find(c => c._id === newInstallment.chargeId)?.balance || 0 }}</span>
              </div>
              <label class="block text-xs font-semibold text-slate-600 mb-1 mt-4">Payment Amount (₹)</label>
              <input type="number" min="1" :max="processedCharges.find(c => c._id === newInstallment.chargeId)?.balance" v-model="newInstallment.amount" required class="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 text-lg font-bold" />
              
              <label class="block text-xs font-semibold text-slate-600 mb-1 mt-4">Payment Mode</label>
              <select v-model="newInstallment.paymentMode" required class="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500">
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="INSURANCE">INSURANCE</option>
              </select>
            </div>

            <div class="pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
              <button type="submit" :disabled="addingInstallment || !newInstallment.chargeId" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold flex justify-center items-center">
                <svg v-if="addingInstallment" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <Invoice 
      :show="showPrintReceiptModal"
      :appointment="appointment"
      :installment="selectedInstallmentForPrint"
      @close="showPrintReceiptModal = false"
    />
  </div>
</template>
