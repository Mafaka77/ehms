<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useDashboardStore } from '../../stores/dashboardStore'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const userName = computed(() => {
  const u = authStore.user
  return u?.name || u?.fullName || u?.email || 'User'
})

const userRole = computed(() => {
  return authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role || 'Staff'
})

const today = computed(() => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
})

const fmtRupee = (n) => {
  if (n == null || n === 0) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ── Bed helpers & sorting ───────────────────────────────────────────────────
const selectedWardFilter = ref('ALL')

const beds = computed(() => {
  const list = dashboardStore.activity?.beds || []
  const statusOrder = { AVAILABLE: 1, OCCUPIED: 2, RESERVED: 3, MAINTENANCE: 4 }
  return [...list].sort((a, b) => {
    const orderA = statusOrder[a.status] || 99
    const orderB = statusOrder[b.status] || 99
    if (orderA !== orderB) return orderA - orderB
    return (a.bedNo || '').localeCompare(b.bedNo || '', undefined, { numeric: true, sensitivity: 'base' })
  })
})

const bedStats = computed(() => {
  const list = beds.value
  const available = list.filter(b => b.status === 'AVAILABLE').length
  const occupied = list.filter(b => b.status === 'OCCUPIED').length
  const maintenance = list.filter(b => b.status === 'MAINTENANCE').length
  const reserved = list.filter(b => b.status === 'RESERVED').length
  return { total: list.length, available, occupied, maintenance, reserved }
})

const wardGroups = computed(() => {
  const map = {}
  const statusOrder = { AVAILABLE: 1, OCCUPIED: 2, RESERVED: 3, MAINTENANCE: 4 }

  beds.value.forEach(bed => {
    const wardId = bed.wardId?._id || 'unassigned'
    const wardName = bed.wardId?.name || 'Unassigned Ward'
    const wardCode = bed.wardId?.code || ''
    const wardType = bed.wardId?.wardType || ''
    const floor = bed.wardId?.floor || bed.floor || ''

    if (!map[wardId]) {
      map[wardId] = {
        id: wardId,
        name: wardName,
        code: wardCode,
        wardType,
        floor,
        beds: []
      }
    }
    map[wardId].beds.push(bed)
  })

  return Object.values(map).map(ward => {
    const sortedBeds = [...ward.beds].sort((a, b) => {
      const orderA = statusOrder[a.status] || 99
      const orderB = statusOrder[b.status] || 99
      if (orderA !== orderB) return orderA - orderB
      return (a.bedNo || '').localeCompare(b.bedNo || '', undefined, { numeric: true, sensitivity: 'base' })
    })

    const availableCount = sortedBeds.filter(b => b.status === 'AVAILABLE').length
    const occupiedCount = sortedBeds.filter(b => b.status === 'OCCUPIED').length
    const maintenanceCount = sortedBeds.filter(b => b.status === 'MAINTENANCE').length
    const reservedCount = sortedBeds.filter(b => b.status === 'RESERVED').length
    const totalCount = sortedBeds.length

    return {
      ...ward,
      beds: sortedBeds,
      availableCount,
      occupiedCount,
      maintenanceCount,
      reservedCount,
      totalCount
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

const displayedWardGroups = computed(() => {
  if (selectedWardFilter.value === 'ALL') return wardGroups.value
  return wardGroups.value.filter(w => w.id === selectedWardFilter.value)
})

const bedStatusClass = (status) => {
  const map = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OCCUPIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
    MAINTENANCE: 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return map[status] || 'bg-slate-50 text-slate-700 border-slate-200'
}

const bedStatusDotClass = (status) => {
  const map = {
    AVAILABLE: 'bg-emerald-500',
    OCCUPIED: 'bg-indigo-500',
    RESERVED: 'bg-amber-500',
    MAINTENANCE: 'bg-rose-500'
  }
  return map[status] || 'bg-slate-400'
}

// ── Top Stats Cards ─────────────────────────────────────────────────────────
const statsCards = computed(() => [
  {
    label: 'Total Ward Beds',
    value: bedStats.value.total,
    sub: `${wardGroups.value.length} Wards configured`,
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100'
  },
  {
    label: 'Available Beds',
    value: bedStats.value.available,
    sub: `${bedStats.value.total ? Math.round((bedStats.value.available / bedStats.value.total) * 100) : 0}% available now`,
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100'
  },
  {
    label: 'Occupied Beds',
    value: bedStats.value.occupied,
    sub: `${bedStats.value.total ? Math.round((bedStats.value.occupied / bedStats.value.total) * 100) : 0}% occupancy rate`,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100'
  },
  {
    label: 'Maintenance / Reserved',
    value: bedStats.value.maintenance + bedStats.value.reserved,
    sub: `${bedStats.value.maintenance} maint · ${bedStats.value.reserved} reserved`,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100'
  }
])

onMounted(async () => {
  await dashboardStore.fetchRecentActivity()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 space-y-6 pb-10">

    <!-- Header Banner -->
    <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
            {{ userRole }} Portal
          </span>
          <span class="text-xs text-slate-400">• {{ today }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900">
          Welcome back, <span class="text-indigo-600">{{ userName }}</span>!
        </h1>
        <p class="text-xs text-slate-500 mt-1">Live ward bed occupancy and availability overview.</p>
      </div>

      <!-- <div class="flex items-center gap-3 w-full md:w-auto">
        <button
          @click="router.push('/ipd/ward')"
          class="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>View Wards</span>
        </button>
      </div> -->
    </div>

    <!-- Bed KPI Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="s in statsCards"
        :key="s.label"
        class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{ s.label }}</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ s.value }}</p>
          <p class="text-[10px] text-slate-400 font-medium mt-1">{{ s.sub }}</p>
        </div>
        <div :class="[s.bg, s.text, 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', s.border]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" />
          </svg>
        </div>
      </div>
    </div>

    <!-- ── Ward Beds Overview (Categorized by Ward) ─────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Main Card Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-800">Ward Beds & Availability</h2>
              <span class="text-xs font-semibold text-slate-400">({{ bedStats.total }} Beds · {{ wardGroups.length }} Wards)</span>
            </div>
            <p class="text-[11px] text-slate-400">Categorized by ward with available beds prioritized first</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {{ bedStats.available }} Available
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            {{ bedStats.occupied }} Occupied
          </span>
          <span v-if="bedStats.maintenance > 0" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            {{ bedStats.maintenance }} Maintenance
          </span>
          <!-- <button @click="router.push('/ipd/ward')" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors ml-2 cursor-pointer">
            Manage Wards →
          </button> -->
        </div>
      </div>

      <!-- Ward Filter Tabs -->
      <div v-if="wardGroups.length > 1" class="px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">Filter Ward:</span>
        <button
          type="button"
          @click="selectedWardFilter = 'ALL'"
          class="px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
          :class="selectedWardFilter === 'ALL'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
        >
          All Wards ({{ wardGroups.length }})
        </button>
        <button
          v-for="wg in wardGroups"
          :key="wg.id"
          type="button"
          @click="selectedWardFilter = wg.id"
          class="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          :class="selectedWardFilter === wg.id
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
        >
          <span>{{ wg.name }}</span>
          <span
            class="px-1.5 py-0.2 rounded text-[10px]"
            :class="selectedWardFilter === wg.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 font-semibold'"
          >
            {{ wg.availableCount }}/{{ wg.totalCount }} Avail
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.loadingActivity" class="p-6 space-y-4">
        <div v-for="i in 3" :key="i" class="p-4 rounded-xl border border-slate-100 space-y-3 animate-pulse">
          <div class="h-4 bg-slate-200 rounded w-48"></div>
          <div class="space-y-2">
            <div class="h-3 bg-slate-100 rounded w-full"></div>
            <div class="h-3 bg-slate-100 rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Categorized Wards Content -->
      <div v-else-if="displayedWardGroups.length" class="divide-y divide-slate-100">
        <div
          v-for="wg in displayedWardGroups"
          :key="wg.id"
          class="p-6 space-y-3"
        >
          <!-- Ward Header Banner -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span v-if="wg.code" class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-black font-mono border border-indigo-100">
                {{ wg.code }}
              </span>
              <h3 class="text-sm font-extrabold text-slate-900">{{ wg.name }}</h3>
              <span v-if="wg.wardType" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                {{ wg.wardType }}
              </span>
              <span v-if="wg.floor" class="text-xs text-slate-400">
                · Floor: {{ wg.floor }}
              </span>
            </div>

            <!-- Ward Availability Pill -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">
                <strong class="text-emerald-600 font-bold">{{ wg.availableCount }}</strong> of {{ wg.totalCount }} Available
              </span>
              <div class="w-16 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  class="bg-emerald-500 h-full transition-all"
                  :style="`width: ${wg.totalCount ? (wg.availableCount / wg.totalCount) * 100 : 0}%`"
                ></div>
                <div
                  class="bg-indigo-500 h-full transition-all"
                  :style="`width: ${wg.totalCount ? (wg.occupiedCount / wg.totalCount) * 100 : 0}%`"
                ></div>
              </div>
            </div>
          </div>

          <!-- Ward Beds Table (Available First) -->
          <div class="rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50/70">
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bed No.</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bed Type</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Rate</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nursing Station</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 bg-white">
                <tr
                  v-for="b in wg.beds"
                  :key="b._id"
                  class="hover:bg-indigo-50/20 transition-all cursor-pointer"
                >
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span class="text-xs font-bold text-slate-800">{{ b.bedNo }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {{ b.bedType || 'GENERAL' }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-xs text-slate-700 font-semibold">
                    {{ b.dailyRate != null ? fmtRupee(b.dailyRate) + '/day' : '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-xs text-slate-500">
                    {{ b.nursingStationId?.name || '—' }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      :class="[bedStatusClass(b.status), 'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5']"
                    >
                      <span :class="[bedStatusDotClass(b.status), 'w-1.5 h-1.5 rounded-full', b.status === 'AVAILABLE' ? 'animate-pulse' : '']"></span>
                      {{ b.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="py-12 text-center text-slate-400 text-sm">No beds configured yet</div>
    </div>

  </div>
</template>
