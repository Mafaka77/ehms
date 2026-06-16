<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePharmacyStore } from '../../../stores/pharmacyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'

const router = useRouter()
const pharmacyStore = usePharmacyStore()
const snackbarStore = useSnackbarStore()

const form = ref({
  supplierCode:  '',
  supplierName:  '',
  contactPerson: '',
  mobileNo:      '',
  email:         '',
  gstNo:         '',
  address:       '',
  city:          '',
  state:         '',
  pincode:       '',
  isActive:      true
})

const loading = ref(false)
const error = ref('')

const handleBack = () => {
  router.push('/pharmacy/supplier')
}

const handleSubmit = async () => {
  if (!form.value.supplierName.trim()) {
    error.value = 'Supplier Name is required.'
    snackbarStore.show({ message: error.value, type: 'warning' })
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await pharmacyStore.createSupplier(form.value)
    if (res.success) {
      snackbarStore.show({ message: res.message || 'Supplier created successfully', type: 'success' })
      handleBack()
    } else {
      error.value = res.message || 'Failed to create supplier'
      snackbarStore.show({ message: error.value, type: 'error' })
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || err.message || 'An error occurred'
    snackbarStore.show({ message: error.value, type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <button
        @click="handleBack"
        class="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100"
        title="Go Back"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">
          Register New Supplier
        </h1>
        <p class="text-slate-500 text-sm mt-0.5">
          Fill in the supplier details including contact, address, and billing information.
        </p>
      </div>
    </div>

    <!-- Form Panel Card -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Creating supplier...</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="p-8 space-y-6">
        <!-- Error Message Banner -->
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
          <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Section 1: Basic Information -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="form.supplierCode"
              id="supplierCode"
              label="Supplier Code"
              placeholder="Auto-generated"
              disabled
            />
            <BaseInput
              v-model="form.supplierName"
              id="supplierName"
              label="Supplier Name"
              placeholder="e.g. MedLife Distributors"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Section 2: Contact Information -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Contact Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput
              v-model="form.contactPerson"
              id="contactPerson"
              label="Contact Person"
              placeholder="e.g. Ramesh Kumar"
              :disabled="loading"
            />
            <BaseInput
              v-model="form.mobileNo"
              id="mobileNo"
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              :disabled="loading"
            />
            <BaseInput
              v-model="form.email"
              id="email"
              label="Email Address"
              type="email"
              placeholder="e.g. supplier@email.com"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Section 3: Address Details -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Address Details</h3>
          <div class="space-y-4">
            <BaseInput
              v-model="form.address"
              id="address"
              label="Street Address"
              placeholder="e.g. 42 Industrial Area, Phase 2"
              :disabled="loading"
            />
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BaseInput
                v-model="form.city"
                id="city"
                label="City"
                placeholder="e.g. Mumbai"
                :disabled="loading"
              />
              <BaseInput
                v-model="form.state"
                id="state"
                label="State"
                placeholder="e.g. Maharashtra"
                :disabled="loading"
              />
              <BaseInput
                v-model="form.pincode"
                id="pincode"
                label="Pincode"
                placeholder="e.g. 400001"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <!-- Section 4: Billing & Status -->
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Billing & Status</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <BaseInput
              v-model="form.gstNo"
              id="gstNo"
              label="GST Number"
              placeholder="e.g. 27AAPFU0939F1ZV"
              :disabled="loading"
            />
            <div class="flex items-center gap-3 pl-2 pt-6 md:pt-4">
              <input
                type="checkbox"
                id="isActive"
                v-model="form.isActive"
                :disabled="loading"
                class="w-4.5 h-4.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <label for="isActive" class="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                Supplier is Active
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions Footer -->
        <div class="flex justify-end items-center gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            @click="handleBack"
            class="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-lg shadow-teal-100 transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Saving...' : 'Register Supplier' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
