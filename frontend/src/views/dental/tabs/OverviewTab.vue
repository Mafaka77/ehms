<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Treatment Overview</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Appointment ID</p>
        <p class="font-medium text-slate-800">{{ appointment.appointmentId }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Started</p>
        <p class="font-medium text-slate-800">{{ new Date(appointment.appointmentDate).toLocaleDateString() }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Doctor</p>
        <p class="font-medium text-slate-800">Dr. {{ appointment.doctorId?.fullName }}</p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Consultation Fee</p>
        <p class="font-medium text-slate-800">₹{{ appointment.consultationFee || 0 }}</p>
      </div>
      <div class="col-span-1 md:col-span-2">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint / Notes</p>
        <p class="font-medium text-slate-800 whitespace-pre-wrap">{{ appointment.notes || 'No notes provided.' }}</p>
      </div>
    </div>
  </div>
</template>
