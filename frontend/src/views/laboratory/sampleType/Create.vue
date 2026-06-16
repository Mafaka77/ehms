<script setup>
import { reactive, ref, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useLabStore } from '../../../stores/labStore'
import BaseInput from '../../../components/BaseInput.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  sampleType: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const snackbarStore = useSnackbarStore()
const labStore = useLabStore()
const form = reactive({
  code: '',
  name: ''
})
const loading = ref(false)
const error = ref('')

// Reset form when modal is closed/opened
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.sampleType) {
      form.code = props.sampleType.code || ''
      form.name = props.sampleType.name || ''
    } else {
      form.code = ''
      form.name = ''
    }
    error.value = ''
  }
})

const handleClose = () => {
  if (loading.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (!form.name.trim()) {
    error.value = 'Sample type name is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (props.sampleType) {
      // Edit Mode
      const response = await labStore.updateSampleType(props.sampleType._id, form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Sample type updated successfully!',
          type: 'success'
        })
        emit('updated', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to update sample type'
        snackbarStore.show({
          message: response.message || 'Failed to update sample type',
          type: 'error'
        })
      }
    } else {
      // Create Mode
      const response = await labStore.createSampleType(form)
      if (response.success) {
        snackbarStore.show({
          message: response.message || 'Sample type created successfully!',
          type: 'success'
        })
        emit('created', response.data)
        handleClose()
      } else {
        error.value = response.message || 'Failed to create sample type'
        snackbarStore.show({
          message: response.message || 'Failed to create sample type',
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
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all relative z-10">
          
          <!-- Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ sampleType ? 'Edit Sample Type' : 'Add New Sample Type' }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ sampleType ? 'Modify the details of this sample type.' : 'Define a new type of lab sample.' }}</p>
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
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <!-- Error message if any -->
            <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
              <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ error }}</span>
            </div>

            <!-- Sample Type Code -->
            <BaseInput 
              v-model="form.code"
              id="code"
              label="Sample Code"
              placeholder="e.g. BLD, URN"
              :disabled="loading"
            />

            <!-- Sample Type Name -->
            <BaseInput 
              v-model="form.name"
              id="name"
              label="Sample Type Name"
              placeholder="e.g. Blood, Urine"
              required
              :disabled="loading"
            />

            <!-- Actions Footer (Inside Form) -->
            <div class="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
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
                <span>{{ loading ? 'Saving...' : (sampleType ? 'Save Changes' : 'Save Sample Type') }}</span>
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
