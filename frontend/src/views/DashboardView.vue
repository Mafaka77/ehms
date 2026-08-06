<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import AdminDashboardView from './dashboard/AdminDashboardView.vue'
import DefaultDashboardView from './dashboard/DefaultDashboardView.vue'

const authStore = useAuthStore()

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role
  return roleName === 'SuperAdmin' || roleName === 'Hospital Admin'
})
</script>

<template>
  <AdminDashboardView v-if="isSuperAdmin" />
  <DefaultDashboardView v-else />
</template>