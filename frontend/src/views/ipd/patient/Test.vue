<script setup>
import { ref } from 'vue'
import Laboratory from './Laboratory.vue'
import Radiology from './Radiology.vue'
import Endoscopy from './Endoscopy.vue'

const props = defineProps({
  admissionId: {
    type: String,
    required: true
  },
  admission: {
    type: Object,
    required: true
  }
})

const activeSubTab = ref('laboratory') // laboratory, radiology, endoscopy
</script>

<template>
  <div class="space-y-6">
    <!-- Sub-tabbar header -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
      <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
        <button
          @click="activeSubTab = 'laboratory'"
          class="px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          :class="activeSubTab === 'laboratory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Laboratory
        </button>
        <button
          @click="activeSubTab = 'radiology'"
          class="px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          :class="activeSubTab === 'radiology' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          Radiology
        </button>
        <button
          @click="activeSubTab = 'endoscopy'"
          class="px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          :class="activeSubTab === 'endoscopy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Endoscopy
        </button>
      </div>
    </div>

    <!-- Active component container -->
    <div class="animate-in fade-in duration-200">
      <Laboratory
        v-if="activeSubTab === 'laboratory'"
        :admissionId="props.admissionId"
        :admission="props.admission"
      />
      <Radiology
        v-else-if="activeSubTab === 'radiology'"
        :admissionId="props.admissionId"
        :admission="props.admission"
      />
      <Endoscopy
        v-else-if="activeSubTab === 'endoscopy'"
        :admissionId="props.admissionId"
        :admission="props.admission"
      />
    </div>
  </div>
</template>
