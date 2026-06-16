<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import AdminSidebar from '../components/AdminSidebar.vue'

const authStore = useAuthStore()
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
  <div class="min-h-screen bg-slate-50 flex font-sans">
    
    <!-- Sidebar (Desktop) -->
    <AdminSidebar :collapsed="isSidebarCollapsed" />

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
          
          <!-- Notifications -->
          <button class="relative p-2.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
            <span class="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span class="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

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
