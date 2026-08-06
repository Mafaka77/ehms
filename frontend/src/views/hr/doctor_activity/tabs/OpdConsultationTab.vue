<script setup>
import { ref } from 'vue'

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  }
})

// Modal State
const showModal = ref(false)
const selectedApp = ref(null)

const openModal = (app) => {
  selectedApp.value = app
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedApp.value = null
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

const statusColor = (s) => {
  const map = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-100',
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    Booked: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
  }
  return map[s] || 'bg-slate-100 text-slate-600 border-slate-200'
}
</script>

<template>
  <div class="p-4">
    <div v-if="appointments.length" class="overflow-x-auto">
      <table class="w-full text-xs text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-2.5 px-3">Bill Invoice No</th>
            <th class="py-2.5 px-3">Appt ID</th>
            <th class="py-2.5 px-3">Patient Name</th>
            <th class="py-2.5 px-3">Date &amp; Time</th>
            <th class="py-2.5 px-3 text-right">Gross Fee</th>
            <th class="py-2.5 px-3 text-right">Discount</th>
            <th class="py-2.5 px-3 text-right">Net Amount</th>
            <th class="py-2.5 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          <tr v-for="app in appointments" :key="app._id" class="hover:bg-slate-50/60 transition-all">
            
            <!-- Bill Invoice No -->
            <td class="py-3 px-3">
              <span class="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                {{ app.billNo || 'N/A' }}
              </span>
            </td>

            <!-- Appointment ID -->
            <td class="py-3 px-3 font-semibold text-slate-700">
              {{ app.appointmentId || '—' }}
            </td>

            <!-- Patient Name -->
            <td class="py-3 px-3 font-bold text-slate-800">
              {{ app.patientId?.fullName || '—' }}
            </td>

            <!-- Date & Time -->
            <td class="py-3 px-3 text-slate-500 whitespace-nowrap">
              {{ formatDateTime(app.appointmentDate) }}
            </td>

            <!-- Gross Fee -->
            <td class="py-3 px-3 text-right font-bold text-slate-700">
              {{ fmtRupee(app.grossAmount || app.consultationFee) }}
            </td>

            <!-- Discount -->
            <td class="py-3 px-3 text-right">
              <span v-if="app.discountAmount > 0" class="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                -{{ fmtRupee(app.discountAmount) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>

            <!-- Net Amount -->
            <td class="py-3 px-3 text-right font-black text-slate-900">
              {{ fmtRupee(app.netAmount != null ? app.netAmount : app.consultationFee) }}
            </td>

            <!-- Eye Action Button -->
            <td class="py-3 px-3 text-center whitespace-nowrap">
              <button
                @click="openModal(app)"
                title="View Bill Details"
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
      No recent OPD consultation bill invoices found
    </div>

    <!-- Bill Details Modal -->
    <div v-if="showModal && selectedApp" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              OPD Consultation Bill
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
              <span class="text-slate-500 font-medium">Invoice Number:</span>
              <span class="font-black text-indigo-700">{{ selectedApp.billNo || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Appointment ID:</span>
              <span class="font-bold text-slate-800">{{ selectedApp.appointmentId || '—' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Date &amp; Time:</span>
              <span class="font-bold text-slate-800">{{ formatDateTime(selectedApp.appointmentDate) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Patient Name:</span>
              <span class="font-bold text-slate-900">{{ selectedApp.patientId?.fullName || '—' }}</span>
            </div>
          </div>

          <!-- Financial Breakdown Card -->
          <div class="border border-slate-200/80 rounded-2xl p-4 space-y-2.5 bg-white">
            <h4 class="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Financial Breakdown</h4>

            <div class="flex justify-between text-slate-600">
              <span>Gross Consultation Fee:</span>
              <span class="font-bold text-slate-800">{{ fmtRupee(selectedApp.grossAmount || selectedApp.consultationFee) }}</span>
            </div>

            <!-- Discount Cross-Reference Block -->
            <div v-if="selectedApp.discountAmount > 0" class="bg-rose-50/60 border border-rose-100 p-3 rounded-xl space-y-1.5 text-[11px]">
              <div class="flex justify-between items-center font-bold text-rose-700">
                <span>Discount Applied:</span>
                <span>-{{ fmtRupee(selectedApp.discountAmount) }}</span>
              </div>
              <div v-if="selectedApp.discountRecord" class="space-y-1 text-slate-600 pt-1 border-t border-rose-100">
                <div class="flex justify-between">
                  <span class="font-semibold">Discount Type:</span>
                  <span class="font-bold text-slate-800">{{ selectedApp.discountRecord.discountType }}</span>
                </div>
                <div v-if="selectedApp.discountRecord.appliedBy" class="flex justify-between">
                  <span class="font-semibold">Applied By:</span>
                  <span class="font-medium text-slate-700">{{ selectedApp.discountRecord.appliedBy.fullName }}</span>
                </div>
                <div v-if="selectedApp.discountRecord.remarks" class="flex justify-between">
                  <span class="font-semibold">Remarks:</span>
                  <span class="italic text-slate-700">{{ selectedApp.discountRecord.remarks }}</span>
                </div>
              </div>
            </div>

            <div v-else class="flex justify-between text-slate-400 text-[11px]">
              <span>Discount Applied:</span>
              <span>₹0 (No Discount)</span>
            </div>

            <div class="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Net Amount Payable:</span>
              <span class="text-emerald-600 text-base">{{ fmtRupee(selectedApp.netAmount != null ? selectedApp.netAmount : selectedApp.consultationFee) }}</span>
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
