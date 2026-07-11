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

const patientAge = computed(() => {
  if (patient.value.dateOfBirth) {
    const dob = new Date(patient.value.dateOfBirth)
    const today = new Date()
    
    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()
    
    if (months < 0 || (months === 0 && days < 0)) {
      years--
    }
    
    const lastBirthday = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate())
    const diffTime = Math.abs(today.getTime() - lastBirthday.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))
    
    return years > 0 ? `${years}Y ${diffDays}D` : `${diffDays}D`
  }
  return patient.value.age ? `${patient.value.age}Y` : '-'
})
</script>

<template>
  <div class="print-container bg-white text-black mx-auto border-2 border-slate-800 flex flex-col justify-between">
    <div>
      <!-- Hospital Header -->
      <div class="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
        <!-- Simple Logo -->
        <div class="w-24 flex justify-center">
          <div class="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
            </svg>
          </div>
        </div>
        
        <div class="flex-1 text-center">
          <h1 class="text-2xl font-black uppercase tracking-widest text-slate-900">Emmanuel Hospital</h1>
          <p class="text-xs font-semibold mt-1">Luangmual Near Appollo School of Nursing</p>
          <p class="text-xs font-semibold mt-1">Aizawl, Mizoram - 796009</p>
          <p class="text-xs font-semibold">Phone: +91 8974326872 | Email: emmanuelhospital4@gmail.com</p>
          <p class="text-xs font-semibold">GSTIN: 15CDTPN0612H1ZK</p>
          <div class="mt-3 text-xs inline-block bg-slate-900 text-white px-5 py-1 rounded-full font-bold uppercase tracking-widest">
            Out-Patient Department Card
          </div>
        </div>
        
        <!-- Spacer for centering -->
        <div class="w-24"></div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-6 mb-6 border-b-2 border-slate-800 pb-4">
        
        <!-- Patient Details -->
        <div>
          <h2 class="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-2">Patient Details</h2>
          <table class="w-full text-xs">
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
                <td class="py-1 font-bold">{{ patientAge }} / {{ patient.gender || '-' }}</td>
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
          <h2 class="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-2">Appointment Details</h2>
          <table class="w-full text-xs">
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
    <div class="mt-auto grid grid-cols-2 pt-8 border-slate-800">
      <div class="text-center">
        <div class="border-t border-slate-400 w-48 mx-auto pt-2 text-xs font-semibold">Patient/Attendant Signature</div>
      </div>
      <div class="text-center">
        <div class="border-t border-slate-400 w-48 mx-auto pt-2 text-xs font-semibold">Doctor Signature & Stamp</div>
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
  padding: 8mm 15mm 15mm 15mm;
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
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    padding: 8mm 15mm 15mm 15mm !important; /* Inner padding so content doesn't touch the paper edge */
    box-shadow: none !important;
    border: none !important;
    z-index: 999999 !important;
  }

  .print-no-bg {
    background-color: transparent !important;
  }
}
</style>
