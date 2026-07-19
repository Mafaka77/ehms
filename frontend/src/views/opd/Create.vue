<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore } from '../../stores/patientStore'
import { useOpdStore } from '../../stores/opdStore'
import { useDoctorStore } from '../../stores/doctorStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import BaseInput from '../../components/BaseInput.vue'
import BaseSelect from '../../components/BaseSelect.vue'
import BaseTextarea from '../../components/BaseTextarea.vue'
import SearchableSelect from '../../components/SearchableSelect.vue'
import OpdCard from '../../components/OpdCard.vue'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

const router = useRouter()
const patientStore = usePatientStore()
const opdStore = useOpdStore()
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()

// Workflow Steps: 1 (Search/Select/Create Patient) -> 2 (Book Appointment)
const currentStep = ref(1)

// Print Modal State
const showCardModal = ref(false)
const createdAppointment = ref(null)
const pdfPreviewUrl = ref(null)
const currentFilename = ref('')
const printingPDF = ref(false)

// -- STEP 1: PATIENT SELECTION --
const searchQuery = ref('')
const searchTimeout = ref(null)
const isSearching = ref(false)
const selectedPatient = ref(null)

// For Creating New Patient
const showNewPatientForm = ref(false)
const newPatient = ref({
  fullName: '',
  mobileNo: '',
  gender: 'Male',
  dateOfBirth: ''
})
const isCreatingPatient = ref(false)

// Handle Search
const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (!searchQuery.value || searchQuery.value.length < 3) {
    patientStore.searchResults = []
    return
  }
  
  isSearching.value = true
  searchTimeout.value = setTimeout(async () => {
    await patientStore.searchPatients(searchQuery.value)
    isSearching.value = false
  }, 400)
}

const selectPatient = (patient) => {
  selectedPatient.value = patient
  searchQuery.value = ''
  patientStore.searchResults = []
  currentStep.value = 2 // Move to next step
}

const toggleNewPatient = () => {
  showNewPatientForm.value = !showNewPatientForm.value
  if (showNewPatientForm.value) {
    // Attempt to auto-fill if the search query looks like a phone number or name
    if (/^\d{10}$/.test(searchQuery.value)) {
      newPatient.value.mobileNo = searchQuery.value
    } else {
      newPatient.value.fullName = searchQuery.value
    }
  }
}

const saveNewPatient = async () => {
  isCreatingPatient.value = true
  const res = await patientStore.createPatient(newPatient.value)
  isCreatingPatient.value = false
  
  if (res.success) {
    snackbarStore.show({ message: 'Patient Created Successfully!', type: 'success' })
    selectPatient(res.data)
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}


// -- STEP 2: APPOINTMENT BOOKING --
const appointmentData = ref({
  doctorId: '',
  appointmentDate: new Date().toISOString().split('T')[0],
  notes: '',
  paymentStatus: 'Unpaid'
})
const isBooking = ref(false)

const doctorOptions = computed(() => {
  return opdStore.opdDoctors.map(doctor => ({
    value: doctor._id,
    label: `Dr. ${doctor.fullName} - ${doctor.specializationId?.name || 'General'}`
  }))
})

const selectedDoctorFee = computed(() => {
  if (!appointmentData.value.doctorId) return null
  const doctor = opdStore.opdDoctors.find(d => d._id === appointmentData.value.doctorId)
  return doctor ? doctor.opdFee : null
})

onMounted(async () => {
  // Load doctors who have an OPD Remuneration rule
  await opdStore.fetchOpdDoctors()
})

const goBackToPatient = () => {
  currentStep.value = 1
  selectedPatient.value = null
}

const submitAppointment = async () => {
  if (!selectedPatient.value) return
  
  isBooking.value = true
  const payload = {
    ...appointmentData.value,
    patientId: selectedPatient.value._id,
    consultationFee: selectedDoctorFee.value || 0
  }

  const res = await opdStore.bookAppointment(payload)
  isBooking.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Appointment Booked Successfully!', type: 'success' })
    createdAppointment.value = res.data
    pdfPreviewUrl.value = null
    showCardModal.value = true
    
    await generateCardPDF()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const generateCardPDF = async () => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const element = document.querySelector('.print-card-wrapper')
    if (!element) throw new Error('Card container not found')
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const ratio = pdfWidth / canvas.width
    const imgHeight = canvas.height * ratio
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight)
    
    const patientName = createdAppointment.value?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const filename = `OPD_Card_${patientName}.pdf`
    currentFilename.value = filename
    
    const blob = pdf.output('blob')
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = URL.createObjectURL(blob)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    snackbarStore.show({ message: 'Failed to generate PDF Preview', type: 'error' })
  } finally {
    printingPDF.value = false
  }
}

const closeModal = () => {
  showCardModal.value = false
  if (pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = null
  }
  // After closing, redirect to the list view
  router.push({ name: 'opd-appointment' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button 
        @click="router.push({ name: 'opd-appointment' })"
        class="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">OPD Appointment</h1>
        <p class="text-slate-500 mt-1 text-sm">Create a new Out-Patient Department appointment.</p>
      </div>
    </div>

    <!-- Stepper -->
    <div class="flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:bg-slate-200 before:w-full before:z-0 px-8">
      <!-- Step 1 Indicator -->
      <div class="relative z-10 flex flex-col items-center bg-transparent">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all"
          :class="currentStep >= 1 ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'"
        >
          <svg v-if="currentStep > 1" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <span v-else>1</span>
        </div>
        <span class="absolute -bottom-7 text-xs font-semibold whitespace-nowrap" :class="currentStep >= 1 ? 'text-indigo-600' : 'text-slate-500'">Select Patient</span>
      </div>
      
      <!-- Step 2 Indicator -->
      <div class="relative z-10 flex flex-col items-center bg-transparent">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all"
          :class="currentStep >= 2 ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'"
        >
          2
        </div>
        <span class="absolute -bottom-7 text-xs font-semibold whitespace-nowrap" :class="currentStep >= 2 ? 'text-indigo-600' : 'text-slate-500'">Book Slot</span>
      </div>
    </div>

    <!-- MAIN CARD -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
      
      <!-- ============================== -->
      <!-- STEP 1: PATIENT SELECTION      -->
      <!-- ============================== -->
      <div v-if="currentStep === 1" class="p-8">
        
        <!-- Search Section -->
        <div v-if="!showNewPatientForm" class="space-y-6">
          <div class="text-center max-w-md mx-auto">
            <h2 class="text-xl font-bold text-slate-800 mb-2">Find Existing Patient</h2>
            <p class="text-sm text-slate-500 mb-6">Search by mobile number, patient name, or code to retrieve their medical record.</p>
            
            <!-- Search Input -->
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5" :class="isSearching ? 'text-indigo-600 animate-pulse' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                placeholder="Enter mobile number or name... (min 3 chars)" 
                class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          <!-- Search Results Dropdown -->
          <div v-if="patientStore.searchResults.length > 0" class="max-w-2xl mx-auto border border-slate-100 rounded-2xl overflow-hidden shadow-lg bg-white mt-4">
            <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Results</span>
              <span class="text-xs text-slate-400 font-medium">{{ patientStore.searchResults.length }} found</span>
            </div>
            <ul class="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              <li 
                v-for="patient in patientStore.searchResults" 
                :key="patient._id"
                @click="selectPatient(patient)"
                class="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    {{ patient.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ patient.fullName }} <span class="text-xs text-slate-500 font-medium ml-1">({{ patient.gender }}, {{ patient.age || '?' }}y)</span></p>
                    <p class="text-xs text-slate-500 mt-0.5"><span class="font-mono">{{ patient.patientCode }}</span> • {{ patient.mobileNo }}</p>
                  </div>
                </div>
                <button class="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
              </li>
            </ul>
          </div>

          <!-- No Results / Not Found -->
          <div v-if="searchQuery.length >= 3 && !isSearching && patientStore.searchResults.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-slate-600 font-medium">No patient found matching your query.</p>
            <p class="text-slate-400 text-sm mt-1 mb-4">Please verify the details or register them as a new patient.</p>
          </div>

          <!-- Divider -->
          <div class="flex items-center max-w-md mx-auto pt-4 pb-2">
            <div class="flex-grow border-t border-slate-200"></div>
            <span class="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
            <div class="flex-grow border-t border-slate-200"></div>
          </div>

          <!-- Create New Button -->
          <div class="text-center">
            <button 
              @click="toggleNewPatient"
              class="bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Register New Patient
            </button>
          </div>
        </div>

        <!-- Create New Patient Form -->
        <div v-else class="max-w-2xl mx-auto border border-slate-200 rounded-2xl p-6 bg-slate-50/50 relative">
          <button @click="toggleNewPatient" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          
          <h2 class="text-lg font-bold text-slate-800 mb-1">Quick Registration</h2>
          <p class="text-sm text-slate-500 mb-6">Create a minimal profile to book an appointment.</p>
          
          <form @submit.prevent="saveNewPatient" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput v-model="newPatient.fullName" id="fullName" label="Full Name" placeholder="e.g. John Doe" required />
              <BaseInput v-model="newPatient.mobileNo" id="mobileNo" label="Mobile Number" placeholder="e.g. 9876543210" required />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseSelect
                v-model="newPatient.gender"
                id="gender"
                label="Gender"
                :options="['Male', 'Female', 'Other']"
                required
              />
              <BaseInput v-model="newPatient.dateOfBirth" type="date" id="dob" label="Date of Birth" />
            </div>
            
            <div class="pt-4 flex justify-end">
              <button 
                type="submit" 
                :disabled="isCreatingPatient"
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <svg v-if="isCreatingPatient" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span v-else>Save & Proceed</span>
              </button>
            </div>
          </form>
        </div>
      </div>


      <!-- ============================== -->
      <!-- STEP 2: APPOINTMENT BOOKING    -->
      <!-- ============================== -->
      <div v-else class="p-8">
        
        <!-- Selected Patient Summary -->
        <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {{ selectedPatient?.fullName?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-bold text-indigo-900">{{ selectedPatient?.fullName }}</p>
              <p class="text-xs text-indigo-700 font-medium">{{ selectedPatient?.patientCode }} • {{ selectedPatient?.mobileNo }}</p>
            </div>
          </div>
          <button 
            @click="goBackToPatient"
            class="text-indigo-600 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Change Patient
          </button>
        </div>

        <form @submit.prevent="submitAppointment" class="max-w-xl mx-auto space-y-6">
          <h2 class="text-xl font-bold text-slate-800 text-center mb-6">Book Slot</h2>
          
          <div class="w-full">
            <SearchableSelect
              v-model="appointmentData.doctorId"
              id="doctor-select"
              label="Select Consulting Doctor"
              placeholder="Choose a doctor..."
              :options="doctorOptions"
              :required="true"
            />
          </div>

          <!-- Fee Display -->
          <div v-if="selectedDoctorFee !== null" class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-emerald-900">Consultation Fee</p>
                <p class="text-xs text-emerald-700">As per doctor's OPD remuneration rule</p>
              </div>
            </div>
            <span class="text-lg font-bold text-emerald-700">₹{{ selectedDoctorFee }}</span>
          </div>

          <div>
            <BaseInput 
              v-model="appointmentData.appointmentDate"
              type="date"
              id="appointmentDate"
              label="Appointment Date"
              required
            />
          </div>

          <div>
            <BaseTextarea
              v-model="appointmentData.notes"
              id="notes"
              label="Symptoms or Notes"
              placeholder="Briefly describe the reason for visit..."
              :rows="3"
            />
          </div>

          <div class="pt-6">
            <button 
              type="submit" 
              :disabled="isBooking"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <svg v-if="isBooking" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span v-else>Confirm Booking</span>
            </button>
          </div>

        </form>
      </div>

    </div>
    
    <!-- Print Modal Overlay -->
    <div v-if="showCardModal && createdAppointment" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div>
            <h2 class="text-lg font-bold text-slate-800">OPD Card Preview</h2>
            <p class="text-sm text-slate-500">Preview and print the OPD Card for this appointment.</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="closeModal"
              class="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Done & Close
            </button>
            <a 
              v-if="pdfPreviewUrl"
              :href="pdfPreviewUrl"
              :download="currentFilename"
              class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF
            </a>
          </div>
        </div>

        <!-- Scrollable Print Area / PDF Preview -->
        <div class="flex-grow flex flex-col relative bg-slate-600">
          
          <!-- Loading State -->
          <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-20">
            <div class="flex flex-col items-center">
              <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></span>
              <span class="text-white font-medium shadow-sm">Generating PDF Preview...</span>
            </div>
          </div>

          <!-- Hidden DOM for html2canvas -->
          <div v-show="!pdfPreviewUrl" class="absolute inset-0 overflow-y-auto bg-slate-200 p-8 flex justify-center z-0" style="opacity: 0; pointer-events: none;">
             <div class="print-card-wrapper bg-white">
               <OpdCard :appointment="createdAppointment" />
             </div>
          </div>
          
          <!-- PDF Preview Iframe -->
          <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="w-full h-full border-0 z-10 relative" title="PDF Preview"></iframe>
        </div>
        
      </div>
    </div>
  </div>
</template>