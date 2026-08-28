<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

const userName = computed(() => {
  const u = authStore.user
  return u?.name || u?.fullName || u?.email || 'Admin'
})

const today = computed(() => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
})

const stats = computed(() => dashboardStore.stats)
const activity = computed(() => dashboardStore.activity)
const chartData = computed(() => dashboardStore.chartData)

// ── Chart rendering ─────────────────────────────────────────────────────────
const maxChartValue = computed(() => {
  if (!chartData.value?.length) return 1
  return Math.max(...chartData.value.flatMap(m => [m.patients, m.appointments, m.admissions]), 1)
})

const chartBar = (value) => {
  return Math.round((value / maxChartValue.value) * 100)
}

// ── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-IN')
}

const fmtRupee = (n) => {
  if (n == null || n === 0) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

const growthClass = (pct) => {
  if (pct == null) return 'text-slate-400'
  return pct >= 0 ? 'text-emerald-600' : 'text-rose-500'
}

const growthBgClass = (pct) => {
  if (pct == null) return 'bg-slate-100'
  return pct >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
}

const growthIcon = (pct) => pct != null && pct < 0 ? '↓' : '↑'

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const statusColor = (s) => {
  const map = {
    Admitted: 'bg-blue-100 text-blue-700',
    Discharged: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-rose-100 text-rose-600',
    Scheduled: 'bg-indigo-100 text-indigo-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700'
  }
  return map[s] || 'bg-slate-100 text-slate-600'
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

// ── Quick action cards ───────────────────────────────────────────────────────
const quickActions = [
  { label: 'New Patient', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200', route: '/patients' },
  { label: 'OPD Appointment', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-sky-600 hover:bg-sky-700 shadow-sky-200', route: '/opd/create' },
  { label: 'IPD Admission', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200', route: '/ipd/admissions' },
  { label: 'Pharmacy', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200', route: '/pharmacy/stocks' },
]

onMounted(async () => {
  await Promise.all([
    dashboardStore.fetchAdminStats(),
    dashboardStore.fetchRecentActivity(),
    dashboardStore.fetchChartData()
  ])
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 space-y-6 pb-10">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
      <div>
        <p class="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-0.5">Admin Dashboard</p>
        <h1 class="text-2xl font-extrabold text-slate-900 leading-tight">
          Good {{ new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening' }},
          <span class="text-indigo-600">{{ userName }}</span> 👋
        </h1>
        <p class="text-xs text-slate-400 mt-1">{{ today }}</p>
      </div>
      <!-- <div class="flex items-center gap-2 flex-wrap">
        <button
          v-for="qa in quickActions"
          :key="qa.label"
          @click="router.push(qa.route)"
          :class="[qa.color, 'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer']"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="qa.icon" />
          </svg>
          {{ qa.label }}
        </button>
      </div> -->
    </div>

    <!-- ── Loading Skeleton ──────────────────────────────────────────────── -->
    <div v-if="dashboardStore.loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="bg-white rounded-2xl p-6 animate-pulse">
        <div class="h-3 bg-slate-200 rounded w-2/3 mb-3"></div>
        <div class="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- ── KPI Grid ──────────────────────────────────────────────────────── -->
    <div v-if="stats && !dashboardStore.loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

      <!-- Total Patients -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Patients</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.patients?.total) }}</p>
            <div class="flex items-center gap-1.5 mt-2">
              <span :class="[growthBgClass(stats.patients?.growthPercent), 'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5', growthClass(stats.patients?.growthPercent)]">
                {{ growthIcon(stats.patients?.growthPercent) }} {{ Math.abs(stats.patients?.growthPercent) ?? '—' }}%
              </span>
              <span class="text-[10px] text-slate-400">vs last month</span>
            </div>
          </div>
          <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">New today</span>
          <span class="text-sm font-extrabold text-blue-600">+{{ fmt(stats.patients?.today) }}</span>
        </div>
      </div>

      <!-- OPD Appointments -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">OPD Today</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.appointments?.today) }}</p>
            <div class="flex items-center gap-1.5 mt-2">
              <span :class="[growthBgClass(stats.appointments?.growthPercent), 'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5', growthClass(stats.appointments?.growthPercent)]">
                {{ growthIcon(stats.appointments?.growthPercent) }} {{ Math.abs(stats.appointments?.growthPercent) ?? '—' }}%
              </span>
              <span class="text-[10px] text-slate-400">vs last month</span>
            </div>
          </div>
          <div class="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">This month</span>
          <span class="text-sm font-extrabold text-sky-600">{{ fmt(stats.appointments?.thisMonth) }}</span>
        </div>
      </div>

      <!-- IPD Active -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">IPD Active</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.ipd?.activeAdmissions) }}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+{{ stats.ipd?.admittedToday ?? 0 }} admitted</span>
            </div>
          </div>
          <div class="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Discharged today</span>
          <span class="text-sm font-extrabold text-emerald-600">{{ fmt(stats.ipd?.dischargedToday) }}</span>
        </div>
      </div>

      <!-- Revenue -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue (Month)</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmtRupee(stats.revenue?.thisMonth) }}</p>
            <div class="flex items-center gap-1.5 mt-2">
              <span :class="[growthBgClass(stats.revenue?.growthPercent), 'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5', growthClass(stats.revenue?.growthPercent)]">
                {{ growthIcon(stats.revenue?.growthPercent) }} {{ Math.abs(stats.revenue?.growthPercent) ?? '—' }}%
              </span>
              <span class="text-[10px] text-slate-400">vs last month</span>
            </div>
          </div>
          <div class="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Today's collection</span>
          <span class="text-sm font-extrabold text-emerald-600">{{ fmtRupee(stats.revenue?.today) }}</span>
        </div>
      </div>

      <!-- Staff / Doctors -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-fuchsia-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctors</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.staff?.doctors) }}</p>
            <p class="text-[10px] text-slate-400 mt-2">Active &amp; on duty</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Total staff</span>
          <span class="text-sm font-extrabold text-fuchsia-600">{{ fmt(stats.staff?.employees) }}</span>
        </div>
      </div>

      <!-- Lab Orders -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lab Orders Today</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.modules?.labOrdersToday) }}</p>
            <p class="text-[10px] text-slate-400 mt-2">Laboratory tests ordered</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Radiology today</span>
          <span class="text-sm font-extrabold text-amber-600">{{ fmt(stats.modules?.radOrdersToday) }}</span>
        </div>
      </div>

      <!-- Emergency -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-rose-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Emergency Today</p>
            <p class="text-3xl font-black text-slate-900 mt-1">{{ fmt(stats.modules?.emergencyToday) }}</p>
            <p class="text-[10px] text-slate-400 mt-2">Emergency visits</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
        </div>
        <div class="relative mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">Pharmacy sales today</span>
          <span class="text-sm font-extrabold text-rose-600">{{ fmt(stats.modules?.pharmacySalesToday) }}</span>
        </div>
      </div>

      <!-- This Month Summary card -->
      <div class="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white group relative overflow-hidden">
        <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        <p class="text-xs font-semibold text-indigo-200 uppercase tracking-wide">This Month</p>
        <p class="text-3xl font-black text-white mt-1">{{ fmt(stats.patients?.thisMonth) }}</p>
        <p class="text-xs text-indigo-200 mt-1">New patients registered</p>
        <div class="mt-4 flex items-center gap-2 flex-wrap">
          <span class="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{{ fmt(stats.appointments?.thisMonth) }} OPD</span>
          <span class="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{{ fmt(stats.ipd?.activeAdmissions) }} IPD</span>
        </div>
      </div>
    </div>

    <!-- ── Main Content: Chart + Activity ───────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Bar Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-bold text-slate-800">Monthly Overview</h2>
            <p class="text-xs text-slate-400">Last 6 months — Patients · OPD · IPD</p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-semibold">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>Patients</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-sky-400 inline-block"></span>OPD</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-violet-400 inline-block"></span>IPD</span>
          </div>
        </div>

        <!-- Skeleton -->
        <div v-if="dashboardStore.loadingChart" class="flex items-end gap-3 h-44 animate-pulse">
          <div v-for="i in 6" :key="i" class="flex-1 flex flex-col items-center gap-1">
            <div class="flex gap-0.5 items-end w-full justify-center" style="height:140px">
              <div class="w-4 bg-slate-200 rounded-t" style="height:60px"></div>
              <div class="w-4 bg-slate-200 rounded-t" style="height:40px"></div>
              <div class="w-4 bg-slate-200 rounded-t" style="height:25px"></div>
            </div>
            <div class="h-3 bg-slate-200 rounded w-8"></div>
          </div>
        </div>

        <div v-else-if="chartData.length" class="flex items-end gap-2 h-44">
          <div v-for="month in chartData" :key="month.label" class="flex-1 flex flex-col items-center gap-1.5">
            <div class="flex gap-1 items-end w-full justify-center" style="height: 140px">
              <div
                class="flex-1 min-w-[6px] bg-indigo-500 rounded-t transition-all duration-700 hover:opacity-80 cursor-pointer"
                :style="`height: ${chartBar(month.patients)}%`"
                :title="`Patients: ${month.patients}`"
              ></div>
              <div
                class="flex-1 min-w-[6px] bg-sky-400 rounded-t transition-all duration-700 hover:opacity-80 cursor-pointer"
                :style="`height: ${chartBar(month.appointments)}%`"
                :title="`OPD: ${month.appointments}`"
              ></div>
              <div
                class="flex-1 min-w-[6px] bg-violet-400 rounded-t transition-all duration-700 hover:opacity-80 cursor-pointer"
                :style="`height: ${chartBar(month.admissions)}%`"
                :title="`IPD: ${month.admissions}`"
              ></div>
            </div>
            <span class="text-[10px] font-semibold text-slate-500">{{ month.label }}</span>
          </div>
        </div>

        <div v-else class="h-44 flex items-center justify-center text-slate-400 text-sm">
          No data available yet
        </div>

        <!-- Chart value row -->
        <div v-if="chartData.length && !dashboardStore.loadingChart" class="grid grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-100">
          <div v-for="month in chartData" :key="month.label + '_val'" class="text-center">
            <p class="text-[9px] font-bold text-indigo-600">{{ month.patients }}</p>
            <p class="text-[9px] font-bold text-sky-500">{{ month.appointments }}</p>
            <p class="text-[9px] font-bold text-violet-500">{{ month.admissions }}</p>
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
        <h2 class="text-base font-bold text-slate-800 mb-4">Recent Activity</h2>

        <div v-if="dashboardStore.loadingActivity" class="space-y-3 flex-1">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 animate-pulse">
            <div class="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
            <div class="flex-1">
              <div class="h-3 bg-slate-200 rounded w-3/4 mb-1"></div>
              <div class="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <div v-else-if="activity" class="space-y-0 flex-1 overflow-y-auto max-h-72">
          <!-- Recent Patients -->
          <div
            v-for="p in activity.recentPatients" :key="p._id"
            class="flex items-center gap-3 py-2.5 border-b border-slate-50 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-all cursor-pointer"
            @click="router.push('/patients')"
          >
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
              {{ (p.fullName || '?')[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">{{ p.fullName }}</p>
              <p class="text-[10px] text-slate-400">{{ p.patientCode }} · New Patient</p>
            </div>
            <span class="text-[9px] text-slate-400 shrink-0">{{ timeAgo(p.createdAt) }}</span>
          </div>

          <!-- Recent Admissions -->
          <div
            v-for="a in activity.recentAdmissions" :key="a._id"
            class="flex items-center gap-3 py-2.5 border-b border-slate-50 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-all cursor-pointer"
            @click="router.push('/ipd/admissions')"
          >
            <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">{{ a.patientId?.fullName || '—' }}</p>
              <p class="text-[10px] text-slate-400">IPD · {{ a.status }}</p>
            </div>
            <span :class="[statusColor(a.status), 'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0']">{{ a.status }}</span>
          </div>

          <!-- Recent Appointments -->
          <div
            v-for="ap in activity.recentAppointments" :key="ap._id"
            class="flex items-center gap-3 py-2.5 border-b border-slate-50 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-all cursor-pointer"
            @click="router.push('/opd/appointment')"
          >
            <div class="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">{{ ap.patientId?.fullName || '—' }}</p>
              <p class="text-[10px] text-slate-400">OPD · {{ ap.doctorId?.fullName || '—' }}</p>
            </div>
            <span :class="[statusColor(ap.status), 'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0']">{{ ap.status }}</span>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-slate-400 text-sm">
          No recent activity
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
          <button @click="router.push('/ipd/ward')" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors ml-2 cursor-pointer">
            Manage Wards →
          </button>
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
                  @click="router.push('/ipd/ward')"
                >
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
