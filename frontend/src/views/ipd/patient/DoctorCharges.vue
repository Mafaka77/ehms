<script setup>
import { ref, onMounted, computed } from 'vue'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useDoctorStore } from '../../../stores/doctorStore'

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
const doctorStore = useDoctorStore()

const loading = ref(false)
const charges = ref([])
const chargeCategories = ref([])
const showAddModal = ref(false)
const submitting = ref(false)

const searchQuery = ref('')
const selectedDoctorFilter = ref('')

// Form state for logging a visit/round fee
const chargeForm = ref({
  doctorId: '',
  description: 'Consultation Round Visit',
  rate: 500,
  quantity: 1
})

const fetchCharges = async () => {
  loading.value = true
  const res = await admissionStore.fetchAdmissionCharges(props.admissionId)
  if (res.success) {
    charges.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

const fetchCategories = async () => {
  const res = await admissionStore.fetchChargeCategories()
  if (res.success) {
    chargeCategories.value = res.data
  }
}

onMounted(async () => {
  await fetchCharges()
  await fetchCategories()
  await doctorStore.fetchDoctors(1, 100)
})

// Flatten and compute all doctor charges (base charges + addon shares)
const doctorChargesList = computed(() => {
  const list = []
  charges.value.forEach(c => {
    // 1. Base charge has doctorId
    if (c.doctorId) {
      list.push({
        _id: c._id, // Parent charge ID
        id: c._id,
        type: 'Base Fee',
        date: c.createdAt,
        description: c.description,
        doctorName: c.doctorId.fullName || 'N/A',
        specialization: c.doctorId.specializationId?.name || 'General',
        rate: c.rate,
        quantity: c.quantity,
        amount: c.amount,
        isBilled: c.isBilled,
        isAddon: false
      })
    }
    // 2. Loop addons for doctorId shares
    if (c.addons && c.addons.length > 0) {
      c.addons.forEach(addon => {
        if (addon.doctorId) {
          list.push({
            _id: addon._id, // Addon ID
            id: c._id, // Parent charge ID (for deletion/editing reference)
            type: 'Addon Share',
            date: addon.createdAt || c.createdAt,
            description: `${addon.itemName} (under ${c.description})`,
            doctorName: addon.doctorId.fullName || addon.doctorId.name || 'Assistant Doctor',
            specialization: addon.doctorId.specializationId?.name || 'General',
            rate: addon.amount,
            quantity: 1,
            amount: addon.amount,
            isBilled: c.isBilled, // Inherited from parent charge status
            isAddon: true
          })
        }
      })
    }
  })
  return list
})

// Filters list of doctor charges based on search & doctor selection
const filteredDoctorCharges = computed(() => {
  let list = doctorChargesList.value
  if (selectedDoctorFilter.value) {
    list = list.filter(item => item.doctorName === selectedDoctorFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(item => 
      item.description.toLowerCase().includes(q) || 
      item.doctorName.toLowerCase().includes(q)
    )
  }
  return list
})

// KPI Calculations
const totalDoctorFees = computed(() => {
  return doctorChargesList.value.reduce((sum, item) => sum + item.amount, 0)
})

const draftDoctorFees = computed(() => {
  return doctorChargesList.value.filter(item => !item.isBilled).reduce((sum, item) => sum + item.amount, 0)
})

const billedDoctorFees = computed(() => {
  return doctorChargesList.value.filter(item => item.isBilled).reduce((sum, item) => sum + item.amount, 0)
})

// Unique doctors in charges list for filter dropdown
const chargeDoctors = computed(() => {
  const names = new Set()
  doctorChargesList.value.forEach(item => {
    if (item.doctorName) names.add(item.doctorName)
  })
  return Array.from(names)
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}

const openAddModal = () => {
  // Try to preselect the primary consultant doctor
  chargeForm.value = {
    doctorId: props.admission?.consultantDoctorId?._id || '',
    description: 'Consultant Visit Fee',
    rate: 500,
    quantity: 1
  }
  showAddModal.value = true
}

const submitCharge = async () => {
  if (!chargeForm.value.doctorId) {
    snackbarStore.show({ message: 'Doctor is required.', type: 'warning' })
    return
  }
  if (!chargeForm.value.description.trim()) {
    snackbarStore.show({ message: 'Description is required.', type: 'warning' })
    return
  }
  if (chargeForm.value.rate < 0) {
    snackbarStore.show({ message: 'Rate cannot be negative.', type: 'warning' })
    return
  }

  // Find the 'DOCTOR' or 'DOCTOR_VISIT' category ID
  const doctorCategory = chargeCategories.value.find(c => c.code === 'DOCTOR' || c.code === 'DOCTOR_VISIT')
  if (!doctorCategory) {
    snackbarStore.show({ message: 'Doctor Charge Category not found in master configuration.', type: 'error' })
    return
  }

  submitting.value = true
  
  const payload = {
    chargeCategoryId: doctorCategory._id,
    chargeMasterId: null, // Custom manually logged charge
    doctorId: chargeForm.value.doctorId,
    description: chargeForm.value.description.trim(),
    rate: Number(chargeForm.value.rate),
    quantity: Number(chargeForm.value.quantity),
    addons: []
  }

  const res = await admissionStore.addAdmissionCharge(props.admissionId, payload)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Doctor charge logged successfully', type: 'success' })
    showAddModal.value = false
    await fetchCharges()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submitting.value = false
}

const deleteCharge = async (item) => {
  if (item.isBilled) return
  if (item.isAddon) {
    snackbarStore.show({ message: 'This is an addon share. Delete the parent procedure under the Charges tab.', type: 'info' })
    return
  }
  if (!confirm(`Are you sure you want to delete the doctor fee for "${item.description}"?`)) {
    return
  }

  loading.value = true
  const res = await admissionStore.deleteAdmissionCharge(item.id)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge deleted successfully', type: 'success' })
    await fetchCharges()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- KPI Dashboard Banners -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Total Doctor Fees -->
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-slate-450 text-[11px] font-bold tracking-wider uppercase block">Total Doctor Fees</span>
          <span class="text-2xl font-extrabold text-slate-800 block">{{ formatCurrency(totalDoctorFees) }}</span>
          <span class="text-slate-400 text-xs block font-medium">Accumulated physician shares</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
      </div>

      <!-- Draft/Unbilled Fees -->
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-slate-450 text-[11px] font-bold tracking-wider uppercase block">Draft / Unbilled Fees</span>
          <span class="text-2xl font-extrabold text-amber-600 block">{{ formatCurrency(draftDoctorFees) }}</span>
          <span class="text-amber-500 text-xs block font-semibold">Pending final discharge bill</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>

      <!-- Billed/Locked Fees -->
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-slate-450 text-[11px] font-bold tracking-wider uppercase block">Billed / Locked Fees</span>
          <span class="text-2xl font-extrabold text-emerald-600 block">{{ formatCurrency(billedDoctorFees) }}</span>
          <span class="text-emerald-600 text-xs block font-semibold">Invoiced and locked</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
    </div>

    <!-- Active List -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Search & Filters Header -->
      <div class="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Doctor Shares & Round Fees</h3>
          <p class="text-xs text-slate-400 mt-0.5">Summary of doctor visits, surgery shares, and ward charges.</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <!-- Doctor Filter -->
          <select 
            v-model="selectedDoctorFilter"
            class="px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-150 transition-all font-medium"
          >
            <option value="">All Doctors</option>
            <option v-for="name in chargeDoctors" :key="name" :value="name">{{ name }}</option>
          </select>

          <!-- Search Input -->
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search description..." 
            class="px-3.5 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all bg-white font-medium" 
          />

          <!-- Log Charge Button -->
          <button 
            @click="openAddModal"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Doctor Fee
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-16 text-center text-slate-400">
        <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Fetching doctor charges...
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDoctorCharges.length === 0" class="py-16 text-center text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
        <p class="text-sm font-bold text-slate-600">No doctor charges found</p>
        <p class="text-xs text-slate-400 mt-1">No consultation fees or surgery shares matching filters have been recorded.</p>
      </div>

      <!-- Table view -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
              <th class="px-6 py-4">Time & Date</th>
              <th class="px-6 py-4">Doctor Name</th>
              <th class="px-6 py-4">Specialization</th>
              <th class="px-6 py-4">Description</th>
              <th class="px-6 py-4">Type</th>
              <th class="px-6 py-4 text-right">Amount</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-650">
            <tr v-for="item in filteredDoctorCharges" :key="item._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4 text-xs font-semibold text-slate-450">{{ formatDate(item.date) }}</td>
              <td class="px-6 py-4 font-bold text-slate-800 text-sm">Dr. {{ item.doctorName }}</td>
              <td class="px-6 py-4 text-xs font-semibold text-slate-500">{{ item.specialization }}</td>
              <td class="px-6 py-4 text-sm font-medium text-slate-700">{{ item.description }}</td>
              <td class="px-6 py-4">
                <span :class="['px-2 py-0.5 rounded text-[9px] font-bold border uppercase', 
                  item.isAddon ? 'bg-indigo-50/60 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200']">
                  {{ item.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-right font-extrabold text-slate-800 text-sm">
                {{ formatCurrency(item.amount) }}
                <span v-if="!item.isAddon && item.quantity > 1" class="block text-[9px] text-slate-400 font-semibold normal-case mt-0.5">
                  ({{ formatCurrency(item.rate) }} x {{ item.quantity }})
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="['px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border', 
                  item.isBilled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100']">
                  {{ item.isBilled ? 'Billed' : 'Draft' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Actions -->
                <button 
                  v-if="!item.isBilled && !item.isAddon"
                  @click="deleteCharge(item)"
                  class="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                  title="Delete doctor charge draft"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <span v-else class="text-[10px] text-slate-400 font-semibold">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Log Doctor Charge Modal -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity overflow-y-auto"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col my-8 animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Log Doctor Visit / Fee</h3>
            <p class="text-xs text-slate-400 mt-0.5">Bills consultant rounds, visit fees or special shares.</p>
          </div>
          <button 
            @click="showAddModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 space-y-4">
          <!-- Select Doctor -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Doctor</label>
            <select 
              v-model="chargeForm.doctorId"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            >
              <option value="">Select Doctor...</option>
              <option 
                v-for="doc in doctorStore.doctors" 
                :key="doc._id" 
                :value="doc._id"
              >
                Dr. {{ doc.fullName }} ({{ doc.specializationId?.name || 'General' }})
              </option>
            </select>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Description</label>
            <input 
              v-model="chargeForm.description"
              type="text"
              placeholder="e.g. Daily round fee, Consultation rounds"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Rate & Qty Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Fee (₹)</label>
              <input 
                v-model.number="chargeForm.rate"
                type="number"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs font-mono transition-all"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity / Visits</label>
              <input 
                v-model.number="chargeForm.quantity"
                type="number"
                min="1"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs font-mono transition-all"
              />
            </div>
          </div>

          <!-- Live Total -->
          <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Estimated Charge Total:</span>
            <span class="text-base text-indigo-600 font-mono">{{ formatCurrency(chargeForm.rate * chargeForm.quantity) }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button"
            @click="showAddModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitCharge"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Post Charge
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
