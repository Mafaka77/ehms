<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/authStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const router = useRouter()

const roles = ref([])
const loading = ref(false)

const loadRoles = async () => {
  loading.value = true
  try {
    const fetchedRoles = await authStore.fetchRoles()
    roles.value = fetchedRoles
  } catch (err) {
    snackbarStore.show({ message: 'Failed to load roles', type: 'error' })
  } finally {
    loading.value = false
  }
}

const handleViewRole = (role) => {
  router.push(`/roles/view/${role._id}`)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Security Roles</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage system roles and their assigned permissions.</p>
      </div>
    </div>

    <!-- Data Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 border-b border-slate-100 bg-slate-50/30">
        <h2 class="text-lg font-semibold text-slate-800">All Roles</h2>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading roles...</span>
      </div>

      <div v-else-if="roles.length === 0" class="p-6 text-center text-slate-500 py-24">
        <p class="text-slate-700 font-semibold text-lg">No roles found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/3">Role Name</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/3">Assigned Permissions</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/6">Created Date</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-1/6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="role in roles" 
              :key="role._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                    {{ role.name.charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-semibold text-slate-800 text-sm">{{ role.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-semibold text-xs inline-block">
                  {{ role.permissions ? role.permissions.length : 0 }} Permissions
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ formatDate(role.createdAt) }}
              </td>
              <td class="px-6 py-4 text-center">
                <button 
                  @click="handleViewRole(role)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all font-medium text-xs"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Manage Permissions
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
