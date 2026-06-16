<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useNursingStore } from '../../../stores/nursingStore'

const snackbar     = useSnackbarStore()
const nursingStore = useNursingStore()

// ── State ─────────────────────────────────────────────────────────────────
const loading = ref(true)
// The API now returns { station, nurses, nurseCount } all-in-one
const station = computed(() => nursingStore.myStation)
const nurses  = computed(() => station.value?.nurses || [])

// ── Helpers ───────────────────────────────────────────────────────────────
const ASSIGNMENT_TYPES = [
  { value: 'INCHARGE',       label: 'In-Charge' },
  { value: 'SENIOR_NURSE',   label: 'Senior Nurse' },
  { value: 'STAFF_NURSE',    label: 'Staff Nurse' },
  { value: 'FLOATING_NURSE', label: 'Floating Nurse' }
]

const typeLabel = (val) => ASSIGNMENT_TYPES.find(t => t.value === val)?.label || val

const typeColors = {
  INCHARGE:       'bg-emerald-50  text-emerald-700  border-emerald-100',
  SENIOR_NURSE:   'bg-violet-50   text-violet-700   border-violet-100',
  STAFF_NURSE:    'bg-indigo-50   text-indigo-700   border-indigo-100',
  FLOATING_NURSE: 'bg-amber-50    text-amber-700    border-amber-100'
}

const typeBg = {
  INCHARGE:       'bg-emerald-500',
  SENIOR_NURSE:   'bg-violet-500',
  STAFF_NURSE:    'bg-indigo-500',
  FLOATING_NURSE: 'bg-amber-500'
}

const getWardName = (ward) => {
  if (!ward) return 'Not Assigned'
  if (typeof ward === 'object' && ward.name) {
    return ward.code ? `${ward.name} (${ward.code})` : ward.name
  }
  const id    = typeof ward === 'object' ? (ward._id || ward).toString() : ward
  const found = (nursingStore.wards || []).find(w => w._id === id)
  return found ? (found.code ? `${found.name} (${found.code})` : found.name) : 'Not Assigned'
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const initials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'

// ── Mount: single API call returns everything ─────────────────────────────
onMounted(async () => {
  await nursingStore.fetchWards()
  const result = await nursingStore.fetchMyStation()
  if (!result) snackbar.show({ message: 'Failed to load your nursing station', type: 'error' })
  loading.value = false
})
</script>

<template>
  <div class="space-y-8 pb-16">

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-40 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      <span class="text-sm font-semibold text-slate-600">Loading your station…</span>
    </div>

    <!-- Not Assigned -->
    <div v-else-if="!station" class="flex flex-col items-center justify-center py-40">
      <div class="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
        <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <p class="text-slate-800 font-bold text-base">Not assigned to any station</p>
      <p class="text-slate-400 text-sm mt-1">Contact your nursing manager to get assigned.</p>
    </div>

    <!-- Main Content -->
    <template v-else>

      <!-- ── Page Header ─────────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Breadcrumb -->
        <nav class="flex items-center text-sm font-medium text-slate-400" aria-label="Breadcrumb">
          <router-link :to="{ name: 'nursing-station' }" class="hover:text-indigo-600 transition-colors">Nursing Stations</router-link>
          <svg class="w-3.5 h-3.5 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span class="text-slate-700 font-semibold">My Station</span>
        </nav>

        <!-- Status pill -->
        <span :class="['px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full border', station.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200']">
          {{ station.isActive ? '● Active' : '○ Inactive' }}
        </span>
      </div>

      <!-- ── Hero Banner ─────────────────────────────────────────────────── -->
      <div class="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-indigo-200">
        <!-- decorative blobs -->
        <div class="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full"/>
        <div class="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full"/>

        <div class="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <!-- Code badge -->
          <div class="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
            <span class="text-white font-black text-lg tracking-tight">{{ station.code }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-black text-white tracking-tight truncate">{{ station.name }}</h1>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-indigo-200 text-sm">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                {{ getWardName(station.wardId) }}
              </span>
              <span v-if="station.location" class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {{ station.location }}
              </span>
              <span v-if="station.contactNo" class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {{ station.contactNo }}
              </span>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 shrink-0">
            <div class="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/15">
              <div class="text-2xl font-black text-white">{{ station.nurseCount || nurses.length }}</div>
              <div class="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Nurses</div>
            </div>
            <div class="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/15">
              <div class="text-2xl font-black text-white">{{ station.assignedBeds?.length || 0 }}</div>
              <div class="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Beds</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Body Grid ───────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Left Column -->
        <div class="lg:col-span-1 space-y-6">

          <!-- Station Details card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Station Details</h2>

            <div class="space-y-3">
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Station Code</span>
                <span class="text-slate-800 font-semibold">{{ station.code }}</span>
              </div>
              <div class="h-px bg-slate-100"/>
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Ward</span>
                <span class="text-slate-800 font-medium">{{ getWardName(station.wardId) }}</span>
              </div>
              <div class="h-px bg-slate-100"/>
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                <span class="text-slate-800 font-medium">{{ station.location || 'Not specified' }}</span>
              </div>
              <div class="h-px bg-slate-100"/>
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact No.</span>
                <span class="text-slate-800 font-medium">{{ station.contactNo || 'Not provided' }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="station.description" class="bg-slate-50 rounded-2xl p-4 mt-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Notes</span>
              <p class="text-slate-600 text-xs leading-relaxed">{{ station.description }}</p>
            </div>
          </div>

          <!-- In-Charge Nurse -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">In-Charge Nurse</h2>
            <div v-if="station.inchargeNurseId" class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-emerald-100">
                {{ initials(station.inchargeNurseId.fullName) }}
              </div>
              <div>
                <span class="text-slate-800 font-bold block">{{ station.inchargeNurseId.fullName }}</span>
                <span class="text-slate-400 text-xs block mt-0.5">{{ station.inchargeNurseId.email }}</span>
                <span v-if="station.inchargeNurseId.employeeCode" class="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md inline-block mt-1">
                  {{ station.inchargeNurseId.employeeCode }}
                </span>
              </div>
            </div>
            <div v-else class="flex items-center gap-3 text-slate-400">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <span class="text-sm">No nurse assigned</span>
            </div>
          </div>

          <!-- Monitored Beds -->
          <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Monitored Beds</h2>
              <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100">
                {{ station.assignedBeds?.length || 0 }}
              </span>
            </div>

            <div class="max-h-72 overflow-y-auto space-y-2 pr-0.5">
              <div
                v-for="bed in station.assignedBeds"
                :key="bed._id"
                class="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl"
              >
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  </div>
                  <span class="font-bold text-slate-800">{{ bed.bedNo }}</span>
                  <span class="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">{{ bed.bedType }}</span>
                </div>
                <div class="text-right">
                  <div class="font-medium text-slate-600 text-[10px]">{{ getWardName(bed.wardId) }}</div>
                  <div v-if="bed.floor || bed.wardId?.floor" class="text-slate-400 text-[9px] mt-0.5">{{ bed.floor || bed.wardId?.floor }}</div>
                </div>
              </div>

              <div v-if="!station.assignedBeds?.length" class="text-center py-8">
                <svg class="w-8 h-8 mx-auto text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                <p class="text-slate-400 text-xs">No beds assigned</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Nurse Assignments -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-slate-800">Station Nursing Team</h2>
                <p class="text-slate-400 text-xs mt-0.5">All active nurses assigned to this station.</p>
              </div>
              <span class="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm">
                {{ nurses.length }} {{ nurses.length === 1 ? 'Nurse' : 'Nurses' }}
              </span>
            </div>

            <!-- Empty -->
            <div v-if="nurses.length === 0" class="flex flex-col items-center justify-center py-20">
              <div class="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <p class="text-slate-700 font-semibold text-sm">No nurses assigned yet</p>
              <p class="text-slate-400 text-xs mt-1">Check back after your nursing manager sets up the team.</p>
            </div>

            <!-- Nurse cards grid -->
            <div v-else class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="a in nurses"
                :key="a._id"
                class="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md rounded-2xl p-4 transition-all duration-200"
              >
                <!-- Type accent line -->
                <div :class="['absolute left-0 top-4 bottom-4 w-1 rounded-r-full', typeBg[a.assignmentType] || 'bg-indigo-400']"/>

                <div class="pl-3 flex items-start gap-3">
                  <!-- Avatar -->
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm', typeBg[a.assignmentType] || 'bg-indigo-500']">
                    {{ initials(a.nurseId?.fullName) }}
                  </div>

                  <!-- Details -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <span class="font-bold text-slate-800 text-sm block truncate">{{ a.nurseId?.fullName || 'Unknown' }}</span>
                        <span class="text-slate-400 text-[10px] block truncate">{{ a.nurseId?.email }}</span>
                        <span v-if="a.nurseId?.employeeCode" class="text-[9px] font-bold text-slate-500 block mt-0.5">{{ a.nurseId.employeeCode }}</span>
                      </div>
                      <span :class="['shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full border', typeColors[a.assignmentType]]">
                        {{ typeLabel(a.assignmentType) }}
                      </span>
                    </div>

                    <!-- Period + status row -->
                    <div class="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
                      <div class="flex-1 text-[10px] text-slate-500">
                        <span class="font-semibold text-slate-600">From</span> {{ fmt(a.startDate) }}
                        <span class="mx-1 text-slate-300">→</span>
                        <span class="font-semibold text-slate-600">{{ a.endDate ? fmt(a.endDate) : 'Ongoing' }}</span>
                      </div>
                      <span :class="['px-1.5 py-0.5 text-[9px] font-bold rounded-full border', a.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200']">
                        {{ a.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>

                    <!-- Remarks -->
                    <p v-if="a.remarks" class="text-[10px] text-slate-400 mt-1.5 truncate" :title="a.remarks">
                      <span class="text-slate-500 font-semibold">Note:</span> {{ a.remarks }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </template>

  </div>
</template>
