<script setup>
import { reactive, ref, watch, onMounted, computed } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import BaseInput from '../../../components/BaseInput.vue'
import SearchableSelect from '../../../components/SearchableSelect.vue'

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

const emit = defineEmits(['close', 'created', 'updated'])

const snackbarStore = useSnackbarStore()
const pharmacyStore = usePharmacyStore()

const form = reactive({
  medicineCode: '',
  medicineName: '',
  categoryId: '',
  supplierId: '',
  genericName: '',
  brandName: '',
  dosageForm: 'TABLET',
  strength: '',
  unit: 'TAB',
  reorderLevel: 10,
  manufacturer: '',
  remarks: '',
  isActive: true
})

const loading = ref(false)
const error = ref('')

// Compute options for SearchableSelect
const categoryOptions = computed(() => {
  return pharmacyStore.allCategories.map(c => ({
    value: c._id,
    label: c.name
  }))
})

const supplierOptions = computed(() => {
  return pharmacyStore.allSuppliers.map(s => ({
    value: s._id,
    label: `${s.supplierName} (${s.supplierCode || 'N/A'})`
  }))
})

// Reset/populate form on show
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.medicine) {
      form.medicineCode = props.medicine.medicineCode || ''
      form.medicineName = props.medicine.medicineName || ''
      form.categoryId = props.medicine.categoryId?._id || props.medicine.categoryId || ''
      form.supplierId = props.medicine.supplierId?._id || props.medicine.supplierId || ''
      form.genericName = props.medicine.genericName || ''
      form.brandName = props.medicine.brandName || ''
      form.dosageForm = props.medicine.dosageForm || 'TABLET'
      form.strength = props.medicine.strength || ''
      form.unit = props.medicine.unit || 'TAB'
      form.reorderLevel = props.medicine.reorderLevel || 10
      form.manufacturer = props.medicine.manufacturer || ''
      form.remarks = props.medicine.remarks || ''
      form.isActive = props.medicine.isActive !== undefined ? props.medicine.isActive : true
    } else {
      form.medicineCode = ''
      form.medicineName = ''
      form.categoryId = ''
      form.supplierId = ''
      form.genericName = ''
      form.brandName = ''
      form.dosageForm = 'TABLET'
      form.strength = ''
      form.unit = 'TAB'
      form.reorderLevel = 10
      form.manufacturer = ''
      form.remarks = ''
      form.isActive = true
    }
    error.value = ''
  }
})

onMounted(async () => {
  try {
    // Load categories and suppliers for selectors
    if (pharmacyStore.allCategories.length === 0) {
      await pharmacyStore.fetchAllCategories()
    }
    if (pharmacyStore.allSuppliers.length === 0) {
      await pharmacyStore.fetchAllSuppliers()
    }
  } catch (err) {
    console.error('Failed to load category/supplier options:', err)
  }
})

const handleClose = () => {
  if (loading.value) return
  emit('close')
}

const handleSubmit = async () => {
  // Auto-generation will handle medicineCode if empty
  if (!form.medicineName.trim()) {
    error.value = 'Medicine name is required'
    return
  }
  if (!form.categoryId) {
    error.value = 'Please select a category'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (props.medicine) {
      // Edit Mode
      const response = await pharmacyStore.updateMedicine(props.medicine._id, form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Medicine updated successfully!',
          type: 'success'
        })
        emit('updated', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to update medicine'
        snackbarStore.show({
          message: error.value,
          type: 'error'
        })
      }
    } else {
      // Create Mode
      const response = await pharmacyStore.createMedicine(form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Medicine registered successfully!',
          type: 'success'
        })
        emit('created', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to create medicine'
        snackbarStore.show({
          message: error.value,
          type: 'error'
        })
      }
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    snackbarStore.show({
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
        <!-- Backdrop -->
        <div @click="handleClose" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"></div>

        <!-- Modal Dialog Box -->
        <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ medicine ? 'Edit Medicine Details' : 'Add Medicine to Stock' }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage pharmaceutical items and stock metadata.</p>
            </div>
            <button 
              @click="handleClose" 
              class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body / Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <!-- Error message banner -->
            <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
              <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ error }}</span>
            </div>

            <!-- Row 1: Code and Name -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <BaseInput 
                v-model="form.medicineCode"
                id="medicineCode"
                label="Medicine Code (Leave blank to auto-generate)"
                placeholder="e.g. MED-PARA-500"
                :disabled="loading || !!medicine"
              />
              <BaseInput 
                v-model="form.medicineName"
                id="medicineName"
                label="Medicine Name"
                placeholder="e.g. Paracetamol"
                required
                :disabled="loading"
              />
            </div>

            <!-- Row 2: Brand Name and Generic Name -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <BaseInput 
                v-model="form.brandName"
                id="brandName"
                label="Brand Name"
                placeholder="e.g. Calpol"
                :disabled="loading"
              />
              <BaseInput 
                v-model="form.genericName"
                id="genericName"
                label="Generic Formula Name"
                placeholder="e.g. Acetaminophen"
                :disabled="loading"
              />
            </div>

            <!-- Row 3: Category and Preferred Supplier -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SearchableSelect
                v-model="form.categoryId"
                label="Category"
                :options="categoryOptions"
                placeholder="Search & select category"
                required
                :disabled="loading"
              />
              <SearchableSelect
                v-model="form.supplierId"
                label="Preferred Supplier"
                :options="supplierOptions"
                placeholder="Search & select supplier"
                :disabled="loading"
              />
            </div>

            <!-- Row 4: Dosage Form, Unit, Strength, Reorder Level -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div class="space-y-1.5">
                <label for="dosageForm" class="block text-sm font-semibold text-slate-700">Dosage Form</label>
                <select
                  v-model="form.dosageForm"
                  id="dosageForm"
                  :disabled="loading"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
                >
                  <option value="TABLET">Tablet</option>
                  <option value="CAPSULE">Capsule</option>
                  <option value="SYRUP">Syrup</option>
                  <option value="INJECTION">Injection</option>
                  <option value="DROPS">Drops</option>
                  <option value="CREAM">Cream</option>
                  <option value="OINTMENT">Ointment</option>
                  <option value="POWDER">Powder</option>
                  <option value="INHALER">Inhaler</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label for="unit" class="block text-sm font-semibold text-slate-700">Unit</label>
                <select
                  v-model="form.unit"
                  id="unit"
                  :disabled="loading"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
                >
                  <option value="TAB">TAB</option>
                  <option value="CAP">CAP</option>
                  <option value="BOTTLE">BOTTLE</option>
                  <option value="VIAL">VIAL</option>
                  <option value="AMP">AMP</option>
                  <option value="TUBE">TUBE</option>
                  <option value="PACK">PACK</option>
                  <option value="PCS">PCS</option>
                </select>
              </div>

              <BaseInput 
                v-model="form.strength"
                id="strength"
                label="Strength"
                placeholder="e.g. 500mg"
                :disabled="loading"
              />

              <BaseInput 
                v-model.number="form.reorderLevel"
                id="reorderLevel"
                label="Reorder Level"
                type="number"
                min="0"
                :disabled="loading"
              />
            </div>

            <!-- Row 5: Manufacturer and Remarks -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <BaseInput 
                v-model="form.manufacturer"
                id="manufacturer"
                label="Manufacturer"
                placeholder="e.g. Cipla Ltd."
                :disabled="loading"
              />
              <BaseInput 
                v-model="form.remarks"
                id="remarks"
                label="Remarks"
                placeholder="Any special storage instructions, etc."
                :disabled="loading"
              />
            </div>

            <!-- Checkbox: Is Active -->
            <div class="flex items-center gap-2 select-none pt-2">
              <input 
                id="isActive" 
                type="checkbox" 
                v-model="form.isActive" 
                :disabled="loading"
                class="w-4 h-4 text-teal-600 bg-slate-50 border-slate-200 rounded focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer"
              >
              <label for="isActive" class="text-sm font-semibold text-slate-700 cursor-pointer">Medicine is active for sales</label>
            </div>

            <!-- Actions Footer (Inside Form) -->
            <div class="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                @click="handleClose" 
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none"
                :disabled="loading"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-lg shadow-teal-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                :disabled="loading"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ loading ? 'Saving...' : (medicine ? 'Save Changes' : 'Register Medicine') }}</span>
              </button>
            </div>
          </form>

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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
