<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIpdWardStore } from '../../../stores/ipdWardStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useAuthStore } from '../../../stores/authStore'
import BaseInput from '../../../components/BaseInput.vue'

const router = useRouter()
const ipdWardStore = useIpdWardStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

// State variables
const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(10)

// Modal controls
const showFormModal = ref(false)
const isEditMode = ref(false)
const currentWardId = ref(null)

// Form state
const form = ref({
  code: '',
  name: '',
  wardType: 'GENERAL',
  floor: '',
  description: '',
  isActive: true
})

const wardTypes = [
  'GENERAL',
  'CABIN',
  'HDU',
  'SUPER DELUXE',
  'ICU',
  'NICU',
  'PICU',
  'CCU',
  'EMERGENCY',
  'DELUXE',
  'OPERATION THEATER',
  'MINOR THEATER',
  'SPECIAL WARD',
  'AYUSH',
  'DIALYSIS',
  'CARDIAC WARD',
  'PALLIATIVE CARE WARD',
  'AYURVEDIC WARD',
  'ISOLATION WARD',
  'OPD',
  'PHYSIOTHERAPY',
]

// Load Wards list
const loadWards = async () => {
  try {
    await ipdWardStore.fetchWards(currentPage.value, limit.value, searchQuery.value)
  } catch (err) {
    console.error(err)
  }
}

// Watch filters
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadWards()
  }, 400)
})

watch([currentPage, limit], () => {
  loadWards()
})

onMounted(async () => {
  await loadWards()
})

// Action handlers
const openCreateModal = () => {
  isEditMode.value = false
  currentWardId.value = null
  form.value = {
    code: '',
    name: '',
    wardType: 'GENERAL',
    floor: '',
    description: '',
    isActive: true
  }
  showFormModal.value = true
}

const openEditModal = (ward) => {
  isEditMode.value = true
  currentWardId.value = ward._id
  form.value = {
    code: ward.code,
    name: ward.name,
    wardType: ward.wardType,
    floor: ward.floor || '',
    description: ward.description || '',
    isActive: ward.isActive !== undefined ? ward.isActive : true
  }
  showFormModal.value = true
}

const viewDetails = (ward) => {
  router.push(`/ipd/ward/view/${ward._id}`)
}

const handleFormSubmit = async () => {
  if (!form.value.code || !form.value.name || !form.value.wardType) {
    snackbarStore.show({ message: 'Please fill in all required fields.', type: 'warning' })
    return
  }

  try {
    let response
    if (isEditMode.value) {
      response = await ipdWardStore.updateWard(currentWardId.value, form.value)
    } else {
      response = await ipdWardStore.createWard(form.value)
    }

    if (response.success) {
      snackbarStore.show({
        message: response.message || `Ward ${isEditMode.value ? 'updated' : 'created'} successfully!`,
        type: 'success'
      })
      showFormModal.value = false
      await loadWards()
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while saving the ward details.', type: 'error' })
  }
}

const handleDelete = async (ward) => {
  if (!confirm(`Are you sure you want to delete Ward: ${ward.name}? This will fail if there are active rooms.`)) return
  try {
    const res = await ipdWardStore.deleteWard(ward._id)
    if (res.success) {
      snackbarStore.show({ message: 'Ward deleted successfully.', type: 'success' })
      await loadWards()
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to delete ward.', type: 'error' })
  }
}

const getWardTypeClass = (type) => {
  switch (type) {
    case 'ICU':
    case 'NICU':
    case 'PICU':
    case 'CCU':
      return 'bg-red-50 text-red-700 border-red-100'
    case 'DELUXE':
    case 'PRIVATE':
      return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'EMERGENCY':
      return 'bg-amber-50 text-amber-700 border-amber-100'
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header Area -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Ward Management</h1>
        <p class="text-slate-500 mt-1 text-sm">Configure hospital wards, layouts, room allocations, and bed settings.</p>
      </div>
      <button 
        v-if="authStore.hasPermission('ipd.view')"
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 transform active:scale-95"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Ward
      </button>
    </div>

    <!-- Main Table Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search Panel -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">Wards Directory</h2>
          
          <!-- Search box -->
          <div class="relative w-full sm:w-80">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by code, name, type..." 
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="ipdWardStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading wards...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="ipdWardStore.wards.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No Wards Registered</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          Add a new ward to configure floors, rooms, and beds.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Ward Details</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Ward Type</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Floor Placement</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider">Description</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="ward in ipdWardStore.wards" 
              :key="ward._id"
              class="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              @click="viewDetails(ward)"
            >
              <td class="px-6 py-4.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {{ ward.code }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 text-sm block">{{ ward.name }}</span>
                    <span class="text-slate-400 text-[11px] font-medium block mt-0.5">ID: {{ ward._id.slice(-6) }}</span>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4.5">
                <span 
                  :class="[
                    'px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase border',
                    getWardTypeClass(ward.wardType)
                  ]"
                >
                  {{ ward.wardType.replace('_', ' ') }}
                </span>
              </td>

              <td class="px-6 py-4.5 text-sm text-slate-600 font-semibold">
                {{ ward.floor || 'Not Assigned' }}
              </td>

              <td class="px-6 py-4.5 text-sm text-slate-500 max-w-xs truncate">
                {{ ward.description || '-' }}
              </td>

              <td class="px-6 py-4.5 text-center">
                <span 
                  :class="[
                    'px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full inline-block',
                    ward.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                  ]"
                >
                  {{ ward.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td class="px-6 py-4.5 text-center" @click.stop>
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="viewDetails(ward)"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all"
                    title="View Ward Layout (Rooms & Beds)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('ipd.view')"
                    @click="openEditModal(ward)"
                    class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2 rounded-xl border border-indigo-100/30 transition-all"
                    title="Edit Ward Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('ipd.view')"
                    @click="handleDelete(ward)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete Ward"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Block -->
      <div v-if="ipdWardStore.pagination.pages > 1" class="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-medium">
          Showing page {{ currentPage }} of {{ ipdWardStore.pagination.pages }}
        </span>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button 
            @click="currentPage++"
            :disabled="currentPage === ipdWardStore.pagination.pages"
            class="p-2 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Ward Create / Edit Modal -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          @click="showFormModal = false"
          class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h3 class="text-xl font-bold text-slate-900 mb-2">{{ isEditMode ? 'Edit' : 'Add' }} Hospital Ward</h3>
        <p class="text-xs text-slate-400 mb-6">Enter ward identifiers and location mappings details.</p>

        <form @submit.prevent="handleFormSubmit" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <BaseInput 
              v-model="form.code"
              id="code"
              label="Ward Code"
              placeholder="e.g. ICU-W"
              required
              :disabled="isEditMode"
            />
            <BaseInput 
              v-model="form.name"
              id="name"
              label="Ward Name"
              placeholder="e.g. Intensive Care Ward"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Ward Type Select -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Ward Type <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select 
                  v-model="form.wardType"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none text-slate-700 shadow-sm font-semibold"
                  required
                >
                  <option v-for="type in wardTypes" :key="type" :value="type">
                    {{ type.replace('_', ' ') }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <BaseInput 
              v-model="form.floor"
              id="floor"
              label="Floor Placement"
              placeholder="e.g. 1st Floor, Block B"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Ward Description / Notes</label>
            <textarea 
              v-model="form.description"
              rows="3"
              placeholder="Additional comments or descriptions regarding ward features..."
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 shadow-sm transition-all"
            ></textarea>
          </div>

          <!-- Active toggle -->
          <div class="flex items-center gap-3 py-2 select-none">
            <input 
              type="checkbox" 
              id="isActive"
              v-model="form.isActive"
              class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
            />
            <label for="isActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Ward is active and accepting admissions</label>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              @click="showFormModal = false"
              class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center gap-2"
            >
              Save Ward
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
