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
    
    if (years > 0) {
      return `${years} Yrs`
    } else {
      let totalMonths = (today.getFullYear() - dob.getFullYear()) * 12 + today.getMonth() - dob.getMonth()
      if (today.getDate() < dob.getDate()) {
        totalMonths--
      }
      return `${Math.max(0, totalMonths)} Months`
    }
  }
  return patient.value.age ? `${patient.value.age} Yrs` : '-'
})
</script>

<template>
  <div class="print-container bg-white text-black mx-auto  border-slate-800 flex flex-col justify-between">
    <div>
      <!-- Space for pre-printed letterhead -->
      <div class="h-20"></div>
      
      <!-- Card Title -->
      <div class="flex justify-center border-b-1 border-slate-800 pb-4 mb-2">
        
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        
        <!-- Patient Details -->
        <div class="border border-slate-300 rounded-lg p-3 bg-slate-50/50 print:border-slate-300">
          <h2 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200 print:text-slate-800 print:border-slate-300">Patient Details</h2>
          <div class="grid grid-cols-2 gap-y-2 gap-x-3">
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Patient Name</p>
              <p class="font-bold text-xs text-slate-900">{{ patient.fullName || '-' }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Patient ID</p>
              <p class="font-bold text-xs text-slate-900">{{ patient.patientCode || '-' }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Age / Gender</p>
              <p class="font-bold text-xs text-slate-900">{{ patientAge }} / {{ patient.gender || '-' }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Contact</p>
              <p class="font-bold text-xs text-slate-900">{{ patient.mobileNo || '-' }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Address</p>
              <p class="font-bold text-xs text-slate-900">{{ patient.address || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Visit Details -->
        <div class="border border-slate-300 rounded-lg p-3 bg-slate-50/50 print:border-slate-300">
          <h2 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200 print:text-slate-800 print:border-slate-300">Visit Details</h2>
          <div class="grid grid-cols-2 gap-y-2 gap-x-3">
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Visit No</p>
              <p class="font-bold text-xs text-slate-900">{{ visit.visitNo || '-' }}</p>
            </div>
            <div>
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Date</p>
              <p class="font-bold text-xs text-slate-900">{{ formatDate(visit.arrivalDateTime) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-[9px] text-slate-500 uppercase font-semibold">Doctor</p>
              <p class="font-bold text-xs text-slate-900">{{ doctor.fullName || '-' }}</p>
              <p class="text-[10px] text-slate-600 mt-0.5 font-medium">{{ doctor.qualification || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Prescription Area -->
      <div class="flex-grow">
        <!-- The blank area for doctor to write -->
        <div class="h-[400px]"></div>
      </div>
    </div>

    <!-- Footer Signatures -->
    <div class="mt-auto pt-8">
      <div class="grid grid-cols-2">
       
      </div>
      <hr class="border-slate-800 mt-8" />
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
