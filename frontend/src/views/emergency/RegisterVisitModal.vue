<script setup>
import { ref, watch, computed } from 'vue'
import { DateTime } from 'luxon'
import { useEmergencyStore } from '../../stores/emergencyStore'
import { usePatientStore } from '../../stores/patientStore'
import { useDoctorStore } from '../../stores/doctorStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import BaseInput from '../../components/BaseInput.vue'
import BaseSelect from '../../components/BaseSelect.vue'
import BaseTextarea from '../../components/BaseTextarea.vue'
import SearchableSelect from '../../components/SearchableSelect.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'registered'])

const emergencyStore = useEmergencyStore()
const patientStore = usePatientStore()
const doctorStore = useDoctorStore()
const snackbarStore = useSnackbarStore()

const currentStep = ref(1) // 1: Select/Create Patient, 2: Visit details

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
  dateOfBirth: '',
  address: ''
})
const isCreatingPatient = ref(false)

const getLocalDatetimeString = () => {
  return DateTime.now().setZone('Asia/Kolkata').toFormat("yyyy-MM-dd'T'HH:mm")
}

// -- STEP 2: REGISTER VISIT --
const visitForm = ref({
  doctorId: '',
  arrivalDateTime: getLocalDatetimeString(), // Format: YYYY-MM-DDThh:mm
  chiefComplaint: '',
  priority: 'MEDIUM',
  notes: '',
  consultationFee: 0,
  hospitalCharges: 100
})
const isRegistering = ref(false)

const resetModal = () => {
  selectedPatient.value = null
  searchQuery.value = ''
  patientStore.searchResults = []
  showNewPatientForm.value = false
  currentStep.value = 1
  visitForm.value = {
    doctorId: '',
    arrivalDateTime: getLocalDatetimeString(),
    chiefComplaint: '',
    priority: 'MEDIUM',
    notes: '',
    consultationFee: 0,
    hospitalCharges: 100
  }
}

watch(() => props.show, (val) => {
  if (val) {
    resetModal()
  }
})

const close = () => {
  emit('update:show', false)
}

// Handle Patient Search
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
    if (/^\d{10}$/.test(searchQuery.value)) {
      newPatient.value = { fullName: '', mobileNo: searchQuery.value, gender: 'Male', dateOfBirth: '', address: '' }
    } else {
      newPatient.value = { fullName: searchQuery.value, mobileNo: '', gender: 'Male', dateOfBirth: '', address: '' }
    }
  }
}

const saveNewPatient = async () => {
  isCreatingPatient.value = true
  const res = await patientStore.createPatient(newPatient.value)
  isCreatingPatient.value = false
  
  if (res.success) {
    snackbarStore.show({ message: 'Patient Registered Successfully!', type: 'success' })
    selectPatient(res.data)
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const doctorOptions = computed(() => {
  return emergencyStore.emergencyDoctors.map(doctor => ({
    value: doctor._id,
    label: ` ${doctor.fullName} - ${doctor.specializationId?.name || 'Emergency Medicine'}`
  }))
})

// Auto-fill consultationFee when a doctor with EMERGENCY serviceType rule is selected
watch(() => visitForm.value.doctorId, async (newDoctorId) => {
  if (!newDoctorId) return
  try {
    const res = await doctorStore.fetchRemunerationRules(newDoctorId)
    if (res.success && Array.isArray(res.data)) {
      const emergencyRule = res.data.find(r => r.serviceType === 'EMERGENCY' && r.isActive !== false)
      if (emergencyRule && typeof emergencyRule.amount === 'number') {
        visitForm.value.consultationFee = emergencyRule.amount
      }
    }
  } catch (err) {
    console.error('Error fetching doctor remuneration rules for EMERGENCY:', err)
  }
})

const submitVisit = async () => {
  if (!selectedPatient.value) return
  if (visitForm.value.arrivalDateTime > getLocalDatetimeString()) {
    snackbarStore.show({ message: 'Future dates (postdating) are not allowed.', type: 'warning' })
    return
  }
  
  isRegistering.value = true
  const istArrivalDateTime = visitForm.value.arrivalDateTime
    ? DateTime.fromISO(visitForm.value.arrivalDateTime, { zone: 'Asia/Kolkata' }).toISO({ includeOffset: true })
    : DateTime.now().setZone('Asia/Kolkata').toISO({ includeOffset: true })

  const payload = {
    ...visitForm.value,
    arrivalDateTime: istArrivalDateTime,
    patientId: selectedPatient.value._id,
    hospitalCharges: Number(visitForm.value.hospitalCharges || 100)
  }

  const res = await emergencyStore.registerVisit(payload)
  isRegistering.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Emergency Visit Registered Successfully!', type: 'success' })
    emit('registered', res.data)
    close()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-slate-100">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Register Emergency Visit</h2>
          <p class="text-xs text-slate-500 mt-0.5">Quickly register patient and triage logs for emergency arrival.</p>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        <!-- Stepper indicators -->
        <div class="flex items-center justify-center gap-6 pb-2">
          <span class="text-xs font-semibold px-2.5 py-1.5 rounded-full" :class="currentStep === 1 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'">1. Select Patient</span>
          <span class="text-slate-300">→</span>
          <span class="text-xs font-semibold px-2.5 py-1.5 rounded-full" :class="currentStep === 2 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'">2. Triage Details</span>
        </div>

        <!-- STEP 1: PATIENT SELECTION -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div v-if="!showNewPatientForm" class="space-y-4">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Find Patient</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5" :class="isSearching ? 'text-rose-600 animate-pulse' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                placeholder="Enter mobile number or name... (min 3 chars)" 
                class="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <!-- Search Results Dropdown -->
            <div v-if="patientStore.searchResults.length > 0" class="border border-slate-150 rounded-xl overflow-hidden shadow bg-white">
              <ul class="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                <li 
                  v-for="patient in patientStore.searchResults" 
                  :key="patient._id"
                  @click="selectPatient(patient)"
                  class="px-4 py-2.5 hover:bg-rose-50/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p class="text-sm font-bold text-slate-800">{{ patient.fullName }} <span class="text-xs text-slate-500 font-medium">({{ patient.gender }}, {{ patient.age || '?' }}y)</span></p>
                    <p class="text-xs text-slate-500"><span class="font-mono">{{ patient.patientCode }}</span> • {{ patient.mobileNo }}</p>
                  </div>
                  <button class="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
                </li>
              </ul>
            </div>

            <!-- No Results / Not Found -->
            <div v-if="searchQuery.length >= 3 && !isSearching && patientStore.searchResults.length === 0" class="text-center py-4">
              <p class="text-slate-500 text-xs font-semibold">No patient found matching your query.</p>
            </div>

            <div class="flex items-center pt-2">
              <div class="flex-grow border-t border-slate-200"></div>
              <span class="mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or</span>
              <div class="flex-grow border-t border-slate-200"></div>
            </div>

            <button 
              type="button"
              @click="toggleNewPatient"
              class="w-full bg-white border border-slate-200 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Register New Patient
            </button>
          </div>

          <!-- New Patient Form -->
          <div v-else class="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Registration</h3>
              <button type="button" @click="toggleNewPatient" class="text-xs text-rose-600 font-bold hover:underline">Cancel</button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <BaseInput v-model="newPatient.fullName" id="fullName" label="Full Name" placeholder="e.g. John Doe" required />
              <BaseInput v-model="newPatient.mobileNo" id="mobileNo" label="Mobile Number" placeholder="e.g. 9876543210" required />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <BaseSelect
                v-model="newPatient.gender"
                id="gender"
                label="Gender"
                :options="['Male', 'Female', 'Other']"
                required
              />
              <BaseInput v-model="newPatient.dateOfBirth" type="date" id="dob" label="Date of Birth" />
            </div>
            <BaseInput v-model="newPatient.address" id="address" label="Address" placeholder="e.g. 123 Main St" />
            <button 
              type="button" 
              @click="saveNewPatient"
              :disabled="isCreatingPatient"
              class="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <svg v-if="isCreatingPatient" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Save & Proceed
            </button>
          </div>
        </div>

        <!-- STEP 2: TRIAGE VISIT DETAILS -->
        <div v-else class="space-y-4">
          <div class="bg-rose-50 border border-rose-100 rounded-xl p-3 flex justify-between items-center">
            <div>
              <p class="text-xs font-bold text-rose-900">{{ selectedPatient?.fullName }}</p>
              <p class="text-[10px] text-rose-700 font-semibold">{{ selectedPatient?.patientCode }} • {{ selectedPatient?.mobileNo }}</p>
            </div>
            <button type="button" @click="currentStep = 1" class="text-[10px] text-rose-600 font-bold uppercase tracking-wider hover:underline">Change</button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <SearchableSelect
                v-model="visitForm.doctorId"
                id="doctor-select"
                label="Triage / Consultation Doctor on Duty (Optional)"
                placeholder="Select a doctor..."
                :options="doctorOptions"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseSelect
              v-model="visitForm.priority"
              id="priority"
              label="Priority Level"
              :options="['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
              required
            />
            <BaseInput 
              v-model="visitForm.arrivalDateTime"
              type="datetime-local"
              id="arrivalDateTime"
              label="Arrival Date/Time"
              :max="getLocalDatetimeString()"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput 
              v-model.number="visitForm.consultationFee"
              type="number"
              id="consultationFee"
              label="Emergency Rate (₹)"
              required
            />
            <BaseInput 
              v-model="visitForm.chiefComplaint" 
              id="chiefComplaint" 
              label="Chief Complaint" 
              placeholder="e.g. Severe chest pain, head injury..." 
            />
          </div>

          <!-- Fee Breakdown Info -->
          <div class="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs space-y-1.5">
            <div class="flex justify-between text-slate-600">
              <span>Emergency Rate:</span>
              <span class="font-mono font-semibold">₹{{ visitForm.consultationFee || 0 }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Hospital Charge:</span>
              <span class="font-mono font-semibold">₹{{ visitForm.hospitalCharges }}</span>
            </div>
            <div class="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
              <span>Total Registration Amount:</span>
              <span class="font-mono text-rose-600 font-extrabold">₹{{ (Number(visitForm.consultationFee) || 0) + (Number(visitForm.hospitalCharges) || 0) }}</span>
            </div>
          </div>

          <BaseTextarea v-model="visitForm.notes" id="notes" label="Assigned Notes / Instructions" placeholder="Brief assessment notes..." :rows="2" />

          <button 
            type="button" 
            @click="submitVisit"
            :disabled="isRegistering"
            class="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            <svg v-if="isRegistering" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Confirm ER Registration
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
