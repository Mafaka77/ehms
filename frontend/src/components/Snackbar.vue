<script setup>
import { useSnackbarStore } from '../stores/snackbarStore'

const snackbarStore = useSnackbarStore()

// Tailwind color maps based on the type of alert
const colors = {
  success: 'bg-emerald-500/90 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
  error: 'bg-rose-500/90 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
  warning: 'bg-amber-500/90 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
  info: 'bg-indigo-500/90 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
}

// SVG Icons for each type
const icons = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // Check circle
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // X circle
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // Exclamation triangle
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' // Info circle
}
</script>

<template>
  <Teleport to="body">
    <Transition name="snackbar">
      <div 
        v-if="snackbarStore.isVisible" 
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl backdrop-blur-md text-white font-medium min-w-[320px] max-w-[90vw] border border-white/20"
        :class="colors[snackbarStore.type] || colors.info"
      >
        <!-- Dynamic Icon -->
        <svg class="w-6 h-6 flex-shrink-0 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icons[snackbarStore.type] || icons.info" />
        </svg>
        
        <!-- Message -->
        <p class="flex-1 text-sm tracking-wide">{{ snackbarStore.message }}</p>

        <!-- Close Button -->
        <button 
          @click="snackbarStore.close()" 
          class="p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Springy pop-up animation */
.snackbar-enter-active,
.snackbar-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.snackbar-enter-from {
  opacity: 0;
  transform: translate(-50%, 150%) scale(0.8);
}

.snackbar-leave-to {
  opacity: 0;
  transform: translate(-50%, 150%) scale(0.8);
}
</style>
