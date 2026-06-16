<script setup>
import { ref } from 'vue'
import OutpatientOrders from './OutpatientOrders.vue'
import IPDOrders from './IPDOrders.vue'

const activeTab = ref('outpatient')
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Manage Radiology</h1>
      <p class="text-slate-500 mt-1 text-sm">Overview of radiology investigations and patient orders.</p>
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
      <OutpatientOrders v-if="activeTab === 'outpatient'" />
      <IPDOrders v-else-if="activeTab === 'ipd'" />
    </div>
  </div>
</template>

<style scoped>
</style>
