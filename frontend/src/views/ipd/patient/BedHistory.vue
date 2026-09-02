<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'

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
const authStore = useAuthStore()

const loading = ref(false)
const history = ref([])
const postingId = ref(null)
const postingAll = ref(false)

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return roleName === 'SuperAdmin' || roleName === 'Super Admin'
})

const deletingId = ref(null)

const deleteHistoryItem = async (item) => {
  if (item.isCurrent) {
    snackbarStore.show({ message: 'Cannot delete active current bed allocation', type: 'warning' })
    return
  }
  if (!confirm(`Are you sure you want to delete the bed history record for Bed ${item.bedId?.bedNo || ''}? This action cannot be undone.`)) {
    return
  }

  deletingId.value = item._id
  const res = await admissionStore.deleteAdmissionBedHistory(item._id)
  deletingId.value = null

  if (res.success) {
    snackbarStore.show({ message: res.message || 'Bed history record deleted successfully', type: 'success' })
    await fetchBedHistory()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}


const showEditModal = ref(false)
const submitting = ref(false)
const editForm = ref({
  id: '',
  fromDate: '',
  toDate: '',
  totalDays: 0,
  transferReason: '',
  isCurrent: false
})

const fetchBedHistory = async () => {
  loading.value = true
  const res = await admissionStore.fetchAdmissionBedHistory(props.admissionId)
  if (res.success) {
    history.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return 'Active / Current'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateDays = (item) => {
  if (item.isCurrent) {
    const from = new Date(item.fromDate)
    const to = new Date()
    return Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)))
  }
  return item.totalDays || 1
}

const calculateAmount = (item) => {
  if (item.isCurrent) {
    return calculateDays(item) * item.dailyRate
  }
  return item.totalAmount || (item.totalDays * item.dailyRate)
}

const formatForInput = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const openEditModal = (item) => {
  editForm.value = {
    id: item._id,
    fromDate: formatForInput(item.fromDate),
    toDate: item.toDate ? formatForInput(item.toDate) : '',
    totalDays: item.totalDays || calculateDays(item),
    transferReason: item.transferReason || '',
    isCurrent: item.isCurrent
  }
  showEditModal.value = true
}

const submitEdit = async () => {
  submitting.value = true
  const res = await admissionStore.updateAdmissionBedHistory(editForm.value.id, {
    fromDate: editForm.value.fromDate ? new Date(editForm.value.fromDate) : undefined,
    toDate: editForm.value.isCurrent ? null : (editForm.value.toDate ? new Date(editForm.value.toDate) : null),
    totalDays: Number(editForm.value.totalDays),
    transferReason: editForm.value.transferReason
  })

  if (res.success) {
    snackbarStore.show({ message: res.message || 'Bed history updated successfully', type: 'success' })
    showEditModal.value = false
    await fetchBedHistory()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submitting.value = false
}

const postSingleCharge = async (item) => {
  postingId.value = item._id
  const res = await admissionStore.postAdmissionBedCharge(item._id)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Bed charge posted to Patient Charges successfully', type: 'success' })
    await fetchBedHistory()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  postingId.value = null
}

const postAllCharges = async () => {
  postingAll.value = true
  const res = await admissionStore.postAllAdmissionBedCharges(props.admissionId)
  if (res.success) {
    snackbarStore.show({ message: 'All bed charges synced to Patient Charges for final billing', type: 'success' })
    await fetchBedHistory()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  postingAll.value = false
}

onMounted(async () => {
  await fetchBedHistory()
})

watch(() => props.admission?.bedId?._id || props.admission?.bedId, async () => {
  await fetchBedHistory()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h3 class="font-bold text-slate-800 text-base">Bed & Ward Occupancy History</h3>
        <p class="text-xs text-slate-400">Chronological history of patient bed transfers, ward allocations, and rentals.</p>
      </div>
      <button 
        v-if="history.length > 0"
        @click="postAllCharges"
        :disabled="postingAll"
        class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <svg v-if="postingAll" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Sync All Bed Charges to Final Bill
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-slate-400">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Retrieving bed allocation history...
    </div>

    <!-- Empty State -->
    <div v-else-if="history.length === 0" class="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3 bg-slate-50/50">
      <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
        </svg>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-700">No allocation history recorded</h4>
        <p class="text-xs text-slate-400 mt-1">This patient does not have any recorded bed history.</p>
      </div>
    </div>

    <!-- Timeline Layout -->
    <div v-else class="relative border-l-2 border-indigo-100 pl-6 ml-4 space-y-6 py-2">
      <div 
        v-for="item in history" 
        :key="item._id"
        class="relative space-y-3"
      >
        <!-- Timeline node dot -->
        <div 
          class="absolute w-3.5 h-3.5 rounded-full border-2 border-white -left-[32px] top-1"
          :class="item.isCurrent ? 'bg-emerald-500 shadow-md shadow-emerald-200 animate-pulse' : 'bg-slate-400'"
        ></div>

        <!-- Allocation log card -->
        <div 
          class="p-5 border rounded-2xl bg-white shadow-sm max-w-4xl space-y-4 relative group"
          :class="item.isCurrent ? 'border-emerald-200 shadow-emerald-50/30' : 'border-slate-100'"
        >
          <!-- Action Buttons (top-right of card) -->
          <div class="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button 
              @click="openEditModal(item)"
              class="p-1.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/40 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
              title="Edit Bed Allocation details"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            <button 
              v-if="isSuperAdmin && !item.isCurrent"
              @click="deleteHistoryItem(item)"
              :disabled="deletingId === item._id"
              class="p-1.5 rounded-lg border border-rose-100 hover:border-rose-200 bg-rose-50/40 text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
              title="Delete Bed History Record (SuperAdmin only)"
            >
              <svg v-if="deletingId === item._id" class="animate-spin h-4 w-4 text-rose-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <!-- Title & Badges -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pr-8">
            <div>
              <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                Bed {{ item.bedId?.bedNo || 'N/A' }} 
                <span class="text-xs text-slate-400 font-semibold font-mono">({{ item.bedId?.bedType || 'General' }})</span>
                <span 
                  v-if="item.isCurrent" 
                  class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Bed
                </span>
                <span 
                  v-else-if="item.bedId?.status === 'RESERVED'" 
                  class="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Reserved
                </span>
              </h4>
              <p class="text-xs text-slate-500 font-medium mt-1">
                Ward: <strong class="text-slate-700">{{ item.wardId?.name || 'N/A' }}</strong>
              </p>
            </div>
            
            <div class="sm:text-right">
              <span class="text-xs font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Allocation Period</span>
              <span class="text-xs text-slate-655 font-mono font-medium">
                {{ formatDate(item.fromDate) }} → 
                <span :class="item.isCurrent ? 'text-emerald-600 font-bold' : 'text-slate-655'">
                  {{ formatDate(item.toDate) }}
                </span>
              </span>
            </div>
          </div>

          <!-- Billing Info Sub-grid -->
          <div class="grid grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Daily Bed Rate</span>
              <span class="font-bold text-slate-700 mt-0.5 block">₹{{ item.dailyRate }}/day</span>
            </div>
            <div>
              <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Total Days Spent</span>
              <span class="font-bold text-slate-700 mt-0.5 block">{{ calculateDays(item) }} Days</span>
            </div>
            <div>
              <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Accumulated Cost</span>
              <span class="font-extrabold text-indigo-600 mt-0.5 block">₹{{ calculateAmount(item).toLocaleString() }}</span>
            </div>
          </div>

          <!-- Patient Charge Integration Status & Action -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100/70 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Charge:</span>
              <span 
                v-if="item.postedCharge"
                class="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1"
                :class="item.postedCharge.isBilled ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Posted to Charges (₹{{ item.postedCharge.amount?.toLocaleString() }})
                <span v-if="item.postedCharge.isBilled" class="font-normal">(Billed)</span>
              </span>
              <span v-else class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                Not Posted to Final Bill Yet
              </span>
            </div>

            <button 
              v-if="!item.postedCharge || !item.postedCharge.isBilled"
              @click="postSingleCharge(item)"
              :disabled="postingId === item._id"
              class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:bg-indigo-200 border border-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <svg v-if="postingId === item._id" class="animate-spin h-3 w-3 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {{ item.postedCharge ? 'Update Posted Charge' : 'Add Charge to Final Bill' }}
            </button>
          </div>

          <!-- Transfer Reason -->
          <div v-if="item.transferReason" class="text-xs border-t border-slate-100 pt-3 flex gap-2">
            <span class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Reason:</span>
            <p class="text-slate-600 font-medium italic">
              {{ item.transferReason }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Bed History Modal -->
    <div 
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Title Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Edit Bed Allocation</h3>
            <p class="text-xs text-slate-400 mt-0.5">Modify timeline entries and durations for this bed rental.</p>
          </div>
          <button 
            @click="showEditModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <!-- From Date -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocation From Date</label>
            <input 
              type="datetime-local" 
              v-model="editForm.fromDate"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Current Bed Toggle & To Date -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <input 
                type="checkbox" 
                v-model="editForm.isCurrent" 
                id="isCurrentCheckbox"
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label for="isCurrentCheckbox" class="text-xs font-bold text-slate-500 uppercase tracking-wide select-none">Is Current Bed</label>
            </div>
            
            <div v-if="!editForm.isCurrent" class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocation To Date</label>
              <input 
                type="datetime-local" 
                v-model="editForm.toDate"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              />
            </div>
          </div>

          <!-- Total Days spent -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Days (Billed days)</label>
            <input 
              type="number" 
              v-model.number="editForm.totalDays"
              min="0"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Transfer Reason -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Transfer / Allocation Notes</label>
            <textarea 
              v-model="editForm.transferReason"
              rows="3"
              placeholder="Reason for transfer or allocation description..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            ></textarea>
          </div>
        </div>

        <!-- Modal Actions Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            @click="showEditModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitEdit"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
