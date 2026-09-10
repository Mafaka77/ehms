<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import AdminSidebar from '../components/AdminSidebar.vue'
import NotificationBell from '../components/NotificationBell.vue'

const authStore = useAuthStore()
const notifStore = useNotificationStore()
const isMobileMenuOpen = ref(false)
const isSidebarCollapsed = ref(false)

const userName = computed(() => {
  return authStore.user?.email?.split('@')[0] || 'User'
})
const userRoleName = computed(() => {
  return authStore.user?.roleName || authStore.user?.role?.name || 'Administrator'
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex font-sans relative">
    
    <!-- Real-time Foreground Notification Toast Banner -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-[-20px] opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <div
        v-if="notifStore.activeToast"
        class="fixed top-5 right-5 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-100 p-4 flex items-start gap-3.5 ring-1 ring-black/5"
      >
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg shrink-0 shadow-md">
          🔔
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-800 truncate">
              {{ notifStore.activeToast.title }}
            </h4>
            <span class="text-[10px] text-slate-400 font-medium ml-2">Just now</span>
          </div>
          <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {{ notifStore.activeToast.body }}
          </p>
          <div class="flex items-center gap-3 mt-2">
            <button
              @click="notifStore.markAsRead(notifStore.activeToast.id); notifStore.dismissToast()"
              class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Mark as read
            </button>
          </div>
        </div>
        <button
          @click="notifStore.dismissToast"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition>

    <!-- Mobile Sidebar Backdrop -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false" 
      class="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
    ></div>

    <!-- Sidebar -->
    <AdminSidebar 
      :collapsed="isSidebarCollapsed" 
      :isMobileOpen="isMobileMenuOpen"
      @close-mobile="isMobileMenuOpen = false"
      class="z-40"
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
      
      <!-- Top Header -->
      <header class="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 shadow-sm">
        
        <!-- Left: Sidebar Toggle + Mobile Menu -->
        <div class="flex items-center gap-3">
          <!-- Desktop Sidebar Toggle -->
          <button 
            @click="isSidebarCollapsed = !isSidebarCollapsed" 
            class="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none transition-all duration-200"
            :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          >
            <!-- Bars icon -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Mobile menu button -->
          <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Search Bar -->
          <div class="hidden sm:flex items-center bg-slate-100 rounded-2xl px-4 py-2.5 w-72 lg:w-96 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all shadow-inner">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search patients, records..." class="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-700 placeholder-slate-400">
          </div>
        </div>

        <!-- Right Side Nav -->
        <div class="flex items-center space-x-5">
          
          <!-- Notifications Bell Dropdown -->
          <NotificationBell />

          <!-- Divider -->
          <div class="h-8 w-px bg-slate-200"></div>

          <!-- User Profile -->
          <div class="flex items-center space-x-3 cursor-pointer group">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">
              A
            </div>
            <div class="hidden lg:block">
              <p class="text-sm font-semibold text-slate-700 capitalize">{{ userName }}</p>
              <p class="text-xs text-slate-500 capitalize">{{ userRoleName }}</p>
            </div>
          </div>
          
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 lg:p-10 relative">
        <!-- Render child routes here! -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </main>
      
    </div>
  </div>
</template>

<style scoped>
/* Smooth fade transitions for page routing */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
