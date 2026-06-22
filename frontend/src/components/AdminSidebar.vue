<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  isMobileOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close-mobile'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

watch(() => route.path, () => {
  if (props.isMobileOpen) {
    emit('close-mobile')
  }
})

// Navigation items with required permissions attached
const navigation = [
  { name: 'Dashboard', href: '/dashboard', permission: null, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
 

  {
    name: 'OPD',
    href: '#',
    permission: null,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    children: [
       { name: 'Appointment', href: '/opd/appointment', permission: 'opd.view', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Payment', href: '/opd/payment', permission: 'opd.payment', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' }
    ]
  },
  {
    name: 'Emergency',
    href: '#',
    permission: null,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    children: [
      { name: 'ER Visits', href: '/emergency/visits', permission: 'emergency.view', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { name: 'Payment', href: '/emergency/payment', permission: 'emergency.payment', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' }
    ]
  },
  {
    name: 'IPD',
    href: '#',
    permission: 'ipd.view',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    children: [
      { name: 'My Patient', href: '/ipd/my-patient', permission: 'ipd.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Admission', href: '/ipd/admission', permission: 'ipd.admit', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-3-3v6' },
      { name: 'Ward Management', href: '/ipd/ward', permission: 'ward.view', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Charges Management', href: '/ipd/charges', permission: 'ipd.charges.view', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    ]
  },
  {
    name: 'Laboratory',
    href: 'lab.view',
    permission: null,
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    children: [
      { name: 'Manage Laboratory', href: '/laboratory/manage', permission: 'lab.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
       { name: 'Payment', href: '/laboratory/payment', permission: 'lab.payment', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Orders', href: '/laboratory/order', permission: 'lab.order', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Lab Category', href: '/laboratory/category', permission: 'lab.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 3z' },
      { name: 'Lab Sample Type', href: '/laboratory/sample-type', permission: 'lab.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ]
  },
   {
    name: 'Radiology',
    href: 'radiology.view',
    permission: null,
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    children: [
      { name: 'Manage', href: '/radiology/manage', permission: 'radiology.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
       { name: 'Payment', href: '/radiology/payment', permission: 'radiology.payment', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Orders', href: '/radiology/order', permission: 'radiology.order', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Category', href: '/radiology/category', permission: 'radiology.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 3z' },
    ]
  },
    {
    name: 'Pharmacy',
    href: 'pharmacy.view',
    permission: null,
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    children: [
      
      { name: 'Manage Pharmacy', href: '/pharmacy/manage', permission: 'pharmacy.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Pharmacy Category', href: '/pharmacy/category', permission: 'pharmacy.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 3z' },
      { name: 'Pharmacy Supplier', href: '/pharmacy/supplier', permission: 'pharmacy.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 3z' },
    ]
  },
  {
    name: 'HR',
    href: '#',
    permission: null,
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    children: [
      
      { name: 'Employee', href: '/employee', permission: 'employee.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Salary Bonus', href: '/salary-bonus', permission: 'salary_bonus.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 3z' },
      
     
    ]
  },
  { 
        name: 'Manage Doctors', 
        href: '#', 
        permission: 'doctor.view', 
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        children: [
          { name: 'Doctors', href: '/doctors', permission: 'doctor.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
        ]
      },
   { 
        name: 'Manage Nurses', 
        href: '#', 
        permission: null, 
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        children: [
          { name: 'My Station', href: '/nurse/my-station', permission: 'my_station.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { name: 'Nursing Station', href: '/nurse/nursing-station', permission: 'nursing_station.view', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
        ]
      },
  {
    name: 'Master Data',
    href: '#',
    permission: null,
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    children: [
      
      { name: 'Users', href: '/users', permission: 'user.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Roles', href: '/roles', permission: 'user.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Permission', href: '/permissions', permission: 'user.view', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { name: 'Department', href: '/department', permission: 'department.view', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Designation', href: '/designation', permission: 'designation.view', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Specialization', href: '/specialization', permission: 'specialization.view', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
     
    ]
  },
  { name: 'Settings', href: '#', permission: null, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

// Open states for collapsible menus
const openMenus = ref({
  'Master Data': false
})

const toggleMenu = (menuName) => {
  openMenus.value[menuName] = !openMenus.value[menuName]
}

// Filter navigation items based on user's permissions
const filteredNavigation = computed(() => {
  return navigation
    .filter(item => authStore.hasPermission(item.permission))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children
            .filter(child => authStore.hasPermission(child.permission))
            .map(child => {
              if (child.children) {
                return {
                  ...child,
                  children: child.children.filter(subChild => authStore.hasPermission(subChild.permission))
                }
              }
              return child
            })
            .filter(child => !child.children || child.children.length > 0)
        }
      }
      return item
    })
    .filter(item => !item.children || item.children.length > 0)
})

onMounted(() => {
  // Automatically open any submenus that have an active child route on mount
  navigation.forEach(item => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => {
        if (child.children) {
          const hasActiveSub = child.children.some(subChild => subChild.href !== '#' && route.path.startsWith(subChild.href))
          if (hasActiveSub) openMenus.value[child.name] = true;
          return hasActiveSub;
        }
        return child.href !== '#' && route.path.startsWith(child.href)
      })
      if (hasActiveChild) {
        openMenus.value[item.name] = true
      }
    }
  })
})

const isActive = (href) => {
  if (!href || href === '#') return false
  return route.path === href || route.path.startsWith(href + '/')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside 
    class="flex-col h-screen bg-slate-900 text-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden"
    :class="[
      isMobileOpen ? 'fixed inset-y-0 left-0 flex w-72 z-40' : 'hidden md:flex md:sticky md:top-0 z-20',
      !isMobileOpen && collapsed ? 'w-16' : 'w-72'
    ]"
  >
    <!-- Logo -->
    <div class="h-20 flex items-center border-b border-white/10 bg-slate-950/50 shrink-0" :class="collapsed ? 'justify-center px-0' : 'px-8'">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      </div>
      <transition name="label-fade">
        <span v-if="!collapsed" class="ml-3 text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white whitespace-nowrap">EHMS</span>
      </transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar" :class="collapsed ? 'px-2' : 'px-4 py-6'">
      <div v-for="item in filteredNavigation" :key="item.name">

        <!-- =============================== -->
        <!-- COLLAPSED: icon-only with tooltip -->
        <!-- =============================== -->
        <template v-if="collapsed">
          <!-- Group with children: show icon + tooltip with children list -->
          <div v-if="item.children" class="relative group/tip">
            <button
              class="flex items-center justify-center w-full p-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
              :class="item.children.some(c => isActive(c.href)) ? 'bg-slate-800/70 text-indigo-400' : ''"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
              </svg>
            </button>
            <!-- Floating tooltip panel -->
            <div class="absolute left-full top-0 ml-2 z-50 hidden group-hover/tip:block">
              <div class="bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px]">
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 pb-1.5 border-b border-white/5">{{ item.name }}</p>
                <template v-for="child in item.children" :key="child.name">
                  <router-link
                    v-if="!child.children"
                    :to="child.href"
                    class="flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:text-indigo-400"
                    :class="isActive(child.href) ? 'text-indigo-400 font-semibold' : 'text-slate-300'"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="child.icon" />
                    </svg>
                    {{ child.name }}
                  </router-link>
                  <template v-else>
                    <p class="text-[10px] font-semibold text-slate-500 px-4 pt-1.5">{{ child.name }}</p>
                    <router-link
                      v-for="sub in child.children"
                      :key="sub.name"
                      :to="sub.href"
                      class="flex items-center gap-2.5 pl-7 pr-4 py-1.5 text-xs transition-colors hover:text-indigo-400"
                      :class="isActive(sub.href) ? 'text-indigo-400 font-semibold' : 'text-slate-300'"
                    >
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="sub.icon" />
                      </svg>
                      {{ sub.name }}
                    </router-link>
                  </template>
                </template>
              </div>
            </div>
          </div>

          <!-- Single item: icon + tooltip label -->
          <div v-else class="relative group/tip">
            <router-link
              :to="item.href"
              class="flex items-center justify-center w-full p-3 rounded-xl transition-all duration-200"
              :class="isActive(item.href) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-indigo-400'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
              </svg>
            </router-link>
            <!-- Tooltip label -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover/tip:block">
              <div class="bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>

        <!-- =============================== -->
        <!-- EXPANDED: full sidebar mode -->
        <!-- =============================== -->
        <template v-else>
          <!-- If item has sub-items (collapsible menu) -->
          <template v-if="item.children">
            <button 
              @click="toggleMenu(item.name)"
              class="flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-200 group text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              :class="{ 'bg-slate-800/50 text-slate-200': openMenus[item.name] }"
            >
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" :class="openMenus[item.name] ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                </svg>
                <span class="text-sm font-medium text-left">{{ item.name }}</span>
              </div>
              <svg 
                class="w-4 h-4 transition-transform duration-200 text-slate-500 group-hover:text-slate-300"
                :class="{ 'rotate-180 text-slate-300': openMenus[item.name] }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <transition name="submenu-slide">
              <div 
                v-show="openMenus[item.name]" 
                class="mt-1 ml-4 pl-3 border-l border-white/5 space-y-1 overflow-hidden"
              >
                <template v-for="child in item.children" :key="child.name">
                  <template v-if="child.children">
                    <button 
                      @click.prevent="toggleMenu(child.name)"
                      class="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-xs transition-all duration-200 group text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                      :class="{ 'bg-slate-800/50 text-slate-200': openMenus[child.name] }"
                    >
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2.5 transition-transform duration-200 group-hover:scale-110" :class="openMenus[child.name] ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="child.icon" />
                        </svg>
                        <span>{{ child.name }}</span>
                      </div>
                      <svg 
                        class="w-3.5 h-3.5 transition-transform duration-200 text-slate-500 group-hover:text-slate-300"
                        :class="{ 'rotate-180 text-slate-300': openMenus[child.name] }"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <transition name="submenu-slide">
                      <div v-show="openMenus[child.name]" class="mt-1 ml-4 pl-3 border-l border-white/5 space-y-1 overflow-hidden">
                        <router-link
                          v-for="subChild in child.children"
                          :key="subChild.name"
                          :to="subChild.href"
                          class="flex items-center px-4 py-2 rounded-lg text-xs transition-all duration-200 group"
                          :class="isActive(subChild.href) ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'"
                        >
                          <svg class="w-3.5 h-3.5 mr-2 transition-transform duration-200 group-hover:scale-110" :class="isActive(subChild.href) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="subChild.icon" />
                          </svg>
                          <span>{{ subChild.name }}</span>
                        </router-link>
                      </div>
                    </transition>
                  </template>
                  
                  <template v-else>
                    <router-link
                      :to="child.href"
                      class="flex items-center px-4 py-2.5 rounded-lg text-xs transition-all duration-200 group"
                      :class="isActive(child.href) ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'"
                    >
                      <svg class="w-4 h-4 mr-2.5 transition-transform duration-200 group-hover:scale-110" :class="isActive(child.href) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="child.icon" />
                      </svg>
                      <span>{{ child.name }}</span>
                    </router-link>
                  </template>
                </template>
              </div>
            </transition>
          </template>
          
          <!-- Standard route link -->
          <template v-else>
            <router-link 
              :to="item.href"
              class="flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group"
              :class="isActive(item.href) ? 'bg-indigo-600 shadow-md shadow-indigo-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
            >
              <svg class="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" :class="isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
              </svg>
              <span class="text-sm font-medium">{{ item.name }}</span>
            </router-link>
          </template>
        </template>

      </div>
    </nav>

    <!-- Bottom Logout -->
    <div class="border-t border-white/10 bg-slate-900 shrink-0" :class="collapsed ? 'p-2' : 'p-4'">
      <div v-if="collapsed" class="relative group/tip">
        <button @click="handleLogout" class="flex items-center justify-center w-full p-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
        <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover/tip:block">
          <div class="bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10">Sign Out</div>
        </div>
      </div>
      <button v-else @click="handleLogout" class="flex items-center w-full px-4 py-3 text-xs font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-200 group">
        <svg class="w-5 h-5 mr-3 text-slate-500 group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
        Sign Out
      </button>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
  max-height: 500px;
}
.submenu-slide-enter-from,
.submenu-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.2s ease, max-width 0.3s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  max-width: 0;
}
</style>
