<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDoctorActivityStore } from '../../../../stores/doctorActivityStore'

const props = defineProps({
  doctorId: {
    type: String,
    required: true
  }
})

const doctorActivityStore = useDoctorActivityStore()

const dateRange = ref('this_month') // 'today', 'this_month', 'last_month', 'custom'
const startDate = ref('')
const endDate = ref('')
const activityType = ref('ALL') // 'ALL', 'OPD', 'IPD_CHARGE', 'ADDON', 'BILL'

// Modal State
const showModal = ref(false)
const selectedItem = ref(null)

const openDetailModal = (item) => {
  selectedItem.value = item
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const loadLogs = async () => {
  if (!props.doctorId) return
  await doctorActivityStore.fetchDoctorActivityLogs(props.doctorId, {
    range: dateRange.value,
    startDate: startDate.value,
    endDate: endDate.value,
    type: activityType.value
  })
}

const onRangeChange = () => {
  if (dateRange.value !== 'custom') {
    startDate.value = ''
    endDate.value = ''
  }
  loadLogs()
}

const onCustomDateChange = () => {
  if (startDate.value && endDate.value) {
    loadLogs()
  }
}

const logsData = computed(() => doctorActivityStore.activityLogs)
const summary = computed(() => logsData.value?.summary)

const allowedSources = ['OPD', 'IPD', 'EMERGENCY']
const excludedKeywords = ['PHARMACY', 'LABORATORY', 'LAB', 'TEST', 'RADIOLOGY', 'ENDOSCOPY', 'ROOM', 'BED', 'WARD', 'NURSING', 'ACCOMMODATION', 'DENTAL']

const items = computed(() => {
  const list = logsData.value?.items || []
  return list.filter(item => {
    const src = (item.source || '').toUpperCase().trim()
    const desc = (item.description || '').toUpperCase()

    for (const kw of excludedKeywords) {
      if (src.includes(kw) || desc.includes(kw)) return false
    }

    if (allowedSources.includes(src) || src === 'BILL' || src === 'ADDON') return true

    return allowedSources.some(s => src.includes(s))
  })
})

const formatDateTime = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  if ((hours === 0 && minutes === 0 && seconds === 0) || (hours === 5 && minutes === 30 && seconds === 0)) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const fmtRupee = (n) => {
  if (n == null) return '₹0'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

const activityBadgeClass = (type) => {
  switch (type) {
    case 'OPD Bill Invoice': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'OPD Consultation': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'Emergency Consultation': return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'IPD Charge Involved': return 'bg-violet-50 text-violet-700 border-violet-100'
    case 'Charge Addon': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'Bill Invoice Involved': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const statusColor = (s) => {
  const map = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Booked: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-100',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
  }
  return map[s] || 'bg-slate-100 text-slate-600 border-slate-200'
}

onMounted(() => {
  loadLogs()
})
</script>

<template>
  <div class="p-6 space-y-6">

    <!-- Filters Bar -->
    <div class="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        <!-- Left: Quick Date Presets -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-bold text-slate-700 uppercase tracking-wider text-[10px] mr-1">Period:</span>
          
          <button
            @click="dateRange = 'all'; onRangeChange()"
            :class="dateRange === 'all' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            All Time
          </button>

          <button
            @click="dateRange = 'today'; onRangeChange()"
            :class="dateRange === 'today' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Today
          </button>

          <button
            @click="dateRange = 'this_month'; onRangeChange()"
            :class="dateRange === 'this_month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Current Month
          </button>

          <button
            @click="dateRange = 'last_month'; onRangeChange()"
            :class="dateRange === 'last_month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Last Month
          </button>

          <button
            @click="dateRange = 'custom'"
            :class="dateRange === 'custom' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'"
            class="px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Custom Range
          </button>
        </div>

        <!-- Right: Activity Type Selector -->
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-700 uppercase tracking-wider text-[10px] whitespace-nowrap">Activity Filter:</span>
          <select
            v-model="activityType"
            @change="loadLogs"
            class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Full / All Activities</option>
            <option value="OPD">OPD Bill Invoices Only</option>
            <option value="IPD_CHARGE">IPD Charges &amp; Addons</option>
            <option value="BILL">General Bills &amp; Invoices</option>
          </select>
        </div>

      </div>

      <!-- Custom Date Inputs (if custom chosen) -->
      <div v-if="dateRange === 'custom'" class="flex items-center gap-3 pt-2 border-t border-slate-200/60 text-xs">
        <div>
          <label class="block font-bold text-slate-600 text-[10px] uppercase mb-0.5">Start Date</label>
          <input
            type="date"
            v-model="startDate"
            @change="onCustomDateChange"
            class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block font-bold text-slate-600 text-[10px] uppercase mb-0.5">End Date</label>
          <input
            type="date"
            v-model="endDate"
            @change="onCustomDateChange"
            class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

    </div>

    <!-- Summary Metrics Bar -->
    <div v-if="summary" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
      
      <!-- Total Activities -->
      <div class="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl">
        <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Total Activities</p>
        <p class="text-2xl font-black text-indigo-700 mt-0.5">{{ summary.totalActivityCount }}</p>
        <p class="text-[10px] text-indigo-400 font-medium">Logged items</p>
      </div>

      <!-- OPD Bill Invoices -->
      <div class="bg-sky-50/70 border border-sky-100 p-3.5 rounded-2xl">
        <p class="text-[10px] font-bold text-sky-500 uppercase tracking-wider">OPD Bill Invoices</p>
        <p class="text-2xl font-black text-sky-700 mt-0.5">{{ summary.opdCount }}</p>
        <p class="text-[10px] text-sky-600 font-bold mt-0.5">{{ fmtRupee(summary.opdTotalAmount) }}</p>
      </div>

      <!-- IPD Charges & Addons -->
      <div class="bg-violet-50/70 border border-violet-100 p-3.5 rounded-2xl">
        <p class="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Charges &amp; Addons</p>
        <p class="text-2xl font-black text-violet-700 mt-0.5">{{ summary.ipdChargeCount }}</p>
        <p class="text-[10px] text-violet-600 font-bold mt-0.5">{{ fmtRupee(summary.ipdChargeTotalAmount) }}</p>
      </div>

      <!-- General Invoices -->
      <div class="bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl">
        <p class="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Other Invoices</p>
        <p class="text-2xl font-black text-amber-700 mt-0.5">{{ summary.billCount }}</p>
        <p class="text-[10px] text-amber-600 font-bold mt-0.5">{{ fmtRupee(summary.billTotalAmount) }}</p>
      </div>

      <!-- Total Amount Generated -->
      <div class="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
        <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Net Value</p>
        <p class="text-2xl font-black text-emerald-700 mt-0.5">{{ fmtRupee(summary.grandTotalAmount) }}</p>
        <p class="text-[10px] text-emerald-500 font-medium">Revenue generated</p>
      </div>

    </div>

    <!-- Activity Items Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      
      <div v-if="doctorActivityStore.loadingLogs" class="p-8 space-y-3 animate-pulse">
        <div v-for="i in 5" :key="i" class="h-10 bg-slate-100 rounded-xl"></div>
      </div>

      <div v-else-if="items.length" class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3 px-4">Date &amp; Time</th>
              <th class="py-3 px-4">Activity Type</th>
              <th class="py-3 px-4">Source</th>
              <th class="py-3 px-4">Patient Name</th>
              <th class="py-3 px-4">Description / Details</th>
              <th class="py-3 px-4 text-right">Net Amount</th>
              <th class="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/60 transition-all">
              
              <!-- Date & Time -->
              <td class="py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
                {{ formatDateTime(item.date) }}
              </td>

              <!-- Activity Type Badge -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  :class="activityBadgeClass(item.activityType)"
                >
                  {{ item.activityType }}
                </span>
              </td>

              <!-- Source -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span class="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wider">
                  {{ item.source || item.code || 'OPD' }}
                </span>
              </td>

              <!-- Patient Name -->
              <td class="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                {{ item.patientName }}
              </td>

              <!-- Description -->
              <td class="py-3 px-4 text-slate-600 max-w-xs truncate" :title="item.description">
                {{ item.description }}
              </td>

              <!-- Amount & Discount -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <p class="font-black text-slate-900">{{ fmtRupee(item.amount) }}</p>
                <p v-if="item.discountAmount > 0" class="text-[10px] text-rose-600 font-bold">
                  (Disc: -{{ fmtRupee(item.discountAmount) }})
                </p>
              </td>

              <!-- Eye Action Button -->
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <button
                  @click="openDetailModal(item)"
                  title="View Bill & Discount Details"
                  class="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200/60"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-12 text-center text-slate-400 text-xs">
        No activity records found for the selected period &amp; filter options
      </div>

    </div>

    <!-- Bill & Discount Details Modal -->
    <div v-if="showModal && selectedItem" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {{ selectedItem.activityType }}
            </span>
            <h3 class="text-base font-black text-slate-900 mt-1">Bill &amp; Discount Details</h3>
          </div>
          <button @click="closeModal" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Details -->
        <div class="space-y-4 text-xs">
          
          <!-- Key Info Grid -->
          <div class="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Source:</span>
              <span class="font-black text-indigo-700 uppercase tracking-wider">{{ selectedItem.source || selectedItem.code || 'OPD' }}</span>
            </div>
            <div v-if="selectedItem.billNo && selectedItem.billNo !== '—'" class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Invoice Number:</span>
              <span class="font-bold text-slate-800">{{ selectedItem.billNo }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Date &amp; Time:</span>
              <span class="font-bold text-slate-800">{{ formatDateTime(selectedItem.date) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Patient:</span>
              <span class="font-bold text-slate-900">{{ selectedItem.patientName }}</span>
            </div>
            <div v-if="selectedItem.patientMobile" class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Contact:</span>
              <span class="font-semibold text-slate-700">{{ selectedItem.patientMobile }}</span>
            </div>
            <div v-if="selectedItem.description" class="flex justify-between items-start gap-2 pt-1 border-t border-slate-200/60">
              <span class="text-slate-500 font-medium shrink-0">Description:</span>
              <span class="font-bold text-slate-800 text-right">{{ selectedItem.description }}</span>
            </div>
          </div>

          <!-- Financial Breakdown Card -->
          <div class="border border-slate-200/80 rounded-2xl p-4 space-y-2.5 bg-white">
            <h4 class="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Financial Breakdown</h4>

            <div class="flex justify-between text-slate-600">
              <span>Gross Fee / Original Amount:</span>
              <span class="font-bold text-slate-800">{{ fmtRupee(selectedItem.grossAmount) }}</span>
            </div>

            <!-- Discount Cross-Reference Block -->
            <div v-if="selectedItem.discountAmount > 0" class="bg-rose-50/60 border border-rose-100 p-3 rounded-xl space-y-1.5 text-[11px]">
              <div class="flex justify-between items-center font-bold text-rose-700">
                <span>Discount Applied:</span>
                <span>-{{ fmtRupee(selectedItem.discountAmount) }}</span>
              </div>
              <div v-if="selectedItem.discountRecord" class="space-y-1 text-slate-600 pt-1 border-t border-rose-100">
                <div class="flex justify-between">
                  <span class="font-semibold">Discount Type:</span>
                  <span class="font-bold text-slate-800">{{ selectedItem.discountRecord.discountType }}</span>
                </div>
                <div v-if="selectedItem.discountRecord.appliedBy" class="flex justify-between">
                  <span class="font-semibold">Applied By:</span>
                  <span class="font-medium text-slate-700">{{ selectedItem.discountRecord.appliedBy.fullName }}</span>
                </div>
                <div v-if="selectedItem.discountRecord.doctorId" class="flex justify-between">
                  <span class="font-semibold">Doctor Assigned:</span>
                  <span class="font-medium text-slate-700">Dr. {{ selectedItem.discountRecord.doctorId.fullName }}</span>
                </div>
                <div v-if="selectedItem.discountRecord.remarks" class="flex justify-between">
                  <span class="font-semibold">Remarks:</span>
                  <span class="italic text-slate-700">{{ selectedItem.discountRecord.remarks }}</span>
                </div>
              </div>
            </div>

            <div v-else class="flex justify-between text-slate-400 text-[11px]">
              <span>Discount Applied:</span>
              <span>₹0 (No Discount)</span>
            </div>

            <div class="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Net Amount:</span>
              <span class="text-emerald-600 text-base">{{ fmtRupee(selectedItem.netAmount) }}</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="pt-2 flex justify-end">
          <button @click="closeModal" class="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer">
            Close
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
