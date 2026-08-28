<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  dentalCharges: {
    type: Array,
    default: () => []
  },
  doctorName: {
    type: String,
    default: ''
  }
})

// Modal State
const showModal = ref(false)
const selectedCharge = ref(null)

const openModal = (ch) => {
  selectedCharge.value = ch
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedCharge.value = null
}

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

const totalRevenue = computed(() => {
  return props.dentalCharges.reduce((sum, c) => sum + (c.totalAmount || c.amount || 0), 0)
})

const totalAddonsAmount = computed(() => {
  return props.dentalCharges.reduce((sum, c) => sum + (c.addonsTotal || 0), 0)
})

// ── Pagination State ────────────────────────────────────────────────────────
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => {
  return Math.ceil(props.dentalCharges.length / itemsPerPage.value) || 1
})

const paginatedCharges = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return props.dentalCharges.slice(start, start + itemsPerPage.value)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- KPI Summary Row -->
    <div v-if="dentalCharges.length" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Total Dental Charges</p>
          <p class="text-2xl font-black text-teal-800 mt-0.5">{{ dentalCharges.length }}</p>
          <p class="text-[10px] text-teal-500 font-medium mt-0.5">Recorded procedures</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center font-bold">
          🦷
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Value / Revenue</p>
          <p class="text-2xl font-black text-emerald-700 mt-0.5">{{ fmtRupee(totalRevenue) }}</p>
          <p class="text-[10px] text-emerald-500 font-medium mt-0.5">Base + Addons total</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Addon Value</p>
          <p class="text-2xl font-black text-amber-700 mt-0.5">{{ fmtRupee(totalAddonsAmount) }}</p>
          <p class="text-[10px] text-amber-500 font-medium mt-0.5">Custom / package addons</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center font-bold text-sm">
          +
        </div>
      </div>
    </div>

    <!-- Dental Charges Table -->
    <div v-if="dentalCharges.length" class="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-2xs">
      <table class="w-full text-xs text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-3 px-4">Appt No.</th>
            <th class="py-3 px-4">Patient Name</th>
            <th class="py-3 px-4">Treatment / Procedure</th>
            <th class="py-3 px-4">Date &amp; Time</th>
            <th class="py-3 px-4 text-right">Rate × Qty</th>
            <th class="py-3 px-4 text-right">Addons</th>
            <th class="py-3 px-4 text-right">Total Amount</th>
            <th class="py-3 px-4 text-center">Status</th>
            <th class="py-3 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          <tr v-for="ch in paginatedCharges" :key="ch._id" class="hover:bg-slate-50/60 transition-all">
            <td class="py-3 px-4">
              <span class="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-100">
                {{ ch.dentalAppointmentId?.appointmentNo || 'DNTL' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <p class="font-bold text-slate-900">{{ ch.patientId?.fullName || '—' }}</p>
              <p class="text-[10px] text-slate-400 font-normal">
                {{ ch.patientId?.patientCode }}
                <span v-if="ch.patientId?.gender">· {{ ch.patientId.gender }} ({{ ch.patientId.age || 0 }}y)</span>
              </p>
            </td>
            <td class="py-3 px-4 max-w-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span v-if="ch.chargeCategoryId?.name" class="font-bold text-slate-800">
                  {{ ch.chargeCategoryId.name }}
                </span>
                <span v-if="ch.dentalAppointmentId?.toothNumbers" class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                  Tooth #{{ ch.dentalAppointmentId.toothNumbers }}
                </span>
              </div>
              <p v-if="ch.description" class="text-[11px] text-slate-500 truncate mt-0.5" :title="ch.description">
                {{ ch.description }}
              </p>
            </td>
            <td class="py-3 px-4 text-slate-500 whitespace-nowrap">
              {{ formatDateTime(ch.createdAt) }}
            </td>
            <td class="py-3 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">
              {{ fmtRupee(ch.rate) }} <span class="text-slate-400 text-[10px]">× {{ ch.quantity || 1 }}</span>
            </td>
            <td class="py-3 px-4 text-right">
              <span v-if="ch.addons && ch.addons.length" class="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                +{{ fmtRupee(ch.addonsTotal) }} <span class="text-[9px] font-normal">({{ ch.addons.length }})</span>
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
              {{ fmtRupee(ch.totalAmount || ch.amount) }}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <span
                :class="ch.isBilled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                class="px-2 py-0.5 text-[10px] font-bold rounded-full border"
              >
                {{ ch.isBilled ? 'Billed' : (ch.paymentStatus || 'Unbilled') }}
              </span>
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap">
              <button
                @click="openModal(ch)"
                title="View Dental Charge Details"
                class="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200/60"
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

      <!-- Pagination Controls -->
      <div v-if="dentalCharges.length > 0" class="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3 text-slate-500">
          <p>
            Showing <span class="font-bold text-slate-800">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
            to <span class="font-bold text-slate-800">{{ Math.min(currentPage * itemsPerPage, dentalCharges.length) }}</span>
            of <span class="font-bold text-slate-800">{{ dentalCharges.length }}</span> records
          </p>
          <div class="flex items-center gap-1.5 ml-2">
            <span class="text-[11px] text-slate-400">Per page:</span>
            <select
              v-model="itemsPerPage"
              @change="currentPage = 1"
              class="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <div v-if="totalPages > 1" class="flex items-center gap-1.5">
          <button
            @click="changePage(1)"
            :disabled="currentPage <= 1"
            title="First Page"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            «
          </button>
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>

          <span class="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-bold border border-teal-100">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
          <button
            @click="changePage(totalPages)"
            :disabled="currentPage >= totalPages"
            title="Last Page"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      No dental treatment charges recorded under {{ doctorName || 'this doctor' }}
    </div>

    <!-- Detail Breakdown Modal -->
    <div
      v-if="showModal && selectedCharge"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              Dental Treatment Charge
            </span>
            <h3 class="text-base font-black text-slate-900 mt-1">Procedure &amp; Addon Details</h3>
          </div>
          <button
            @click="closeModal"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="space-y-4 text-xs">
          <!-- Info block -->
          <div class="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Appointment / Ref:</span>
              <span class="font-mono font-black text-teal-700">{{ selectedCharge.dentalAppointmentId?.appointmentNo || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Patient:</span>
              <span class="font-bold text-slate-800">{{ selectedCharge.patientId?.fullName || '—' }} ({{ selectedCharge.patientId?.patientCode || '—' }})</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Date &amp; Time:</span>
              <span class="font-bold text-slate-800">{{ formatDateTime(selectedCharge.createdAt) }}</span>
            </div>
            <div v-if="selectedCharge.dentalAppointmentId?.toothNumbers" class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Tooth Numbers:</span>
              <span class="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">#{{ selectedCharge.dentalAppointmentId.toothNumbers }}</span>
            </div>
            <div v-if="selectedCharge.description" class="pt-1 border-t border-slate-200/60">
              <span class="text-slate-500 font-medium block mb-0.5">Description:</span>
              <span class="font-semibold text-slate-800">{{ selectedCharge.description }}</span>
            </div>
          </div>

          <!-- Financial Breakdown -->
          <div class="border border-slate-200/80 rounded-2xl p-4 space-y-2.5 bg-white">
            <h4 class="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Financial Breakdown</h4>

            <div class="flex justify-between text-slate-600">
              <span>Base Procedure ({{ selectedCharge.chargeCategoryId?.name || 'Treatment' }}):</span>
              <span class="font-bold text-slate-800">{{ fmtRupee(selectedCharge.amount) }}</span>
            </div>
            <div class="flex justify-between text-slate-400 text-[11px]">
              <span>Rate × Qty:</span>
              <span>{{ fmtRupee(selectedCharge.rate) }} × {{ selectedCharge.quantity || 1 }}</span>
            </div>

            <!-- Addons section -->
            <div v-if="selectedCharge.addons && selectedCharge.addons.length" class="bg-amber-50/60 border border-amber-100 p-3 rounded-xl space-y-1.5 text-[11px]">
              <div class="flex justify-between items-center font-bold text-amber-800">
                <span>Addon Items ({{ selectedCharge.addons.length }}):</span>
                <span>+{{ fmtRupee(selectedCharge.addonsTotal) }}</span>
              </div>
              <div class="space-y-1 text-slate-600 pt-1 border-t border-amber-200/60">
                <div v-for="ad in selectedCharge.addons" :key="ad._id" class="flex justify-between text-[11px]">
                  <span>• {{ ad.itemName }}</span>
                  <span class="font-bold text-slate-800">{{ fmtRupee(ad.amount) }}</span>
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Total Net Amount:</span>
              <span class="text-emerald-600 text-base">{{ fmtRupee(selectedCharge.totalAmount || selectedCharge.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="pt-2 flex justify-end">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
