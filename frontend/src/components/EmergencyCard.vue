<script setup>
import { computed } from 'vue'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

// Ensure safe access to nested properties
const patient = computed(() => props.visit.patientId || {})
const doctor = computed(() => props.visit.doctorId || {})
const specialization = computed(() => doctor.value.specializationId?.name || 'General Medicine')
</script>

<template>
  <div class="print-container bg-white text-black mx-auto border-2 border-slate-800 flex flex-col justify-between">
    <div>
      <!-- Hospital Header -->
      <div class="text-center border-b-2 border-slate-800 pb-6 mb-6">
        <h1 class="text-3xl font-black uppercase tracking-widest text-slate-900">Emmanuel Hospital</h1>
        <p class="text-sm font-semibold mt-1">Luangmual Near Appollo School of Nursing</p>
        <p class="text-sm font-semibold mt-1">Aizawl, Mizoram - 796009</p>
        <p class="text-sm font-semibold">Phone: +91 8974326872 | Email: emmanuelhospital4@gmail.com</p>
        <p class="text-sm font-semibold">GSTIN:15CDTPN0612H1ZK</p>
        <div class="mt-4 inline-block bg-rose-600 text-white px-6 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-md">
          Emergency Visit Card
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-8 mb-8 border-b-2 border-slate-800 pb-6">
        
        <!-- Patient Details -->
        <div>
          <h2 class="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">Patient Details</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr>
                <td class="py-1 font-semibold w-1/3">Patient Name:</td>
                <td class="py-1 font-bold">{{ patient.fullName || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Patient ID:</td>
                <td class="py-1 font-bold">{{ patient.patientCode || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Age / Gender:</td>
                <td class="py-1 font-bold">{{ patient.age || '-' }} / {{ patient.gender || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Contact:</td>
                <td class="py-1 font-bold">{{ patient.mobileNo || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Visit Details -->
        <div>
          <h2 class="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">Visit Details</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr>
                <td class="py-1 font-semibold w-1/3">Visit No:</td>
                <td class="py-1 font-bold font-mono text-indigo-650">{{ visit.visitNo || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Arrival Time:</td>
                <td class="py-1 font-bold">{{ formatDate(visit.arrivalDateTime) }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Triage Doctor:</td>
                <td class="py-1 font-bold">Dr. {{ doctor.fullName || 'On Duty' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Department:</td>
                <td class="py-1 font-bold">{{ doctor.fullName ? specialization : 'Emergency Services' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Footer Signatures -->
    <div class="grid grid-cols-2 pt-12 border-t-2 border-slate-800 mt-8">
      <div class="text-center">
        <div class="border-t border-slate-400 w-48 mx-auto pt-2 text-sm font-semibold">Triage Nurse Signature</div>
      </div>
      <div class="text-center">
        <div class="border-t border-slate-400 w-48 mx-auto pt-2 text-sm font-semibold">Doctor Signature & Stamp</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Screen styles */
.print-container {
  box-sizing: border-box;
  width: 210mm;
  height: 297mm;
  padding: 15mm;
  box-shadow: 0 0 15px rgba(0,0,0,0.1);
  margin: 0 auto;
  background-color: white;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0; /* Remove browser default margins */
  }

  /* Hide EVERYTHING else on the page */
  body * {
    visibility: hidden;
  }
  
  /* Make only the print container and its children visible */
  .print-container, .print-container * {
    visibility: visible;
  }
  
  /* Break out of the modal/DOM flow completely */
  .print-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 15mm; /* Inner padding so content doesn't touch the paper edge */
    box-shadow: none;
    border: none;
    z-index: 999999;
  }

  .print-no-bg {
    background-color: transparent !important;
  }
}
</style>
