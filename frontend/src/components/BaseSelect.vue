<script setup>
import { defineModel } from 'vue'

const modelValue = defineModel()

defineProps({
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="space-y-1.5 w-full">
    <label v-if="label" :for="id" class="text-xs font-semibold text-slate-700 tracking-wide uppercase">
      {{ label }} <span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </label>
    <div class="relative rounded-xl shadow-sm">
      <select 
        :id="id"
        v-model="modelValue"
        class="w-full px-4 py-3 rounded-xl border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none"
        :class="error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'"
        :disabled="disabled"
        :required="required"
      >
        <option v-for="opt in options" :key="opt.value || opt" :value="opt.value || opt">
          {{ opt.label || opt }}
        </option>
        <slot></slot>
      </select>
      <!-- Custom Arrow Icon -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    <p v-if="error" class="text-xs text-rose-500 mt-1 pl-1">{{ error }}</p>
  </div>
</template>
