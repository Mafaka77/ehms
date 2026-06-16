<script setup>
import { ref, computed, onMounted, onUnmounted, defineModel } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
    // Expects: [{ value: 'id', label: 'Dr. Foo - General' }]
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: () => 'select-' + Math.random().toString(36).substr(2, 9)
  },
  placeholder: {
    type: String,
    default: 'Select an option...'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const modelValue = defineModel()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === modelValue.value)
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(q))
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

const selectOption = (opt) => {
  modelValue.value = opt.value
  isOpen.value = false
}

// Close when clicking outside
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="relative w-full" ref="containerRef">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-slate-700 mb-2">
      {{ label }} <span v-if="required" class="text-rose-500">*</span>
    </label>
    
    <!-- Select Trigger -->
    <div 
      @click="toggleDropdown"
      class="w-full px-4 py-3 bg-white border rounded-xl text-sm transition-all shadow-sm flex items-center justify-between cursor-pointer"
      :class="[
        isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300',
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-700'
      ]"
    >
      <span class="truncate" :class="{ 'text-slate-400': !selectedOption }">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <svg class="w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
    </div>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-100 bg-slate-50/50">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search options..."
              class="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-colors"
              @click.stop
            />
          </div>
        </div>

        <!-- Options List -->
        <ul class="max-h-60 overflow-y-auto py-1">
          <li v-if="filteredOptions.length === 0" class="px-4 py-3 text-sm text-slate-500 text-center">
            No options found
          </li>
          <li 
            v-for="opt in filteredOptions" 
            :key="opt.value"
            @click="selectOption(opt)"
            class="px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between"
            :class="opt.value === modelValue ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'"
          >
            <span class="truncate">{{ opt.label }}</span>
            <svg v-if="opt.value === modelValue" class="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>
