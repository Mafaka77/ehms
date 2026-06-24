<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDentalStore } from '../../stores/dentalStore'
import { useIpdAdmissionStore } from '../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../stores/snackbarStore'

// Import Tab Components
import OverviewTab from './tabs/OverviewTab.vue'
import ChargesTab from './tabs/ChargesTab.vue'
import InstallmentsTab from './tabs/InstallmentsTab.vue'

const route = useRoute()
const router = useRouter()
const dentalStore = useDentalStore()
const ipdAdmissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

const loading = ref(true)
const appointment = ref(null)
const charges = ref([])
const installments = ref([])
const chargeCategories = ref([])
const activeTab = ref('overview')

const changeTreatmentStatus = async (newStatus) => {
  if (confirm(`Change treatment status to ${newStatus}?`)) {
    const res = await dentalStore.updateAppointmentStatus(route.params.id, newStatus)
    if (res.success) {
      snackbarStore.show({ message: 'Treatment status updated', type: 'success' })
      appointment.value.treatmentStatus = newStatus
    } else {
      snackbarStore.show({ message: res.message, type: 'error' })
      // Revert if failed
      appointment.value.treatmentStatus = appointment.value.treatmentStatus === newStatus ? 'ONGOING' : appointment.value.treatmentStatus
    }
  } else {
    // Revert if cancelled
    fetchDetails()
  }
}

onMounted(async () => {
  await fetchDetails()
})

const fetchDetails = async () => {
  loading.value = true
  try {
    const [appRes, charRes, catRes, docRes, instRes] = await Promise.all([
      dentalStore.getAppointmentById(route.params.id),
      dentalStore.getCharges(route.params.id),
      ipdAdmissionStore.fetchChargeCategories(),
      dentalStore.fetchDentalDoctors(),
      dentalStore.getInstallments(route.params.id)
    ])
    
    appointment.value = appRes
    if (charRes.success) charges.value = charRes.data
    if (catRes.success) {
      chargeCategories.value = catRes.data.filter(c => c.code && c.code.toUpperCase().includes('DENTAL'))
      if(chargeCategories.value.length === 0) chargeCategories.value = catRes.data; // fallback
    }
    if (instRes && instRes.success) installments.value = instRes.data
  } catch (error) {
    snackbarStore.show({ message: 'Error loading details', type: 'error' })
  } finally {
    loading.value = false
  }
}

const processedCharges = computed(() => {
  return charges.value.map(charge => {
    const chargeInstallments = installments.value.filter(i => i.dentalPatientChargesId?._id === charge._id && i.status === 'PAID')
    const paidAmount = chargeInstallments.reduce((sum, i) => sum + i.amount, 0)
    const balance = charge.amount - paidAmount
    return {
      ...charge,
      paidAmount,
      balance
    }
  })
})

const totalChargesAmount = computed(() => {
  return charges.value.reduce((sum, c) => sum + (c.amount || 0), 0)
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div v-if="loading" class="flex justify-center p-12">
      <svg class="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    
    <div v-else-if="!appointment" class="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
      <p class="text-slate-500 font-medium">Appointment not found.</p>
      <button @click="router.push({ name: 'dental-appointment' })" class="mt-4 text-indigo-600 hover:underline">Back to List</button>
    </div>
    
    <template v-else>
      <!-- Header with Back Button -->
      <div class="flex items-center gap-3">
        <button 
          @click="router.push({ name: 'dental-appointment' })"
          title="Go Back"
          class="group p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
        >
          <svg class="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            {{ appointment.patientId?.fullName?.charAt(0) }}
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ appointment.patientId?.fullName }}</h1>
            <p class="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
              <span class="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold font-mono">{{ appointment.patientId?.patientCode }}</span>
              <span>•</span>
              <span>{{ appointment.patientId?.mobileNo }}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-3 w-full sm:w-auto">
          <div class="relative group">
            <select 
              v-model="appointment.treatmentStatus" 
              @change="changeTreatmentStatus($event.target.value)"
              class="appearance-none bg-transparent pl-4 pr-8 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="{
                'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500': appointment.treatmentStatus === 'ONGOING',
                'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500': appointment.treatmentStatus === 'COMPLETED',
                'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-500': appointment.treatmentStatus === 'CANCELLED',
                'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100': !['ONGOING', 'COMPLETED', 'CANCELLED'].includes(appointment.treatmentStatus)
              }"
            >
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2" :class="{
                'text-amber-700': appointment.treatmentStatus === 'ONGOING',
                'text-emerald-700': appointment.treatmentStatus === 'COMPLETED',
                'text-rose-700': appointment.treatmentStatus === 'CANCELLED'
            }">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
          <p class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Dr. {{ appointment.doctorId?.fullName }}
          </p>
        </div>
      </div>

      <!-- Professional Segmented Control Tabs -->
      <div class="bg-slate-100/80 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1 border border-slate-200/60 shadow-inner">
        <button 
          @click="activeTab = 'overview'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Overview
        </button>
        <button 
          @click="activeTab = 'charges'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'charges' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          Treatment Charges
        </button>
        <button 
          @click="activeTab = 'installments'" 
          class="flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'installments' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          Installment Payments
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        <OverviewTab 
          v-if="activeTab === 'overview'" 
          :appointment="appointment" 
        />
        
        <ChargesTab 
          v-if="activeTab === 'charges'" 
          :appointment="appointment" 
          :processedCharges="processedCharges"
          @refresh="fetchDetails" 
        />

        <InstallmentsTab 
          v-if="activeTab === 'installments'"
          :appointment="appointment"
          :installments="installments"
          :processedCharges="processedCharges"
          @refresh="fetchDetails"
        />
      </div>
    </template>
  </div>
</template>
