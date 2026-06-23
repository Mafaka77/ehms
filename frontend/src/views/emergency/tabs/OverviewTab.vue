<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Emergency Overview</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Visit No</p>
        <p class="font-medium text-slate-800">{{ visit.visitNo }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Arrival Date/Time</p>
        <p class="font-medium text-slate-800">{{ formatDate(visit.arrivalDateTime) }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</p>
        <p class="font-medium text-slate-800">{{ visit.priority }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Triage Doctor</p>
        <p class="font-medium text-slate-800">Dr. {{ visit.doctorId?.fullName || 'On Duty' }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Emergency Rate</p>
        <p class="font-medium text-slate-800">₹{{ visit.consultationFee || 0 }}</p>
      </div>
      <div class="col-span-1 md:col-span-2">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</p>
        <p class="font-medium text-slate-800 whitespace-pre-wrap">{{ visit.chiefComplaint || 'No chief complaint provided.' }}</p>
      </div>
      <div class="col-span-1 md:col-span-2">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Notes / Instructions</p>
        <p class="font-medium text-slate-800 whitespace-pre-wrap">{{ visit.notes || 'No notes provided.' }}</p>
      </div>
    </div>
  </div>
</template>
