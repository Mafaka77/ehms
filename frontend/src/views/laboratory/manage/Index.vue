<script setup>
import { ref, onMounted } from 'vue'
import { useLabStore } from '../../../stores/labStore'
import OutpatientOrders from './OutpatientOrders.vue'
import IPDOrders from './IPDOrders.vue'

const labStore = useLabStore()
const activeTab = ref('outpatient')

const fetchStats = async () => {
  await labStore.fetchStats()
}

onMounted(async () => {
  await fetchStats()
})
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Manage Laboratory</h1>
      <p class="text-slate-500 mt-1 text-sm">Overview of lab tests and patient orders.</p>
    </div>

    <!-- 4 Info Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Card 1 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Available Tests</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ labStore.stats.totalTests }}</h3>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Pending Billing</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ labStore.stats.pendingOrders }}</h3>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Completed Lab Orders</p>
          <h3 class="text-2xl font-bold text-slate-900">{{ labStore.stats.completedOrders }}</h3>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Total Revenue</p>
          <h3 class="text-2xl font-bold text-slate-900">₹{{ labStore.stats.revenue.toLocaleString() }}</h3>
        </div>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="border-b border-slate-100 flex items-center gap-1 select-none">
      <button 
        @click="activeTab = 'outpatient'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none cursor-pointer', activeTab === 'outpatient' ? 'border-indigo-600 text-indigo-650 font-bold' : 'border-transparent text-slate-450 hover:text-slate-700']"
      >
        Outpatient
      </button>
      <button 
        @click="activeTab = 'ipd'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none cursor-pointer', activeTab === 'ipd' ? 'border-indigo-600 text-indigo-650 font-bold' : 'border-transparent text-slate-450 hover:text-slate-700']"
      >
        IPD Orders
      </button>
    </div>

    <!-- Tab Contents -->
    <div class="transition-all duration-300">
      <OutpatientOrders v-if="activeTab === 'outpatient'" @saved="fetchStats" />
      <IPDOrders v-else-if="activeTab === 'ipd'" @saved="fetchStats" />
    </div>
  </div>
</template>

<style scoped>
</style>
