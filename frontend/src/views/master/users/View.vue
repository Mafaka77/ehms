<script setup>
import { ref, onMounted, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useMasterUserStore } from '../../../stores/masterUserStore'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const snackbarStore = useSnackbarStore()
const masterUserStore = useMasterUserStore()

const user = ref(null)
const loadingData = ref(false)

const handleBack = () => {
  router.push('/users')
}

// Fetch user details
const loadData = async () => {
  loadingData.value = true
  try {
    const userData = await masterUserStore.fetchUserById(props.id)
    if (userData) {
      user.value = userData
    } else {
      snackbarStore.show({
        message: 'User details not found.',
        type: 'error'
      })
      handleBack()
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({
      message: 'Failed to load user details.',
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
          <h1 class="text-2xl font-bold text-slate-900">User Profile</h1>
          <p class="text-slate-500 text-sm mt-0.5">View details and role assignment for this user account.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingData && !user" class="flex flex-col items-center justify-center py-32 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading user details...</span>
    </div>

    <template v-else-if="user">
      <!-- User profile header card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
            {{ user.fullName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="flex flex-wrap gap-1 mb-1">
              <span v-if="user.roles && user.roles.length > 0" v-for="r in user.roles" :key="r._id" class="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 font-semibold text-[10px] uppercase tracking-wider inline-block">
                {{ r.name }}
              </span>
              <span v-else class="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 font-semibold text-[10px] uppercase tracking-wider inline-block">
                {{ user.role?.name || 'No Role Assigned' }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">{{ user.fullName }}</h2>
            <span class="text-slate-500 text-xs block mt-0.5">{{ user.email }}</span>
          </div>
        </div>

        <div class="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 max-w-sm">
          <span class="text-indigo-800 font-bold text-xs block uppercase tracking-wide">Role-Based Access Control</span>
          <p class="text-slate-500 text-[11px] mt-1 leading-relaxed">
            This user inherits permissions from the <span class="font-semibold text-slate-700">{{ user.roles && user.roles.length > 0 ? user.roles.map(r => r.name).join(', ') : (user.role?.name || 'assigned') }}</span> role(s). 
            To change permissions, navigate to the <strong>Master Data &gt; Roles</strong> section.
          </p>
        </div>
      </div>
      
    </template>
  </div>
</template>
