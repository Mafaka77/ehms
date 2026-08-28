<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorActivityStore } from '../../../stores/doctorActivityStore'

import ActiveIpdTab from './tabs/ActiveIpdTab.vue'
import OpdConsultationTab from './tabs/OpdConsultationTab.vue'
import DentalChargesTab from './tabs/DentalChargesTab.vue'
import ActivityTab from './tabs/ActivityTab.vue'

const route = useRoute()
const router = useRouter()
const doctorActivityStore = useDoctorActivityStore()

const activeTab = ref('activity') // 'activity', 'ipd', 'opd', 'dental'

const doctorId = computed(() => route.params.id)

const data = computed(() => doctorActivityStore.activityDetails)
const doctor = computed(() => data.value?.doctor)
const metrics = computed(() => data.value?.metrics)
const activeAdmissions = computed(() => data.value?.activeAdmissions || [])
const recentAppointments = computed(() => data.value?.recentAppointments || [])
const dentalCharges = computed(() => data.value?.dentalCharges || [])

onMounted(() => {
  if (doctorId.value) {
    doctorActivityStore.fetchDoctorActivityById(doctorId.value)
  }
})
</script>

<template>
  <div class="space-y-6 pb-12">

    <!-- Header Navigation -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/doctor-activity')"
          class="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-900">Doctor Activity Profile</h1>
          <p class="text-xs text-slate-400">Detailed breakdown of clinical &amp; operational activity</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="doctorActivityStore.loading" class="p-8 space-y-4 animate-pulse">
      <div class="h-32 bg-slate-100 rounded-2xl"></div>
      <div class="h-64 bg-slate-100 rounded-2xl"></div>
    </div>

    <div v-else-if="doctor" class="space-y-6">

      <!-- Doctor Profile Header Card -->
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200 shrink-0">
            {{ (doctor.fullName || 'D')[0] }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-black text-slate-900"> {{ doctor.fullName }}</h2>
              <span class="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {{ doctor.doctorCode }}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ doctor.specializationId?.name || 'General Physician' }}
              <span v-if="doctor.qualification">• {{ doctor.qualification }}</span>
            </p>
            <p class="text-[11px] text-slate-400 mt-1">
              Mobile: <span class="font-semibold text-slate-700">{{ doctor.mobileNo || '—' }}</span>
              <span v-if="doctor.email" class="ml-3">Email: <span class="font-semibold text-slate-700">{{ doctor.email }}</span></span>
            </p>
          </div>
        </div>

        <!-- Metrics pill badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto text-center">
          <div class="bg-sky-50 border border-sky-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-sky-600 uppercase tracking-wider">OPD Today</p>
            <p class="text-xl font-black text-sky-700 mt-0.5">{{ metrics?.opdTodayCount || 0 }}</p>
          </div>
          <div class="bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Active IPD</p>
            <p class="text-xl font-black text-violet-700 mt-0.5">{{ metrics?.activeIpdCount || 0 }}</p>
          </div>
          <div class="bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Dental Charges</p>
            <p class="text-xl font-black text-teal-700 mt-0.5">{{ metrics?.dentalChargesCount || dentalCharges.length || 0 }}</p>
          </div>
          <div class="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total OPD</p>
            <p class="text-xl font-black text-indigo-700 mt-0.5">{{ metrics?.opdTotalCount || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Activity Tab Switcher & Container -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div class="flex items-center border-b border-slate-100 bg-slate-50/50 px-4 overflow-x-auto">
          
          <!-- Tab 1: Activity Breakdown (Default) -->
          <button
            @click="activeTab = 'activity'"
            :class="activeTab === 'activity' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Activity Breakdown</span>
          </button>

          <!-- Tab 2: Active IPD Admissions -->
          <button
            @click="activeTab = 'ipd'"
            :class="activeTab === 'ipd' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>Active IPD Admissions</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-violet-100 text-violet-700 font-bold">
              {{ activeAdmissions.length }}
            </span>
          </button>

          <!-- Tab 3: Recent OPD Consultations -->
          <button
            @click="activeTab = 'opd'"
            :class="activeTab === 'opd' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>OPD Consultations</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700 font-bold">
              {{ recentAppointments.length }}
            </span>
          </button>

          <!-- Tab 4: Dental Treatment Charges -->
          <button
            @click="activeTab = 'dental'"
            :class="activeTab === 'dental' ? 'border-teal-600 text-teal-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>Dental Charges</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-700 font-bold">
              {{ dentalCharges.length }}
            </span>
          </button>

        </div>

        <!-- Render active tab component -->
        <ActivityTab
          v-if="activeTab === 'activity'"
          :doctorId="doctorId"
        />

        <ActiveIpdTab
          v-else-if="activeTab === 'ipd'"
          :activeAdmissions="activeAdmissions"
          :doctorName="doctor.fullName"
        />

        <OpdConsultationTab
          v-else-if="activeTab === 'opd'"
          :appointments="recentAppointments"
        />

        <DentalChargesTab
          v-else-if="activeTab === 'dental'"
          :dentalCharges="dentalCharges"
          :doctorName="doctor.fullName"
        />

      </div>

    </div>

    <div v-else class="p-12 text-center text-slate-400 text-sm">
      Doctor activity profile not found
    </div>

  </div>
</template>
