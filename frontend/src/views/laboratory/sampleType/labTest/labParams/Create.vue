<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useSnackbarStore } from '../../../../../stores/snackbarStore'
import { useLabStore } from '../../../../../stores/labStore'
import BaseInput from '../../../../../components/BaseInput.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  param: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const snackbarStore = useSnackbarStore()
const labStore = useLabStore()

const form = reactive({
  testId: '',
  name: '',
  unit: '',
  normalRangeMale: '',
  normalRangeFemale: '',
  normalRangeChild: '',
  displayOrder: 0,
  referenceIntervals: []
})

const loading = ref(false)
const error = ref('')

// Reset form when modal is closed/opened
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.param && props.param._id) {
      // Edit Mode
      form.testId = props.param.testId?._id || props.param.testId || ''
      form.name = props.param.name || ''
      form.unit = props.param.unit || ''
      form.normalRangeMale = props.param.normalRangeMale || ''
      form.normalRangeFemale = props.param.normalRangeFemale || ''
      form.normalRangeChild = props.param.normalRangeChild || ''
      form.displayOrder = props.param.displayOrder || 0
      form.referenceIntervals = props.param.referenceIntervals 
        ? JSON.parse(JSON.stringify(props.param.referenceIntervals)) 
        : []
    } else {
      // Create Mode
      form.testId = props.param?.testId || ''
      form.name = ''
      form.unit = ''
      form.normalRangeMale = ''
      form.normalRangeFemale = ''
      form.normalRangeChild = ''
      form.displayOrder = 0
      form.referenceIntervals = []
    }
    error.value = ''
  }
})

const addReferenceInterval = () => {
  form.referenceIntervals.push({ label: '', range: '' })
}

const removeReferenceInterval = (index) => {
  form.referenceIntervals.splice(index, 1)
}

const handleClose = () => {
  if (loading.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (!form.name.trim()) {
    error.value = 'Parameter name is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (props.param && props.param._id) {
      // Edit Mode
      const response = await labStore.updateTestParameter(props.param._id, form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Parameter updated successfully!',
          type: 'success'
        })
        emit('updated', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to update parameter'
        snackbarStore.show({
          message: error.value,
          type: 'error'
        })
      }
    } else {
      // Create Mode
      const response = await labStore.createTestParameter(form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Parameter created successfully!',
          type: 'success'
        })
        emit('created', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to create parameter'
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
        <div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10 max-h-[90vh] flex flex-col">
          
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ param && param._id ? 'Edit Parameter' : 'Add New Parameter' }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ param && param._id ? 'Modify the details of this parameter.' : 'Define a new parameter for this test.' }}</p>
            </div>
            <button 
              @click="handleClose" 
              class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body / Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5 overflow-y-auto">
            <!-- Error message if any -->
            <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
              <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ error }}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Parameter Name -->
              <div class="md:col-span-2">
                <BaseInput 
                  v-model="form.name"
                  id="name"
                  label="Parameter Name"
                  placeholder="e.g. Hemoglobin"
                  required
                  :disabled="loading"
                />
              </div>

              <!-- Unit -->
              <div>
                <BaseInput 
                  v-model="form.unit"
                  id="unit"
                  label="Unit"
                  placeholder="e.g. g/dL"
                  :disabled="loading"
                />
              </div>

              <!-- Display Order -->
              <div>
                <BaseInput 
                  v-model.number="form.displayOrder"
                  id="displayOrder"
                  type="number"
                  label="Display Order"
                  placeholder="0"
                  :disabled="loading"
                />
              </div>

              <!-- Normal Range (Male) -->
              <div class="md:col-span-2">
                <BaseInput 
                  v-model="form.normalRangeMale"
                  id="normalRangeMale"
                  label="Normal Range (Male)"
                  placeholder="e.g. 13.8 - 17.2"
                  :disabled="loading"
                />
              </div>

              <!-- Normal Range (Female) -->
              <div class="md:col-span-2">
                <BaseInput 
                  v-model="form.normalRangeFemale"
                  id="normalRangeFemale"
                  label="Normal Range (Female)"
                  placeholder="e.g. 12.1 - 15.1"
                  :disabled="loading"
                />
              </div>

              <!-- Normal Range (Child) -->
              <div class="md:col-span-2">
                <BaseInput 
                  v-model="form.normalRangeChild"
                  id="normalRangeChild"
                  label="Normal Range (Child)"
                  placeholder="e.g. 11.0 - 16.0"
                  :disabled="loading"
                />
              </div>

              <!-- Custom Reference Intervals Section -->
              <div class="md:col-span-2 border-t border-slate-100 pt-5 mt-2">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="text-sm font-bold text-slate-800">Custom Reference Intervals</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Use for age-specific, month-specific, or other dynamic reference ranges (e.g. 1-6 Months -> 1.5 - 45.0).</p>
                  </div>
                  <button 
                    type="button"
                    @click="addReferenceInterval"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs rounded-lg transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Interval
                  </button>
                </div>

                <div v-if="form.referenceIntervals.length === 0" class="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No custom reference intervals defined. Click "Add Interval" to add one.
                </div>

                <div v-else class="space-y-3">
                  <div 
                    v-for="(interval, idx) in form.referenceIntervals" 
                    :key="idx" 
                    class="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div class="flex-grow grid grid-cols-2 gap-3">
                      <input 
                        v-model="interval.label"
                        type="text"
                        placeholder="Label (e.g. 1-6 Months)"
                        required
                        class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      />
                      <input 
                        v-model="interval.range"
                        type="text"
                        placeholder="Range (e.g. 1.5 - 45.0)"
                        required
                        class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      @click="removeReferenceInterval(idx)"
                      class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors shrink-0"
                      title="Remove Interval"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <!-- Actions Footer -->
            <div class="flex justify-end items-center gap-3 pt-5 mt-2 border-t border-slate-100">
              <button 
                type="button" 
                @click="handleClose" 
                class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100"
                :disabled="loading"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                :disabled="loading"
              >
                <!-- Loading Spinner -->
                <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ loading ? 'Saving...' : (param && param._id ? 'Save Changes' : 'Save Parameter') }}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Springy Modal Transitions */
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

/* Shake Animation for Form Errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
