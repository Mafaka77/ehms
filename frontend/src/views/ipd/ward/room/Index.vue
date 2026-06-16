<script setup>
import { ref, onMounted, watch } from 'vue'
import { useIpdWardStore } from '../../../../stores/ipdWardStore'
import { useSnackbarStore } from '../../../../stores/snackbarStore'
import { useAuthStore } from '../../../../stores/authStore'
import BaseInput from '../../../../components/BaseInput.vue'

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
const searchQuery = ref('')
const showFormModal = ref(false)
const isEditMode = ref(ref(false))
const currentRoomId = ref(null)

const form = ref({
  roomNo: '',
  roomName: '',
  roomType: 'GENERAL',
  dailyRate: 0,
  isActive: true
})

const roomTypes = [
  'GENERAL',
  'SEMI_PRIVATE',
  'PRIVATE',
  'DELUXE',
  'ICU',
  'NICU',
  'PICU',
  'CCU'
]

const loadRooms = async () => {
  try {
    await ipdWardStore.fetchRooms(props.wardId, searchQuery.value)
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load rooms list.', type: 'error' })
  }
}

// Search debounce
let debounceTimer = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadRooms()
  }, 400)
})

watch(() => props.wardId, () => {
  loadRooms()
})

onMounted(async () => {
  await loadRooms()
})

const openCreateModal = () => {
  isEditMode.value = false
  currentRoomId.value = null
  form.value = {
    roomNo: '',
    roomName: '',
    roomType: 'GENERAL',
    dailyRate: 0,
    isActive: true
  }
  showFormModal.value = true
}

const openEditModal = (room) => {
  isEditMode.value = true
  currentRoomId.value = room._id
  form.value = {
    roomNo: room.roomNo,
    roomName: room.roomName || '',
    roomType: room.roomType,
    dailyRate: room.dailyRate,
    isActive: room.isActive !== undefined ? room.isActive : true
  }
  showFormModal.value = true
}

const handleFormSubmit = async () => {
  if (!form.value.roomNo || !form.value.roomType || form.value.dailyRate === undefined || form.value.dailyRate === null) {
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
      response = await ipdWardStore.updateRoom(currentRoomId.value, payload)
    } else {
      response = await ipdWardStore.createRoom(payload)
    }

    if (response.success) {
      snackbarStore.show({
        message: response.message || `Room ${isEditMode.value ? 'updated' : 'created'} successfully!`,
        type: 'success'
      })
      showFormModal.value = false
      await loadRooms()
      // Let the parent view know to reload stats
      emit('rooms-changed')
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while saving the room details.', type: 'error' })
  }
}

const handleDelete = async (room) => {
  if (!confirm(`Are you sure you want to delete Room: ${room.roomNo}? This will fail if there are registered beds.`)) return
  try {
    const res = await ipdWardStore.deleteRoom(room._id)
    if (res.success) {
      snackbarStore.show({ message: 'Room deleted successfully.', type: 'success' })
      await loadRooms()
      emit('rooms-changed')
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to delete room.', type: 'error' })
  }
}

const getRoomTypeClass = (type) => {
  switch (type) {
    case 'ICU':
    case 'NICU':
    case 'PICU':
    case 'CCU':
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

const emit = defineEmits(['rooms-changed'])
</script>

<template>
  <div class="space-y-6">
    <!-- Action panel -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search rooms..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
        />
      </div>

      <button 
        v-if="authStore.hasPermission('ipd.view')"
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 transform active:scale-95 self-end sm:self-auto"
      >
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Room
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
        <span class="text-xs font-medium">Loading rooms...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="ipdWardStore.rooms.length === 0" class="p-12 text-center text-slate-500">
        <svg class="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-slate-600 font-semibold text-sm">No Rooms Found</p>
        <p class="text-slate-400 text-xs mt-1">Add rooms to this ward to assign beds.</p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Room No / Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Type</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider">Daily Rate</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider text-center">Status</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-3.5 tracking-wider text-center" v-if="authStore.hasPermission('ipd.view')">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="room in ipdWardStore.rooms" :key="room._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {{ room.roomNo }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 text-sm block">{{ room.roomName || 'Room ' + room.roomNo }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3.5">
                <span :class="['px-2 py-0.5 text-[10px] font-bold rounded uppercase border', getRoomTypeClass(room.roomType)]">
                  {{ room.roomType.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-sm font-semibold text-slate-600">
                ₹{{ room.dailyRate.toFixed(2) }}
              </td>
              <td class="px-6 py-3.5 text-center">
                <span 
                  :class="[
                    'px-2 py-0.5 text-[10px] font-bold uppercase rounded-full inline-block',
                    room.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'
                  ]"
                >
                  {{ room.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-center" v-if="authStore.hasPermission('ipd.view')">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(room)"
                    class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2 rounded-lg border border-indigo-100/30 transition-all"
                    title="Edit Room"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button 
                    @click="handleDelete(room)"
                    class="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    title="Delete Room"
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

    <!-- Room Form Modal -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          @click="showFormModal = false"
          class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <h3 class="text-lg font-bold text-slate-900 mb-1">{{ isEditMode ? 'Edit' : 'Add' }} Room</h3>
        <p class="text-xs text-slate-400 mb-5">Configure room identifiers and daily hospital pricing rates.</p>

        <form @submit.prevent="handleFormSubmit" class="space-y-4">
          <BaseInput 
            v-model="form.roomNo"
            id="roomNo"
            label="Room Number"
            placeholder="e.g. 101-A"
            required
          />

          <BaseInput 
            v-model="form.roomName"
            id="roomName"
            label="Room Name / Label"
            placeholder="e.g. Deluxe Room A"
          />

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Room Type <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select 
                  v-model="form.roomType"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none text-slate-700 shadow-sm font-semibold"
                  required
                >
                  <option v-for="type in roomTypes" :key="type" :value="type">
                    {{ type.replace('_', ' ') }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <BaseInput 
              v-model="form.dailyRate"
              id="dailyRate"
              label="Daily Rate (₹)"
              type="number"
              placeholder="e.g. 1500"
              required
            />
          </div>

          <!-- Active checkbox -->
          <div class="flex items-center gap-3 py-1 select-none">
            <input 
              type="checkbox" 
              id="roomIsActive"
              v-model="form.isActive"
              class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label for="roomIsActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Room is active and available</label>
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
              Save Room
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
