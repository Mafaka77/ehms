<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useMasterUserStore } from '../../../stores/masterUserStore'
import { useAuthStore } from '../../../stores/authStore'
import BaseInput from '../../../components/BaseInput.vue'

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

const loadingData = ref(false)
const savingData = ref(false)
const roles = ref([])

const form = ref({
  fullName: '',
  email: '',
  roleIds: [],
  password: '' // Optional
})

const handleBack = () => {
  router.push('/users')
}

const loadData = async () => {
  loadingData.value = true
  try {
    const [userData, fetchedRoles] = await Promise.all([
      masterUserStore.fetchUserById(props.id),
      authStore.fetchRoles()
    ])

    if (userData) {
      form.value.fullName = userData.fullName
      form.value.email = userData.email
      const fallbackRoleId = userData.role?._id || userData.role
      form.value.roleIds = (userData.roles && userData.roles.length > 0) 
        ? userData.roles.map(r => r._id || r) 
        : (fallbackRoleId ? [fallbackRoleId] : [])
    } else {
      snackbarStore.show({ message: 'User not found.', type: 'error' })
      handleBack()
    }
    roles.value = fetchedRoles
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load data.', type: 'error' })
  } finally {
    loadingData.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.roleIds || form.value.roleIds.length === 0) {
    snackbarStore.show({ message: 'Please select at least one security role.', type: 'warning' })
    return
  }
  savingData.value = true
  try {
    const dataToSubmit = {
      roleIds: form.value.roleIds
    }
    if (form.value.password) {
      dataToSubmit.password = form.value.password
    }

    const response = await masterUserStore.updateUser(props.id, dataToSubmit)
    if (response.success) {
      snackbarStore.show({ message: 'User updated successfully!', type: 'success' })
      handleBack()
    } else {
      snackbarStore.show({ message: response.message || 'Failed to update user', type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred while updating the user.', type: 'error' })
  } finally {
    savingData.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
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
        <h1 class="text-2xl font-bold text-slate-900">Edit User</h1>
        <p class="text-slate-500 text-sm mt-0.5">Modify user's security role and access credentials.</p>
      </div>
    </div>

    <div v-if="loadingData" class="flex flex-col items-center justify-center py-24 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading details...</span>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <div class="grid grid-cols-1 gap-6">
          <BaseInput 
            v-model="form.fullName"
            id="fullName"
            label="Full Name"
            placeholder="User's full name"
            disabled
          />

          <BaseInput 
            v-model="form.email"
            id="email"
            type="email"
            label="Email Address"
            placeholder="User's email"
            disabled
          />

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Security Roles <span class="text-rose-500">*</span></label>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <label 
                v-for="role in roles" 
                :key="role._id" 
                class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer shadow-sm transition-all select-none"
              >
                <input 
                  type="checkbox" 
                  :value="role._id" 
                  v-model="form.roleIds"
                  class="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span class="text-sm font-semibold text-slate-700">{{ role.name }}</span>
              </label>
            </div>
            <p class="text-xs text-slate-500 mt-1.5">A user can be assigned multiple roles, inheriting the union of all role privileges.</p>
          </div>

          <BaseInput 
            v-model="form.password"
            id="password"
            type="password"
            label="New Password (Optional)"
            placeholder="Leave blank to keep current password"
          />
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 gap-3">
          <button 
            type="button" 
            @click="handleBack"
            class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            :disabled="savingData"
          >
            <svg v-if="savingData" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
