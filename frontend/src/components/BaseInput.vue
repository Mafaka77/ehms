<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
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
  }
})

const model = defineModel({ type: String, default: '' })
</script>

<template>
  <div class="space-y-1.5 w-full">
    <label 
      v-if="label" 
      :for="id" 
      class="text-xs font-semibold text-slate-700 tracking-wide uppercase"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </label>
    
    <div class="relative rounded-xl shadow-sm">
      <input
        v-model="model"
        :type="type"
        :id="id"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="w-full px-4 py-3 rounded-xl border bg-white placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        :class="error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'"
      />
    </div>
    
    <p v-if="error" class="text-xs text-rose-500 mt-1 pl-1">{{ error }}</p>
  </div>
</template>
