<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800">Add New Permission</h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6">
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Permission Code <span class="text-rose-500">*</span></label>
            <input 
              v-model="form.code"
              type="text"
              required
              placeholder="e.g. lab.payment"
              class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Name <span class="text-rose-500">*</span></label>
            <input 
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Process Lab Payment"
              class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Module <span class="text-rose-500">*</span></label>
            <input 
              v-model="form.module"
              type="text"
              required
              placeholder="e.g. Laboratory"
              class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-rose-50 rounded-xl flex items-start space-x-2">
            <svg class="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="text-sm text-rose-600">{{ error }}</span>
          </div>

          <div class="pt-4 flex items-center justify-end space-x-3">
            <button 
              type="button"
              @click="close"
              class="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="loading"
              class="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Save Permission
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '../../../axios/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:isOpen', 'success'])

const form = reactive({
  code: '',
  name: '',
  module: ''
})

const loading = ref(false)
const error = ref('')

const close = () => {
  emit('update:isOpen', false)
  error.value = ''
  form.code = ''
  form.name = ''
  form.module = ''
}

const submitForm = async () => {
  loading.value = true
  error.value = ''
  try {
    await api.post('/auth/permissions', form)
    emit('success')
    close()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create permission'
  } finally {
    loading.value = false
  }
}
</script>
