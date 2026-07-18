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
      <!-- Space for pre-printed letterhead -->
      <div class="h-20"></div>
      
      <!-- Card Title -->
      <div class="flex justify-center border-b-1 border-slate-800 pb-4 mb-2">
        
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-6 mb-6 border-b-1 border-slate-800 pb-2">
        
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
                <td class="py-1 font-bold">{{ doctor.fullName || '-' }}</td>
              </tr>
              <tr>
                <td class="py-1 font-semibold"></td>
                <td class="py-1 font-bold">{{ doctor.qualification || '-' }}</td>
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
    <div class="mt-auto grid grid-cols-2 pt-8 border-slate-800 border-b-1">
     
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
