<script setup>
import { ref, onMounted, computed } from 'vue'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useDoctorStore } from '../../../stores/doctorStore'
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
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()

// State
const loading = ref(false)
const endoscopyCharges = ref([])
const showOrderModal = ref(false)
const orderSubmitting = ref(false)

// Configured IDs
const endoscopyCategoryId = ref(null)
const chargeMastersList = ref([])

// Form state
const orderForm = ref({
  chargeMasterId: '',
  doctorId: '',
  chargeDate: new Date().toISOString().split('T')[0],
  rate: 0
})

// Get today's local date in YYYY-MM-DD for datepicker restriction
const todayStr = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Load categories & extract Endoscopy
const loadEndoscopyConfiguration = async () => {
  const res = await admissionStore.fetchChargeCategories()
  if (res.success) {
    const category = res.data.find(cat => cat.code === 'ENDOSCOPY')
    if (category) {
      endoscopyCategoryId.value = category._id
      // Fetch available endoscopy procedures
      const mastersRes = await admissionStore.fetchChargeMasters(category._id)
      if (mastersRes.success) {
        chargeMastersList.value = mastersRes.data
      }
    } else {
      snackbarStore.show({ message: 'Endoscopy charge category not found in setup.', type: 'warning' })
    }
  }
}

// Fetch admission charges & filter endoscopy
const fetchEndoscopyCharges = async () => {
  loading.value = true
  const res = await admissionStore.fetchAdmissionCharges(props.admissionId)
  if (res.success) {
    // Filter charges where chargeCategoryId code is ENDOSCOPY
    endoscopyCharges.value = res.data.filter(charge => 
      charge.chargeCategoryId?.code === 'ENDOSCOPY' || 
      charge.chargeCategoryId?._id === endoscopyCategoryId.value
    )
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

// On procedure change, populate rate
const onProcedureChange = () => {
  const selected = chargeMastersList.value.find(m => m._id === orderForm.value.chargeMasterId)
  if (selected) {
    orderForm.value.rate = selected.rate || 0
  } else {
    orderForm.value.rate = 0
  }
}

// Open Order Modal
const openOrderModal = async () => {
  orderForm.value = {
    chargeMasterId: '',
    doctorId: props.admission.consultantDoctorId?._id || props.admission.consultantDoctorId || '',
    chargeDate: todayStr.value,
    rate: 0
  }
  showOrderModal.value = true
  await doctorStore.fetchDoctors(1, 100)
}

// Submit Endoscopy Order
const submitEndoscopyOrder = async () => {
  if (!orderForm.value.chargeMasterId) {
    snackbarStore.show({ message: 'Please select an endoscopy procedure.', type: 'warning' })
    return
  }

  const selectedMaster = chargeMastersList.value.find(m => m._id === orderForm.value.chargeMasterId)
  if (!selectedMaster) return

  orderSubmitting.value = true

  const payload = {
    chargeCategoryId: endoscopyCategoryId.value,
    chargeMasterId: orderForm.value.chargeMasterId,
    description: selectedMaster.name,
    rate: orderForm.value.rate,
    quantity: 1,
    doctorId: orderForm.value.doctorId || null,
    chargeDate: orderForm.value.chargeDate
  }

  const res = await admissionStore.addAdmissionCharge(props.admissionId, payload)
  if (res.success) {
    snackbarStore.show({ message: 'Endoscopy procedure ordered successfully.', type: 'success' })
    showOrderModal.value = false
    await fetchEndoscopyCharges()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  orderSubmitting.value = false
}

// Delete Endoscopy Order
const deleteEndoscopyOrder = async (chargeId) => {
  if (!confirm('Are you sure you want to cancel and delete this endoscopy procedure?')) return

  const res = await admissionStore.deleteAdmissionCharge(chargeId)
  if (res.success) {
    snackbarStore.show({ message: 'Endoscopy procedure cancelled successfully.', type: 'success' })
    await fetchEndoscopyCharges()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await loadEndoscopyConfiguration()
  await fetchEndoscopyCharges()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header Controls -->
    <div class="flex items-center justify-between pb-1">
      <div>
        <h3 class="font-bold text-slate-800 text-sm">Endoscopy Investigations</h3>
        <p class="text-[11px] text-slate-400">Manage gastroscopy, colonoscopy, bronchoscopy, and other endoscopy tests.</p>
      </div>
      <button
        @click="openOrderModal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Order Endoscopy Procedure
      </button>
    </div>

    <!-- Listing Table -->
    <div v-if="loading" class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading endoscopy procedures...
    </div>

    <div v-else-if="endoscopyCharges.length === 0" class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400 bg-white">
      <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <p class="font-bold text-slate-600">No Endoscopy Investigations Requested</p>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Click "Order Endoscopy Procedure" to add gastroscopy, colonoscopy, or ERCP imaging to the patient's record.</p>
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th class="p-4">Procedure Description</th>
            <th class="p-4">Ordered Date</th>
            <th class="p-4">Performing Doctor</th>
            <th class="p-4 text-right">Price</th>
            <th class="p-4">Billing Status</th>
            <th class="p-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 text-xs text-slate-600">
          <tr v-for="charge in endoscopyCharges" :key="charge._id" class="hover:bg-slate-50/50 transition-colors">
            <td class="p-4 font-bold text-slate-800">{{ charge.description }}</td>
            <td class="p-4">{{ formatDate(charge.createdAt) }}</td>
            <td class="p-4 font-semibold text-slate-700">Dr. {{ charge.doctorId?.fullName || 'N/A' }}</td>
            <td class="p-4 text-right font-bold text-slate-800">₹{{ charge.amount }}</td>
            <td class="p-4">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold border"
                :class="charge.isBilled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
              >
                {{ charge.isBilled ? 'BILLED' : 'UNBILLED (RUNNING)' }}
              </span>
            </td>
            <td class="p-4 text-center">
              <button
                @click="deleteEndoscopyOrder(charge._id)"
                :disabled="charge.isBilled"
                class="px-2.5 py-1 border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Cancel / Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Endoscopy Modal -->
    <div v-if="showOrderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <!-- Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Order Endoscopy Procedure</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Select procedure type and performing consultant.</p>
          </div>
          <button @click="showOrderModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 space-y-4">
          <!-- Select Procedure -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Endoscopy Procedure</label>
            <select
              v-model="orderForm.chargeMasterId"
              @change="onProcedureChange"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
            >
              <option value="">Select procedure...</option>
              <option v-for="master in chargeMastersList" :key="master._id" :value="master._id">
                {{ master.name }} (₹{{ master.rate }})
              </option>
            </select>
          </div>

          <!-- Select Doctor -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Performing Doctor</label>
            <select
              v-model="orderForm.doctorId"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
            >
              <option value="">Select doctor...</option>
              <option v-for="doc in doctorStore.doctors" :key="doc._id" :value="doc._id">
                Dr. {{ doc.fullName }}
              </option>
            </select>
          </div>

          <!-- Date Picker -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Order Date (Backdating allowed)</label>
            <input
              type="date"
              v-model="orderForm.chargeDate"
              :max="todayStr"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Display Rate summary -->
          <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-indigo-900 mt-2">
            <span>Procedure Rate:</span>
            <span>₹{{ orderForm.rate }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showOrderModal = false" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
            Cancel
          </button>
          <button
            @click="submitEndoscopyOrder"
            :disabled="orderSubmitting || !orderForm.chargeMasterId"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="orderSubmitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
