<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNursingStore } from '../../../stores/nursingStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'
import SearchableSelect from '../../../components/SearchableSelect.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const nursingStore = useNursingStore()
const snackbarStore = useSnackbarStore()

const allBeds = ref([])
const nurses = ref([])

const form = ref({
  code: '',
  name: '',
  wardId: '',
  inchargeNurseId: '',
  location: '',
  contactNo: '',
  description: '',
  bedIds: [],
  isActive: true
})

const bedsGroupedByWard = computed(() => {
  const groups = {}
  allBeds.value.forEach(bed => {
    const wardName = bed.wardId?.name || 'Unknown Ward'
    const wardCode = bed.wardId?.code || ''
    const groupKey = bed.wardId?._id || 'unknown'
    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        name: wardName,
        code: wardCode,
        beds: []
      }
    }
    groups[groupKey].beds.push(bed)
  })
  return Object.values(groups)
})

const isWardAllSelected = (group) => {
  if (!group.beds || group.beds.length === 0) return false
  return group.beds.every(bed => form.value.bedIds.includes(bed._id))
}

const toggleWardSelection = (group) => {
  const allSelected = isWardAllSelected(group)
  const bedIdsInGroup = group.beds.map(b => b._id)
  
  if (allSelected) {
    form.value.bedIds = form.value.bedIds.filter(id => !bedIdsInGroup.includes(id))
  } else {
    const otherBedIds = form.value.bedIds.filter(id => !bedIdsInGroup.includes(id))
    form.value.bedIds = [...otherBedIds, ...bedIdsInGroup]
  }
}

const wardOptions = computed(() => {
  return (nursingStore.wards || []).map(ward => ({
    value: ward._id,
    label: `${ward.name} (${ward.code})`
  }))
})

const nurseOptions = computed(() => {
  return (nurses.value || []).map(nurse => ({
    value: nurse._id,
    label: `${nurse.fullName} (${nurse.email})`
  }))
})

const loadMasterData = async () => {
  try {
    await nursingStore.fetchWards()
    nurses.value = await nursingStore.fetchNurses()
    allBeds.value = await nursingStore.fetchAllBeds()
    
    const station = await nursingStore.getNursingStationById(props.id)
    if (station) {
      form.value = {
        code: station.code,
        name: station.name,
        wardId: station.wardId?._id || station.wardId || '',
        inchargeNurseId: station.inchargeNurseId?._id || station.inchargeNurseId || '',
        location: station.location || '',
        contactNo: station.contactNo || '',
        description: station.description || '',
        bedIds: (station.assignedBeds || []).map(b => b._id || b),
        isActive: station.isActive !== undefined ? station.isActive : true
      }
    }
  } catch (err) {
    console.error('Failed to load station details', err)
  }
}

onMounted(() => {
  loadMasterData()
})

const handleFormSubmit = async () => {
  if (!form.value.name) {
    snackbarStore.show({ message: 'Please enter a nursing station name.', type: 'warning' })
    return
  }

  try {
    const response = await nursingStore.updateNursingStation(props.id, form.value)
    if (response.success) {
      snackbarStore.show({
        message: 'Nursing Station updated successfully!',
        type: 'success'
      })
      router.push({ name: 'nursing-station' })
    } else {
      snackbarStore.show({ message: response.message, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while saving the station details.', type: 'error' })
  }
}
</script>

<template>
  <div class="space-y-8 pb-12 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-5">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Edit Nursing Station</h1>
        <p class="text-slate-500 mt-1 text-sm">Update nursing station credentials and physical bed monitoring configurations.</p>
      </div>
      <button 
        @click="router.push({ name: 'nursing-station' })"
        class="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-all"
      >
        Cancel
      </button>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleFormSubmit" class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <BaseInput 
          v-model="form.code"
          id="code"
          label="Station Code"
          placeholder="Auto-generated"
          required
          disabled
        />
        <BaseInput 
          v-model="form.name"
          id="name"
          label="Station Name"
          placeholder="e.g. North Wing Station"
          required
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <!-- Ward Selection -->
        <SearchableSelect 
          v-model="form.wardId"
          :options="wardOptions"
          label="Primary Ward (Optional)"
          placeholder="Select Primary Ward"
        />

        <!-- Incharge Nurse Selection -->
        <SearchableSelect
          v-model="form.inchargeNurseId"
          :options="nurseOptions"
          label="In-Charge Nurse"
          placeholder="Select Nurse"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <BaseInput 
          v-model="form.location"
          id="location"
          label="Location / Floor"
          placeholder="e.g. 2nd Floor, Room 204"
        />
        <BaseInput 
          v-model="form.contactNo"
          id="contactNo"
          label="Contact Number"
          placeholder="e.g. Extension 4321"
        />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description / Notes</label>
        <textarea 
          v-model="form.description"
          rows="3"
          placeholder="Additional comments or descriptions regarding station capabilities..."
          class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 shadow-sm transition-all"
        ></textarea>
      </div>

      <!-- Bed Assignment Checklist -->
      <div class="border border-slate-100 p-6 rounded-2xl bg-slate-50/20 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Monitor Bed Assignment</label>
          <p class="text-slate-400 text-xs mt-0.5">Assign specific physical beds to be monitored by this nursing station.</p>
        </div>
        
        <div class="max-h-80 overflow-y-auto space-y-4 pr-2 border border-slate-200/50 rounded-2xl p-4 bg-white shadow-inner">
          <div v-for="group in bedsGroupedByWard" :key="group.id" class="space-y-2">
            <div class="flex items-center justify-between bg-slate-50 border border-slate-100/60 px-3 py-1.5 rounded-xl">
              <span class="text-[10px] font-bold text-indigo-600 block uppercase">
                {{ group.name }} ({{ group.code || 'No Code' }})
              </span>
              <button 
                type="button"
                @click="toggleWardSelection(group)"
                class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 select-none"
              >
                <svg v-if="isWardAllSelected(group)" class="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"/></svg>
                <span>{{ isWardAllSelected(group) ? 'Deselect All' : 'Select All' }}</span>
              </button>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div 
                v-for="bed in group.beds" 
                :key="bed._id"
                class="flex items-center gap-2 px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:border-indigo-500/30 transition-all"
              >
                <input 
                  type="checkbox"
                  :id="`bed-${bed._id}`"
                  :value="bed._id"
                  v-model="form.bedIds"
                  class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label :for="`bed-${bed._id}`" class="text-xs font-semibold text-slate-700 cursor-pointer select-none flex flex-col">
                  <span class="flex items-center gap-1">
                    {{ bed.bedNo }}
                    <span v-if="bed.floor || bed.wardId?.floor" class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                      {{ bed.floor || bed.wardId?.floor }}
                    </span>
                  </span>
                  <span 
                    v-if="bed.nursingStationId && bed.nursingStationId._id !== id" 
                    class="text-[9px] text-rose-500 font-normal leading-tight mt-0.5"
                  >
                    NS: {{ bed.nursingStationId.code }}
                  </span>
                  <span 
                    v-else-if="bed.nursingStationId && bed.nursingStationId._id === id" 
                    class="text-[9px] text-indigo-600 font-normal leading-tight mt-0.5"
                  >
                    (Assigned)
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div v-if="bedsGroupedByWard.length === 0" class="text-slate-400 text-xs italic text-center py-4">
            No active physical beds registered. Add beds under Ward setup first.
          </div>
        </div>
      </div>

      <!-- Active toggle -->
      <div class="flex items-center gap-3 py-2 select-none">
        <input 
          type="checkbox" 
          id="isActive"
          v-model="form.isActive"
          class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
        <label for="isActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Nursing Station is active and operational</label>
      </div>

      <div class="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <button 
          type="button"
          @click="router.push({ name: 'nursing-station' })"
          class="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center gap-2"
        >
          Save Details
        </button>
      </div>
    </form>
  </div>
</template>
