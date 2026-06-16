<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useMasterUserStore } from '../../../stores/masterUserStore'
import { useAuthStore } from '../../../stores/authStore'

const router = useRouter()
const snackbarStore = useSnackbarStore()
const masterUserStore = useMasterUserStore()
const authStore = useAuthStore()

const searchQuery = ref('')

const fetchAllUsers = async () => {
  try {
    await masterUserStore.fetchUsers()
  } catch (err) {
    console.error(err)
  }
}

const filteredUsers = computed(() => {
  if (!masterUserStore.users) return []
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return masterUserStore.users
  return masterUserStore.users.filter(u => 
    u.fullName.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query) ||
    u.role?.name?.toLowerCase().includes(query) ||
    (u.roles && u.roles.some(r => r.name.toLowerCase().includes(query)))
  )
})

const editUser = (userId) => {
  router.push(`/users/edit/${userId}`)
}

const handleDeleteUser = async (user) => {
  if (confirm(`Are you sure you want to delete user account for ${user.fullName} (${user.email})?`)) {
    const response = await masterUserStore.deleteUser(user._id)
    if (response.success) {
      snackbarStore.show({
        message: response.message || 'User account deleted successfully',
        type: 'success'
      })
    } else {
      snackbarStore.show({
        message: response.message || 'Failed to delete user account',
        type: 'error'
      })
    }
  }
}

onMounted(async () => {
  await fetchAllUsers()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">User Accounts</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage system user access, check security details, and configure role permission rules.</p>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Search & Filters Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-800">System Users</h2>
          
          <!-- Search box -->
          <div class="relative w-full lg:w-80">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by name, email, role..." 
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="masterUserStore.loading" class="flex flex-col items-center justify-center py-24 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading user accounts...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="p-6 text-center text-slate-500 py-24">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-slate-700 font-semibold text-lg">No user accounts found</p>
        <p class="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          No records match your criteria.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[35%]">User Details</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[25%]">Email Address</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[25%]">Security Role</th>
              <th class="text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider w-[15%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="user in filteredUsers" 
              :key="user._id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Name -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                    {{ user.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="font-semibold text-slate-800 text-sm block">{{ user.fullName }}</span>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="px-6 py-4 text-sm text-slate-600">
                {{ user.email }}
              </td>

              <!-- Role -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-if="user.roles && user.roles.length > 0" v-for="r in user.roles" :key="r._id" class="px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-700 font-semibold text-xs border border-indigo-100 inline-block">
                    {{ r.name }}
                  </span>
                  <span v-else class="px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-700 font-semibold text-xs border border-indigo-100 inline-block">
                    {{ user.role?.name || 'No Role Assigned' }}
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="editUser(user._id)"
                    class="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200/50 shadow-sm"
                  >
                    <span>Edit</span>
                  </button>
                  <button 
                    v-if="authStore.hasPermission('users.delete')"
                    @click="handleDeleteUser(user)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
                    title="Delete User"
                  >
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
