<script setup>
import { computed } from 'vue'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Ensure safe access to nested properties
const patient = computed(() => props.appointment.patientId || {})
const doctor = computed(() => props.appointment.doctorId || {})
const specialization = computed(() => doctor.value.specializationId?.name || 'General')
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
        <p class="text-sm font-semibold">GSTIN: 15CDTPN0612H1ZK</p>
        <div class="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full font-bold uppercase tracking-widest">
          Out-Patient Department Card
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

        <!-- Appointment Details -->
        <div>
          <h2 class="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">Appointment Details</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr>
                <td class="py-1 font-semibold w-1/3">Appt. ID:</td>
                <td class="py-1 font-bold">{{ appointment.appointmentId || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Date:</td>
                <td class="py-1 font-bold">{{ formatDate(appointment.appointmentDate) }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Doctor:</td>
                <td class="py-1 font-bold">Dr. {{ doctor.fullName || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold">Department:</td>
                <td class="py-1 font-bold">{{ specialization }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Prescription Area -->
      <div class="flex-grow">
        <!-- <h2 class="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3 border-b-2 border-slate-800 pb-2">Rx / Clinical Notes</h2> -->
        <!-- The blank area for doctor to write -->
        <div class="h-[400px]"></div>
      </div>
    </div>

    <!-- Footer Signatures -->
    <div class="mt-auto grid grid-cols-2 pt-12 border-slate-800">
      <div class="text-center">
        <div class="border-t border-slate-400 w-48 mx-auto pt-2 text-sm font-semibold">Patient/Attendant Signature</div>
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
