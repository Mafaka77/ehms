<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

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

// Dummy data for non-admin dashboard
const stats = ref([
  { label: "Today's Appointments", value: '14', change: '+2 from yesterday', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { label: 'Pending Visits', value: '5', change: '3 priority', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-amber-50', text: 'text-amber-600' },
  { label: 'Completed Today', value: '9', change: '64% completion rate', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { label: 'Assigned Patients', value: '32', change: '4 active IPD', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'bg-sky-50', text: 'text-sky-600' }
])

const upcomingAppointments = ref([
  { id: 'APP-0101', patientName: 'Zomingthanga', time: '10:30 AM', type: 'OPD Consultation', status: 'In Progress', doctor: 'Dr. Lalrinsanga' },
  { id: 'APP-0102', patientName: 'Lalthlamuani', time: '11:15 AM', type: 'Follow Up', status: 'Scheduled', doctor: 'Dr. Vanlalruata' },
  { id: 'APP-0103', patientName: 'Robert Lalthantluanga', time: '02:00 PM', type: 'Routine Checkup', status: 'Scheduled', doctor: 'Dr. Lalhminghlua' },
  { id: 'APP-0104', patientName: 'C. Lalramchhani', time: '03:30 PM', type: 'Lab Review', status: 'Waiting', doctor: 'Dr. Zosangliana' }
])

const announcements = ref([
  { id: 1, title: 'System Maintenance Notice', date: 'Today, 8:00 PM', desc: 'Scheduled system update for 15 mins tonight.', tag: 'System', color: 'bg-blue-100 text-blue-700' },
  { id: 2, title: 'Infection Control Protocol Updated', date: 'Yesterday', desc: 'Please review the updated safety guidelines in nursing handbook.', tag: 'Protocol', color: 'bg-amber-100 text-amber-700' },
  { id: 3, title: 'Monthly Department Meeting', date: 'Fri, 10 Aug', desc: 'All clinical staff meeting in Conference Room B at 4 PM.', tag: 'Meeting', color: 'bg-indigo-100 text-indigo-700' }
])

const quickShortcuts = [
  { name: 'Patient Directory', desc: 'Search & register patients', route: '/patients', bg: 'hover:bg-indigo-50/60 border-indigo-100', iconColor: 'text-indigo-600 bg-indigo-100' },
  { name: 'OPD Management', desc: 'View today\'s OPD appointments', route: '/opd/appointment', bg: 'hover:bg-sky-50/60 border-sky-100', iconColor: 'text-sky-600 bg-sky-100' },
  { name: 'IPD Admissions', desc: 'Manage wards & admitted patients', route: '/ipd/admissions', bg: 'hover:bg-violet-50/60 border-violet-100', iconColor: 'text-violet-600 bg-violet-100' },
  { name: 'Pharmacy Stocks', desc: 'Check available medicines', route: '/pharmacy/stocks', bg: 'hover:bg-emerald-50/60 border-emerald-100', iconColor: 'text-emerald-600 bg-emerald-100' }
]
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
        <p class="text-xs text-slate-500 mt-1">Here is an overview of your schedule and quick actions for today.</p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <button
          @click="router.push('/opd/create')"
          class="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Appointment</span>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{ s.label }}</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{{ s.value }}</p>
          <p class="text-[10px] text-slate-400 font-medium mt-1">{{ s.change }}</p>
        </div>
        <div :class="[s.bg, s.text, 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0']">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Main Section: Upcoming Appointments & Announcements -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Today's Schedule Table -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">Today's Appointments & Schedule</h2>
              <p class="text-xs text-slate-400">Scheduled consultations for today</p>
            </div>
            <button @click="router.push('/opd/appointment')" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-all cursor-pointer">
              View All →
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 px-3">Time</th>
                  <th class="py-2.5 px-3">Patient</th>
                  <th class="py-2.5 px-3">Type</th>
                  <th class="py-2.5 px-3">Doctor</th>
                  <th class="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 text-xs">
                <tr v-for="app in upcomingAppointments" :key="app.id" class="hover:bg-slate-50/60 transition-all">
                  <td class="py-3 px-3 font-semibold text-slate-700">{{ app.time }}</td>
                  <td class="py-3 px-3">
                    <p class="font-bold text-slate-900">{{ app.patientName }}</p>
                    <p class="text-[10px] text-slate-400">{{ app.id }}</p>
                  </td>
                  <td class="py-3 px-3 font-medium text-slate-600">{{ app.type }}</td>
                  <td class="py-3 px-3 text-slate-600">{{ app.doctor }}</td>
                  <td class="py-3 px-3 text-right">
                    <span
                      class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                      :class="{
                        'bg-amber-50 text-amber-600 border border-amber-100': app.status === 'In Progress',
                        'bg-indigo-50 text-indigo-600 border border-indigo-100': app.status === 'Scheduled',
                        'bg-sky-50 text-sky-600 border border-sky-100': app.status === 'Waiting'
                      }"
                    >
                      {{ app.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Announcements & Quick Links -->
      <div class="space-y-6">

        <!-- Announcements Card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
          <h2 class="text-base font-bold text-slate-900 mb-4">Announcements & Notices</h2>
          <div class="space-y-3">
            <div
              v-for="item in announcements"
              :key="item.id"
              class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1"
            >
              <div class="flex items-center justify-between">
                <span :class="[item.color, 'text-[9px] font-bold px-2 py-0.5 rounded-md']">{{ item.tag }}</span>
                <span class="text-[10px] text-slate-400 font-medium">{{ item.date }}</span>
              </div>
              <p class="text-xs font-bold text-slate-800">{{ item.title }}</p>
              <p class="text-[11px] text-slate-500 leading-snug">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Modules Grid -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
          <h2 class="text-base font-bold text-slate-900 mb-3">Quick Navigation</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="q in quickShortcuts"
              :key="q.name"
              @click="router.push(q.route)"
              :class="[q.bg, 'p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer']"
            >
              <div :class="[q.iconColor, 'w-7 h-7 rounded-lg flex items-center justify-center mb-2']">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800 leading-tight">{{ q.name }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">{{ q.desc }}</p>
              </div>
            </button>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
