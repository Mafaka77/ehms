<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOpdStore } from '../../stores/opdStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import { useAuthStore } from '../../stores/authStore'

import ChargesTab from './tabs/ChargesTab.vue'

const route = useRoute()
const router = useRouter()
const opdStore = useOpdStore()
const snackbarStore = useSnackbarStore()
const authStore = useAuthStore()

const loading = ref(true)
const appointment = ref(null)
const activeTab = ref('overview')

const fetchDetails = async () => {
  loading.value = true
  try {
    const res = await opdStore.getAppointmentById(route.params.id)
    appointment.value = res
  } catch (error) {
    console.error('Error fetching OPD appointment details:', error)
    snackbarStore.show({ message: 'Failed to load appointment details', type: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetails()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Booked': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'Arrived': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'In-Consultation': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center p-16">
      <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>

    <!-- Empty/Error State -->
    <div v-else-if="!appointment" class="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
      <p class="text-slate-500 font-medium">OPD appointment not found.</p>
      <button @click="router.push({ name: 'opd-appointment' })" class="mt-4 text-indigo-600 hover:underline font-bold text-sm">
        ← Back to Appointments List
      </button>
    </div>

    <template v-else>
      <!-- Top Navigation & Header -->
      <div class="flex items-center gap-3">
        <button 
          @click="router.push({ name: 'opd-appointment' })"
          title="Back to Appointments List"
          class="group p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
        >
          <svg class="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">OPD Patient Dashboard</span>
      </div>

      <!-- Main Patient Card Header -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {{ appointment.patientId?.fullName?.charAt(0) || 'P' }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ appointment.patientId?.fullName }}</h1>
              <span v-if="appointment.patientId?.isEmployee" class="px-2 py-0.5 text-[10px] font-extrabold rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                Staff ({{ appointment.patientId?.employeeCode }})
              </span>
            </div>
            <p class="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2 flex-wrap">
              <span class="bg-slate-100 px-2.5 py-0.5 rounded text-slate-700 font-bold font-mono text-xs">{{ appointment.patientId?.patientCode }}</span>
              <span>•</span>
              <span>{{ appointment.patientId?.gender }} ({{ appointment.patientId?.age }} Yrs)</span>
              <span>•</span>
              <span>Mob: {{ appointment.patientId?.mobileNo }}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase">Appointment:</span>
            <span class="font-mono font-extrabold text-indigo-600 text-sm">{{ appointment.appointmentId }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span 
              class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
              :class="getStatusColor(appointment.status)"
            >
              {{ appointment.status }}
            </span>
          </div>
          <p class="text-xs font-bold text-slate-600 flex items-center gap-1.5 mt-1">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            {{ appointment.doctorId?.fullName || 'General Doctor' }}
          </p>
        </div>
      </div>

      <!-- Segmented Control Tabs -->
      <div class="bg-slate-100/80 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1 border border-slate-200/60 shadow-inner w-full md:max-w-xl">
        <button 
          @click="activeTab = 'overview'" 
          class="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5 font-extrabold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Overview & Info
        </button>
        <button 
          v-if="authStore.hasPermission('opd.treatmentcharges')"
          @click="activeTab = 'charges'" 
          class="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'charges' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5 font-extrabold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          Treatment Charges & Billing
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[420px]">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <!-- Patient Demographics Block -->
            <div class="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
              <h3 class="font-extrabold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-200/60 pb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Patient Demographics
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Full Name</span>
                  <span class="font-bold text-slate-800 text-sm">{{ appointment.patientId?.fullName }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Patient Code</span>
                  <span class="font-mono font-bold text-indigo-600">{{ appointment.patientId?.patientCode || '-' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Mobile No</span>
                  <span class="font-semibold text-slate-800">{{ appointment.patientId?.mobileNo || '-' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Gender / Age</span>
                  <span class="font-semibold text-slate-800">{{ appointment.patientId?.gender }} • {{ appointment.patientId?.age }} Years</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Email</span>
                  <span class="font-medium text-slate-700">{{ appointment.patientId?.email || '-' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Address</span>
                  <span class="font-medium text-slate-700">{{ appointment.patientId?.address || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Consultation Details Block -->
            <div class="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
              <h3 class="font-extrabold text-slate-700 uppercase tracking-wider text-xs border-b border-slate-200/60 pb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Consultation & Doctor Info
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Consulting Doctor</span>
                  <span class="font-bold text-slate-800 text-sm">{{ appointment.doctorId?.fullName || 'General' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Specialization</span>
                  <span class="font-semibold text-indigo-600">{{ appointment.doctorId?.specializationId?.name || 'General OPD' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Appointment Date</span>
                  <span class="font-semibold text-slate-800">{{ formatDate(appointment.appointmentDate) }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Consultation Fee</span>
                  <span class="font-mono font-bold text-slate-900 text-sm">₹{{ appointment.consultationFee || 0 }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Payment Status</span>
                  <span :class="[
                    'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border mt-0.5',
                    appointment.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                  ]">
                    {{ appointment.paymentStatus || 'Unpaid' }}
                  </span>
                </div>
                <div>
                  <span class="text-slate-400 block font-bold uppercase">Status</span>
                  <span class="font-bold text-slate-800">{{ appointment.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes / Remarks Block -->
          <div v-if="appointment.notes" class="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 text-xs">
            <h4 class="font-bold text-indigo-900 uppercase tracking-wider mb-1">Appointment Notes</h4>
            <p class="text-slate-700 leading-relaxed">{{ appointment.notes }}</p>
          </div>
        </div>

        <!-- Treatment Charges Tab -->
        <div v-else-if="activeTab === 'charges' && authStore.hasPermission('opd.treatmentcharges')">
          <ChargesTab 
            :appointment="appointment" 
            @refresh="fetchDetails" 
          />
        </div>
      </div>
    </template>
  </div>
</template>
