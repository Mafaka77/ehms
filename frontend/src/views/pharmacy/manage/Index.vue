<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Sales from './Sales.vue'
import Stocks from './Stocks.vue'
import IPDOrder from './IPDOrder.vue'
import { usePharmacyStore } from '../../../stores/pharmacyStore'

const pharmacyStore = usePharmacyStore()
const activeTab = ref('sales')
let pollingInterval = null

const refreshPendingCount = async () => {
  await pharmacyStore.fetchPendingIpdOrdersCount()
}

onMounted(() => {
  refreshPendingCount()
  // Poll every 10 seconds to keep the badge updated dynamically
  pollingInterval = setInterval(refreshPendingCount, 10000)
})

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
})

watch(activeTab, refreshPendingCount)
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Pharmacy Administration</h1>
        <p class="text-slate-500 mt-1 text-sm">Manage clinical medicine sales, pharmacy inventory stock, and ward requisitions.</p>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="border-b border-slate-100 flex items-center gap-1 select-none">
      <button 
        @click="activeTab = 'sales'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none', activeTab === 'sales' ? 'border-teal-600 text-teal-650 font-bold' : 'border-transparent text-slate-450 hover:text-slate-700']"
      >
        Sales
      </button>
      <button 
        @click="activeTab = 'stock'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none', activeTab === 'stock' ? 'border-teal-600 text-teal-650 font-bold' : 'border-transparent text-slate-450 hover:text-slate-700']"
      >
        Stock
      </button>
      <button 
        @click="activeTab = 'orders'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none flex items-center gap-2', activeTab === 'orders' ? 'border-teal-600 text-teal-650 font-bold' : 'border-transparent text-slate-450 hover:text-slate-700']"
      >
        <span>IPD Order</span>
        <span 
          v-if="pharmacyStore.pendingIpdOrdersCount > 0"
          class="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full leading-none flex items-center justify-center min-w-[18px] h-[18px] relative"
        >
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative">{{ pharmacyStore.pendingIpdOrdersCount }}</span>
        </span>
      </button>
    </div>

    <!-- Tab Contents -->
    <div class="transition-all duration-300">
      <Sales v-if="activeTab === 'sales'" />
      <Stocks v-else-if="activeTab === 'stock'" />
      <IPDOrder v-else-if="activeTab === 'orders'" />
    </div>
  </div>
</template>
