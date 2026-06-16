<script setup>
import { ref, reactive, watch } from 'vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  medicine: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()

const batches = ref([])
const loading = ref(false)
const subloading = ref(false)
const isFormOpen = ref(false)
const editingBatch = ref(null)

const form = reactive({
  batchNo: '',
  expiryDate: '',
  purchaseRate: 0,
  saleRate: 0,
  currentStock: 0,
  isActive: true
})

const fetchBatches = async () => {
  if (!props.medicine) return
  loading.value = true
  try {
    batches.value = await pharmacyStore.fetchBatches(props.medicine._id)
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load batches', type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchBatches()
    resetForm()
    isFormOpen.value = false
    editingBatch.value = null
  }
})

const resetForm = () => {
  form.batchNo = ''
  form.expiryDate = ''
  form.purchaseRate = 0
  form.saleRate = 0
  form.currentStock = 0
  form.isActive = true
}

const openAddForm = () => {
  resetForm()
  editingBatch.value = null
  isFormOpen.value = true
}

const openEditForm = (batch) => {
  editingBatch.value = batch
  form.batchNo = batch.batchNo || ''
  // Format Date to YYYY-MM-DD
  if (batch.expiryDate) {
    form.expiryDate = new Date(batch.expiryDate).toISOString().split('T')[0]
  } else {
    form.expiryDate = ''
  }
  form.purchaseRate = batch.purchaseRate || 0
  form.saleRate = batch.saleRate || 0
  form.currentStock = batch.currentStock || 0
  form.isActive = batch.isActive !== undefined ? batch.isActive : true
  isFormOpen.value = true
}

const handleCloseForm = () => {
  isFormOpen.value = false
  editingBatch.value = null
  resetForm()
}

const handleSaveBatch = async () => {
  if (!form.batchNo.trim()) {
    snackbarStore.show({ message: 'Batch number is required', type: 'error' })
    return
  }
  if (!form.expiryDate) {
    snackbarStore.show({ message: 'Expiry date is required', type: 'error' })
    return
  }
  if (form.saleRate <= 0) {
    snackbarStore.show({ message: 'Sale rate must be greater than zero', type: 'error' })
    return
  }

  subloading.value = true
  try {
    const payload = {
      ...form,
      medicineId: props.medicine._id
    }

    if (editingBatch.value) {
      // Edit mode
      const res = await pharmacyStore.updateBatch(editingBatch.value._id, payload)
      if (res.success) {
        snackbarStore.show({ message: res.message, type: 'success' })
        fetchBatches()
        handleCloseForm()
      } else {
        snackbarStore.show({ message: res.message, type: 'error' })
      }
    } else {
      // Create mode
      const res = await pharmacyStore.createBatch(payload)
      if (res.success) {
        snackbarStore.show({ message: res.message, type: 'success' })
        fetchBatches()
        handleCloseForm()
      } else {
        snackbarStore.show({ message: res.message, type: 'error' })
      }
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while saving the batch', type: 'error' })
  } finally {
    subloading.value = false
  }
}

const handleDeleteBatch = async (batch) => {
  if (confirm(`Are you sure you want to delete batch "${batch.batchNo}"?`)) {
    try {
      const res = await pharmacyStore.deleteBatch(batch._id)
      if (res.success) {
        snackbarStore.show({ message: res.message, type: 'success' })
        fetchBatches()
      } else {
        snackbarStore.show({ message: res.message, type: 'error' })
      }
    } catch (err) {
      console.error(err)
      snackbarStore.show({ message: 'Failed to delete batch', type: 'error' })
    }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const isExpired = (dateStr) => {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
        <!-- Backdrop -->
        <div @click="emit('close')" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"></div>

        <!-- Modal Dialog Box -->
        <div class="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Manage Medicine Batches</h3>
              <p class="text-xs text-teal-600 font-semibold mt-0.5">
                {{ medicine?.medicineName }} <span class="text-slate-400 font-normal">({{ medicine?.medicineCode }})</span>
              </p>
            </div>
            <button 
              @click="emit('close')" 
              class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <!-- Loading Indicator -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg class="animate-spin h-8 w-8 text-teal-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs font-semibold">Retrieving batches...</span>
            </div>

            <div v-else>
              <!-- Batch CRUD Form (conditional overlay or top-aligned block) -->
              <div v-if="isFormOpen" class="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 class="text-sm font-bold text-slate-800">{{ editingBatch ? 'Edit Batch' : 'Add New Batch' }}</h4>
                  <button @click="handleCloseForm" class="text-xs text-slate-500 hover:text-slate-700 font-semibold focus:outline-none">Cancel</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <BaseInput 
                    v-model="form.batchNo"
                    id="batchNo"
                    label="Batch Number *"
                    placeholder="e.g. B-0123"
                    required
                  />

                  <div class="space-y-1.5">
                    <label for="expiryDate" class="block text-sm font-semibold text-slate-700">Expiry Date *</label>
                    <input 
                      v-model="form.expiryDate"
                      id="expiryDate"
                      type="date"
                      required
                      class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-750 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
                    />
                  </div>

                  <BaseInput 
                    v-model.number="form.currentStock"
                    id="currentStock"
                    label="Current Stock"
                    type="number"
                    min="0"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BaseInput 
                    v-model.number="form.purchaseRate"
                    id="purchaseRate"
                    label="Purchase Rate (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                  />

                  <BaseInput 
                    v-model.number="form.saleRate"
                    id="saleRate"
                    label="Sale Rate (₹) *"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div class="flex items-center justify-between pt-2">
                  <div class="flex items-center gap-2 select-none">
                    <input 
                      id="batchIsActive" 
                      type="checkbox" 
                      v-model="form.isActive" 
                      class="w-4 h-4 text-teal-600 bg-white border-slate-200 rounded focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer"
                    >
                    <label for="batchIsActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Batch is active & available for billing</label>
                  </div>

                  <button 
                    @click="handleSaveBatch"
                    :disabled="subloading"
                    class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <svg v-if="subloading" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ subloading ? 'Saving...' : (editingBatch ? 'Save Changes' : 'Create Batch') }}</span>
                  </button>
                </div>
              </div>

              <!-- Top Panel / Action Buttons -->
              <div v-if="!isFormOpen" class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-bold text-slate-700">All Registered Batches</h4>
                <button 
                  @click="openAddForm"
                  class="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 shadow-md shadow-teal-50"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  New Batch
                </button>
              </div>

              <!-- Batches Directory Table -->
              <div v-if="!isFormOpen && batches.length > 0" class="overflow-x-auto border border-slate-100 rounded-xl max-h-80 overflow-y-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider">Batch No</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider">Expiry Date</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider">Purchase Price</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider">Sale Price</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider">Stock</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider text-center">Status</th>
                      <th class="text-slate-500 font-semibold text-xs uppercase px-4 py-3 tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="batch in batches" :key="batch._id" class="hover:bg-slate-50/40 transition-colors">
                      <td class="px-4 py-3 font-bold text-slate-800 text-xs font-mono">{{ batch.batchNo }}</td>
                      <td class="px-4 py-3 text-xs">
                        <span :class="isExpired(batch.expiryDate) ? 'text-rose-600 font-semibold' : 'text-slate-700'">
                          {{ formatDate(batch.expiryDate) }}
                        </span>
                        <span v-if="isExpired(batch.expiryDate)" class="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded ml-1 border border-rose-100 uppercase tracking-wide">
                          Expired
                        </span>
                      </td>
                      <td class="px-4 py-3 text-slate-700 text-xs font-medium">₹{{ batch.purchaseRate?.toFixed(2) || '0.00' }}</td>
                      <td class="px-4 py-3 text-teal-700 text-xs font-bold">₹{{ batch.saleRate?.toFixed(2) }}</td>
                      <td class="px-4 py-3 font-bold text-slate-800 text-xs">{{ batch.currentStock }}</td>
                      <td class="px-4 py-3 text-center">
                        <span v-if="!batch.isActive" class="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Inactive
                        </span>
                        <span v-else class="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button 
                            @click="openEditForm(batch)"
                            class="p-1.5 rounded-lg text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all focus:outline-none"
                            title="Edit Batch"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            @click="handleDeleteBatch(batch)"
                            class="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none"
                            title="Delete Batch"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty state inside batches -->
              <div v-else-if="!isFormOpen" class="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                <svg class="w-10 h-10 mx-auto text-slate-300 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-slate-650 font-bold text-xs">No batches registered yet</p>
                <p class="text-slate-400 text-[10px] mt-0.5">Click "New Batch" to record stock expiry, purchase & sale rates.</p>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              @click="emit('close')"
              class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .bg-slate-950\/60,
.modal-fade-leave-active .bg-slate-950\/60 {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15), opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .bg-slate-950\/60,
.modal-fade-leave-to .bg-slate-950\/60 {
  opacity: 0;
}

.modal-fade-enter-from .bg-white {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-fade-leave-to .bg-white {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
