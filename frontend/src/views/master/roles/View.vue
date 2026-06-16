<script setup>
import { ref, onMounted, computed, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useMasterUserStore } from '../../../stores/masterUserStore'
import { useAuthStore } from '../../../stores/authStore'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const snackbarStore = useSnackbarStore()
const masterUserStore = useMasterUserStore()
const authStore = useAuthStore()

const role = ref(null)
const loadingData = ref(false)
const selectedPermissions = ref([])

const handleBack = () => {
  router.push('/roles')
}

// Fetch role details and permissions list
const loadData = async () => {
  loadingData.value = true
  try {
    // 1. Fetch all roles and find the one matching props.id
    const allRoles = await authStore.fetchRoles()
    const roleData = allRoles.find(r => r._id === props.id)
    
    if (roleData) {
      role.value = roleData
      // 2. Fetch all system permissions
      await masterUserStore.fetchPermissions()
      // 3. Set the active permissions on this role
      if (roleData.permissions) {
        selectedPermissions.value = roleData.permissions.map(p => p._id || p)
      }
    } else {
      snackbarStore.show({
        message: 'Role details not found.',
        type: 'error'
      })
      handleBack()
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({
      message: 'Failed to load role permissions.',
      type: 'error'
    })
  } finally {
    loadingData.value = false
  }
}

// Group permissions by module computed
const permissionsByModule = computed(() => {
  const groups = {}
  if (!masterUserStore.permissions) return groups
  masterUserStore.permissions.forEach(p => {
    const mod = p.module || 'General'
    if (!groups[mod]) {
      groups[mod] = []
    }
    groups[mod].push(p)
  })
  return groups
})

// Toggle all permissions for a module
const toggleModuleAll = (moduleName, permissionsList) => {
  const allInModuleSelected = permissionsList.every(p => selectedPermissions.value.includes(p._id))
  
  if (allInModuleSelected) {
    // Untick all in this module
    selectedPermissions.value = selectedPermissions.value.filter(
      id => !permissionsList.some(p => p._id === id)
    )
  } else {
    // Tick all in this module (ensure no duplicates)
    permissionsList.forEach(p => {
      if (!selectedPermissions.value.includes(p._id)) {
        selectedPermissions.value.push(p._id)
      }
    })
  }
}

// Check if all permissions in module are selected
const isModuleAllSelected = (permissionsList) => {
  if (permissionsList.length === 0) return false
  return permissionsList.every(p => selectedPermissions.value.includes(p._id))
}

const handleSavePermissions = async () => {
  if (!role.value?._id) return

  loadingData.value = true
  try {
    const response = await masterUserStore.updateRolePermissions(
      role.value._id,
      selectedPermissions.value
    )
    if (response.success) {
      snackbarStore.show({
        message: 'Permissions updated successfully for role: ' + role.value.name,
        type: 'success'
      })
      await loadData()
    } else {
      snackbarStore.show({
        message: response.message || 'Failed to update permissions.',
        type: 'error'
      })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({
      message: err.message || 'An error occurred',
      type: 'error'
    })
  } finally {
    loadingData.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button 
          @click="handleBack"
          class="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-sm focus:outline-none"
          title="Go Back"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Role Permissions</h1>
          <p class="text-slate-500 text-sm mt-0.5">Manage permissions assigned to this security role.</p>
        </div>
      </div>

      <button 
        v-if="role && (authStore.user?.roleName === 'SuperAdmin' || authStore.user?.roleName === 'HospitalAdmin' || authStore.user?.role?.name === 'SuperAdmin' || authStore.user?.role?.name === 'HospitalAdmin')"
        @click="handleSavePermissions"
        :disabled="loadingData"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <svg v-if="loadingData" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Save Permissions</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loadingData && !role" class="flex flex-col items-center justify-center py-32 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading role configuration...</span>
    </div>

    <template v-else-if="role">
      <!-- Role profile header card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
            {{ role.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <span class="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 font-semibold text-[10px] uppercase tracking-wider inline-block mb-1">
              Role
            </span>
            <h2 class="text-xl font-bold text-slate-900">{{ role.name }}</h2>
            <span class="text-slate-500 text-xs block mt-0.5">ID: {{ role._id }}</span>
          </div>
        </div>

        <div class="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 max-w-sm">
          <span class="text-indigo-800 font-bold text-xs block uppercase tracking-wide">Role-Based Access Control</span>
          <p class="text-slate-500 text-[11px] mt-1 leading-relaxed">
            Changing these checkboxes updates permissions for the <span class="font-semibold text-slate-700">{{ role.name }}</span> role. All users assigned to this role will receive the updated permission privileges.
          </p>
        </div>
      </div>

      <!-- Modules Permissions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          v-for="(perms, moduleName) in permissionsByModule" 
          :key="moduleName"
          class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
        >
          <!-- Module header -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span class="font-bold text-slate-800 text-sm tracking-wide uppercase">{{ moduleName }} Module</span>
            <button 
              v-if="authStore.user?.roleName === 'SuperAdmin' || authStore.user?.roleName === 'HospitalAdmin' || authStore.user?.role?.name === 'SuperAdmin' || authStore.user?.role?.name === 'HospitalAdmin'"
              type="button" 
              @click="toggleModuleAll(moduleName, perms)"
              class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors focus:outline-none"
            >
              {{ isModuleAllSelected(perms) ? 'Deselect All' : 'Select All' }}
            </button>
          </div>

          <!-- Module Permissions checkboxes -->
          <div class="p-6 divide-y divide-slate-100/60 flex-1 space-y-4">
            <label 
              v-for="p in perms" 
              :key="p._id" 
              class="flex items-start justify-between gap-4 cursor-pointer pt-3 first:pt-0"
            >
              <div class="space-y-0.5">
                <span class="text-slate-800 text-sm font-semibold block">{{ p.name }}</span>
                <span class="text-slate-400 font-mono text-[10px] uppercase block">{{ p.code }}</span>
              </div>
              <input 
                type="checkbox" 
                :value="p._id" 
                v-model="selectedPermissions"
                :disabled="authStore.user?.roleName !== 'SuperAdmin' && authStore.user?.roleName !== 'HospitalAdmin' && authStore.user?.role?.name !== 'SuperAdmin' && authStore.user?.role?.name !== 'HospitalAdmin'"
                class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 transition-all cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
