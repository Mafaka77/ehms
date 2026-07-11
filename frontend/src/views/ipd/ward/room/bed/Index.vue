<script setup>
import { ref, onMounted, watch } from 'vue'
import { useIpdWardStore } from '../../../../../stores/ipdWardStore'
import { useSnackbarStore } from '../../../../../stores/snackbarStore'
import { useAuthStore } from '../../../../../stores/authStore'
import BaseInput from '../../../../../components/BaseInput.vue'

const props = defineProps({
  wardId: {
    type: String,
    required: true
  }
})

const ipdWardStore = useIpdWardStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

// State
const selectedStatusFilter = ref('')
const showFormModal = ref(false)
const isEditMode = ref(false)
const currentBedId = ref(null)

const form = ref({
  bedNo: '',
  bedType: 'GENERAL',
  dailyRate: 0,
  status: 'AVAILABLE',
  floor: '',
  isActive: true
})

const bedTypes = [
      'GENERAL',
      'ICU',
      'VENTILATOR',
      'DELUXE',
      'SEMI_PRIVATE',
      'PRIVATE',
      'SUPER DELUXE',
      'NICU',
      'HDU'
]

const bedStatuses = [
  'AVAILABLE',
  'OCCUPIED',
  'MAINTENANCE',
  'RESERVED'
]

const loadBedsData = async () => {
  try {
    await ipdWardStore.fetchBeds(props.wardId, selectedStatusFilter.value)
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load beds data.', type: 'error' })
  }
}

watch(selectedStatusFilter, () => {
  loadBedsData()
})

watch(() => props.wardId, () => {
  selectedStatusFilter.value = ''
  loadBedsData()
})

onMounted(async () => {
  await loadBedsData()
})

const openCreateModal = () => {
  isEditMode.value = false
  currentBedId.value = null
  form.value = {
    bedNo: '',
    bedType: 'GENERAL',
    dailyRate: 0,
    status: 'AVAILABLE',
    floor: ipdWardStore.currentWard?.floor || '',
    isActive: true
  }
  showFormModal.value = true
}

const openEditModal = (bed) => {
  isEditMode.value = true
  currentBedId.value = bed._id
  form.value = {
    bedNo: bed.bedNo,
    bedType: bed.bedType,
    dailyRate: bed.dailyRate,
    status: bed.status,
    floor: bed.floor || '',
    isActive: bed.isActive !== undefined ? bed.isActive : true
  }
  showFormModal.value = true
}

const handleFormSubmit = async () => {
  if (!form.value.bedNo || !form.value.bedType || form.value.dailyRate === undefined || form.value.dailyRate === null) {
    snackbarStore.show({ message: 'Please fill in all required fields.', type: 'warning' })
    return
  }

  if (form.value.dailyRate < 0) {
    snackbarStore.show({ message: 'Daily rate cannot be negative.', type: 'warning' })
    return
  }

  try {
    let response
    const payload = {
      ...form.value,
      wardId: props.wardId,
      dailyRate: Number(form.value.dailyRate)
    }

    if (isEditMode.value) {
      response = await ipdWardStore.updateBed(currentBedId.value, payload)
    } else {
      response = await ipdWardStore.createBed(payload)
    }

    if (response.success) {
      snackbarStore.show({
        message: response.message || `Bed ${isEditMode.value ? 'updated' : 'created'} successfully!`,
        type: 'success'
      })
      showFormModal.value = false
      await loadBedsData()
      emit('beds-changed')
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while saving the bed details.', type: 'error' })
  }
}

const handleDelete = async (bed) => {
  if (!confirm(`Are you sure you want to delete Bed: ${bed.bedNo}?`)) return
  try {
    const res = await ipdWardStore.deleteBed(bed._id)
    if (res.success) {
      snackbarStore.show({ message: 'Bed deleted successfully.', type: 'success' })
      await loadBedsData()
      emit('beds-changed')
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to delete bed.', type: 'error' })
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'OCCUPIED':
      return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'MAINTENANCE':
      return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'RESERVED':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200'
  }
}

const getBedTypeClass = (type) => {
  switch (type) {
    case 'ICU':
    case 'VENTILATOR':
      return 'bg-red-50 text-red-700 border-red-100'
    case 'DELUXE':
    case 'PRIVATE':
      return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'SEMI_PRIVATE':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }
}

const emit = defineEmits(['beds-changed'])
</script>

<template>
  <div class="space-y-6">
    <!-- Filter options -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <!-- Status Selector -->
        <div class="relative w-full sm:w-48">
          <select 
            v-model="selectedStatusFilter"
            class="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none text-slate-700 font-medium shadow-sm"
          >
            <option value="">All Statuses</option>
            <option v-for="status in bedStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <button 
        v-if="authStore.hasPermission('ipd.view')"
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 transform active:scale-95 self-end sm:self-auto"
      >
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Bed
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <!-- Loading State -->
      <div v-if="ipdWardStore.loading" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-xs font-medium">Loading beds...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="ipdWardStore.beds.length === 0" class="p-12 text-center text-slate-500">
        <svg class="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-600 font-semibold text-sm">No Beds Found</p>
        <p class="text-slate-400 text-xs mt-1">
          Add beds to start tracking patient admissions.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Bed No</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Bed Type</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Daily Rate</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Floor</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider text-center">Station</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider text-center" v-if="authStore.hasPermission('ipd.view')">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="bed in ipdWardStore.beds" :key="bed._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-3.5 font-bold text-slate-800 text-sm">
                {{ bed.bedNo }}
              </td>
              <td class="px-6 py-3.5">
                <span :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase border', getBedTypeClass(bed.bedType)]">
                  {{ bed.bedType }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-sm font-semibold text-slate-600">
                ₹{{ bed.dailyRate.toFixed(2) }}
              </td>
              <td class="px-6 py-3.5 text-sm font-semibold text-slate-600">
                {{ bed.floor || bed.wardId?.floor || '-' }}
              </td>
              <td class="px-6 py-3.5 text-center">
                <span v-if="bed.nursingStationId" class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold border border-indigo-100/50">
                  {{ bed.nursingStationId.code }}
                </span>
                <span v-else class="text-slate-400 italic text-xs">Unassigned</span>
              </td>
              <td class="px-6 py-3.5 text-center">
                <span :class="['px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border inline-block', getStatusClass(bed.status)]">
                  {{ bed.status }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-center" v-if="authStore.hasPermission('ipd.view')">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(bed)"
                    class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2 rounded-lg border border-indigo-100/30 transition-all"
                    title="Edit Bed"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button 
                    @click="handleDelete(bed)"
                    class="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete Bed"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bed Form Modal -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          @click="showFormModal = false"
          class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h3 class="text-lg font-bold text-slate-900 mb-1">{{ isEditMode ? 'Edit' : 'Add' }} Bed</h3>
        <p class="text-xs text-slate-400 mb-5">Assign bed identifiers, types, status tracking, and billing rates.</p>

        <form @submit.prevent="handleFormSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput 
              v-model="form.bedNo"
              id="bedNo"
              label="Bed Number / Code"
              placeholder="e.g. Bed-1"
              required
            />
            <BaseInput 
              v-model="form.floor"
              id="floor"
              label="Floor"
              placeholder="e.g. 1st Floor"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Bed Type -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Bed Type <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select 
                  v-model="form.bedType"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none text-slate-700 shadow-sm font-semibold"
                  required
                >
                  <option v-for="type in bedTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <!-- Daily Rate -->
            <BaseInput 
              v-model="form.dailyRate"
              id="bedDailyRate"
              label="Daily Rate (₹) *"
              type="number"
              placeholder="e.g. 1500"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Bed Status -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Bed Status <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select 
                  v-model="form.status"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none text-slate-700 shadow-sm font-semibold"
                  required
                >
                  <option v-for="status in bedStatuses" :key="status" :value="status">
                    {{ status }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <!-- Active check -->
            <div class="flex items-center gap-3 select-none pt-6">
              <input 
                type="checkbox" 
                id="bedIsActive"
                v-model="form.isActive"
                class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label for="bedIsActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Active</label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              @click="showFormModal = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
            >
              Save Bed
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
