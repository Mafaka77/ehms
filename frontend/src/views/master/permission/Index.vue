<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Permissions</h2>
        <p class="text-sm text-slate-500 mt-1">Manage system permissions and access controls</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="isCreateModalOpen = true"
          class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all"
        >
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Permission
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center">
      <svg class="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-sm font-medium text-slate-500">Loading permissions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-rose-50 rounded-2xl border border-rose-100 p-6 flex items-start space-x-3">
      <svg class="w-6 h-6 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <div>
        <h3 class="text-sm font-semibold text-rose-800">Error Loading Permissions</h3>
        <p class="text-sm text-rose-600 mt-1">{{ error }}</p>
        <button @click="fetchPermissions" class="mt-3 text-sm font-medium text-rose-700 hover:text-rose-800">Try again</button>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Search Bar -->
      <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="relative w-full max-w-md">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search permissions..."
            class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <svg class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Module</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permission Code</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="permission in filteredPermissions" :key="permission._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {{ permission.module || 'System' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{{ permission.code }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-slate-800">{{ permission.name || 'N/A' }}</span>
              </td>
            </tr>
            <tr v-if="filteredPermissions.length === 0">
              <td colspan="3" class="px-6 py-12 text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 class="text-sm font-medium text-slate-900">No permissions found</h3>
                <p class="mt-1 text-sm text-slate-500">Try adjusting your search terms or create a new permission.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <CreatePermissionModal 
      v-model:isOpen="isCreateModalOpen" 
      @success="handlePermissionCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../../axios/api.js'
import CreatePermissionModal from './Create.vue'

const permissions = ref([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const isCreateModalOpen = ref(false)

const fetchPermissions = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/auth/permissions')
    permissions.value = res.data.data
  } catch (err) {
    console.error('Error fetching permissions:', err)
    error.value = 'Failed to load permissions. Please try again.'
  } finally {
    loading.value = false
  }
}

const handlePermissionCreated = () => {
  fetchPermissions()
}

const filteredPermissions = computed(() => {
  if (!searchQuery.value) return permissions.value
  
  const query = searchQuery.value.toLowerCase()
  return permissions.value.filter(p => 
    (p.code && p.code.toLowerCase().includes(query)) ||
    (p.name && p.name.toLowerCase().includes(query)) ||
    (p.module && p.module.toLowerCase().includes(query))
  )
})

onMounted(() => {
  fetchPermissions()
})
</script>
