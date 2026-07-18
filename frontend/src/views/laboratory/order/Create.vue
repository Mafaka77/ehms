<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLabStore } from '../../../stores/labStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'
import api from '../../../axios/api'

const router = useRouter()
const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const error = ref('')

const form = reactive({
  patientId: '',
  referral: 'Doctor',
  doctorId: '',
  opdAppointmentId: '',
  priority: 'ROUTINE',
  clinicalNotes: '',
  remarks: ''
})

const patientSearchQuery = ref('')
const isSearchingPatients = ref(false)
const patientSearchResults = ref([])
const selectedPatient = ref(null)

const showPatientModal = ref(false)
const newPatient = reactive({
  fullName: '',
  mobileNo: '',
  age: '',
  gender: 'Male',
  address: ''
})
const isCreatingPatient = ref(false)

const searchPatients = async () => {
  if (patientSearchQuery.value.length < 2) {
    patientSearchResults.value = []
    return
  }
  isSearchingPatients.value = true
  try {
    const res = await api.get('/patients', { params: { search: patientSearchQuery.value } })
    patientSearchResults.value = res.data.data
  } catch (err) {
    console.error('Error searching patients:', err)
  } finally {
    isSearchingPatients.value = false
  }
}

let patientSearchTimeout = null
watch(patientSearchQuery, () => {
  if (patientSearchTimeout) clearTimeout(patientSearchTimeout)
  if (selectedPatient.value && patientSearchQuery.value === selectedPatient.value.fullName) return
  
  patientSearchTimeout = setTimeout(() => {
    searchPatients()
  }, 400)
})

const selectPatient = (patient) => {
  selectedPatient.value = patient
  form.patientId = patient._id
  patientSearchQuery.value = patient.fullName
  patientSearchResults.value = []
}

const clearPatient = () => {
  selectedPatient.value = null
  form.patientId = ''
  patientSearchQuery.value = ''
}

const doctorSearchQuery = ref('')
const isSearchingDoctors = ref(false)
const doctorSearchResults = ref([])
const selectedDoctor = ref(null)

const searchDoctors = async () => {
  if (doctorSearchQuery.value.length < 2) {
    doctorSearchResults.value = []
    return
  }
  isSearchingDoctors.value = true
  try {
    const res = await api.get('/doctors', { params: { search: doctorSearchQuery.value } })
    doctorSearchResults.value = res.data.data
  } catch (err) {
    console.error('Error searching doctors:', err)
  } finally {
    isSearchingDoctors.value = false
  }
}

let doctorSearchTimeout = null
watch(doctorSearchQuery, () => {
  if (doctorSearchTimeout) clearTimeout(doctorSearchTimeout)
  if (selectedDoctor.value && doctorSearchQuery.value === selectedDoctor.value.fullName) return
  
  doctorSearchTimeout = setTimeout(() => {
    searchDoctors()
  }, 400)
})

const selectDoctor = (doctor) => {
  selectedDoctor.value = doctor
  form.doctorId = doctor._id
  doctorSearchQuery.value = doctor.fullName
  doctorSearchResults.value = []
}

const clearDoctor = () => {
  selectedDoctor.value = null
  form.doctorId = ''
  doctorSearchQuery.value = ''
}

const opdAppointmentSearchQuery = ref('')
const isSearchingAppointments = ref(false)
const opdAppointmentSearchResults = ref([])
const selectedOpdAppointment = ref(null)

const searchOpdAppointments = async () => {
  if (opdAppointmentSearchQuery.value.length < 2) {
    opdAppointmentSearchResults.value = []
    return
  }
  isSearchingAppointments.value = true
  try {
    let search = opdAppointmentSearchQuery.value.trim();
    if (search.toUpperCase().startsWith('EH-OPD-')) {
      search = search.substring(7);
    }
    search = 'EH-OPD-' + search;
    const res = await api.get('/opd/appointments', { params: { search } })
    opdAppointmentSearchResults.value = res.data.data.appointments || []
  } catch (err) {
    console.error('Error searching appointments:', err)
  } finally {
    isSearchingAppointments.value = false
  }
}

let opdSearchTimeout = null
watch(opdAppointmentSearchQuery, () => {
  if (opdSearchTimeout) clearTimeout(opdSearchTimeout)
  if (selectedOpdAppointment.value && opdAppointmentSearchQuery.value === selectedOpdAppointment.value.appointmentId) return
  
  opdSearchTimeout = setTimeout(() => {
    searchOpdAppointments()
  }, 400)
})

const selectOpdAppointment = (app) => {
  selectedOpdAppointment.value = app
  form.opdAppointmentId = app._id
  opdAppointmentSearchQuery.value = app.appointmentId
  opdAppointmentSearchResults.value = []
  
  // Auto-populate Patient if present
  if (app.patientId) {
    selectPatient({
      _id: app.patientId._id,
      fullName: app.patientId.fullName,
      patientCode: app.patientId.patientCode,
      mobileNo: app.patientId.mobileNo
    })
  }
  
  // Auto-populate Doctor if present
  if (app.doctorId) {
    selectDoctor({
      _id: app.doctorId._id,
      fullName: app.doctorId.fullName,
      doctorCode: app.doctorId.doctorCode || '',
      specializationId: app.doctorId.specializationId
    })
    form.referral = 'Doctor'
  }
}

const clearOpdAppointment = () => {
  selectedOpdAppointment.value = null
  form.opdAppointmentId = ''
  opdAppointmentSearchQuery.value = ''
}

const createQuickPatient = async () => {
  if (!newPatient.fullName || !newPatient.mobileNo) return
  isCreatingPatient.value = true
  try {
    const res = await api.post('/patients', newPatient)
    if (res.data.data) {
      selectPatient(res.data.data)
      showPatientModal.value = false
      snackbarStore.show({ message: 'Patient created successfully', type: 'success' })
      newPatient.fullName = ''
      newPatient.mobileNo = ''
      newPatient.age = ''
      newPatient.gender = 'Male'
      newPatient.address = ''
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: err.response?.data?.message || 'Failed to create patient', type: 'error' })
  } finally {
    isCreatingPatient.value = false
  }
}

const testSearchQuery = ref('')
const selectedTests = ref([])

const filteredAvailableTests = computed(() => {
  if (!testSearchQuery.value) return labStore.tests
  const lowerQuery = testSearchQuery.value.toLowerCase()
  return labStore.tests.filter(test => 
    test.name.toLowerCase().includes(lowerQuery) || 
    (test.code && test.code.toLowerCase().includes(lowerQuery))
  )
})

const totalAmount = computed(() => {
  return selectedTests.value.reduce((total, item) => total + (item.rate || 0), 0)
})

const fetchTests = async () => {
  // Always fetch up to 1000 to ensure we have the full list for selection, 
  // bypassing any small limits (e.g. limit 10) from other pages.
  await labStore.fetchTests(1, 1000)
}

const addTest = (test) => {
  if (!selectedTests.value.find(t => t.testId === test._id)) {
    selectedTests.value.push({
      testId: test._id,
      testName: test.name,
      rate: test.rate || 0,
      amount: test.rate || 0,
      quantity: 1
    })
  }
}

const removeTest = (index) => {
  selectedTests.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.patientId.trim()) {
    error.value = 'Patient ID is required'
    return
  }
  if (form.referral === 'Doctor' && !form.doctorId.trim()) {
    error.value = 'Doctor ID is required when referred by a doctor'
    return
  }
  if (selectedTests.value.length === 0) {
    error.value = 'Please select at least one lab test'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const orderData = {
      ...form,
      tests: selectedTests.value
    }
    
    const response = await labStore.createOrder(orderData)
    
    if (response.success) {
      snackbarStore.show({
        message: 'Order created successfully!',
        type: 'success'
      })
      router.push({ name: 'laboratory-order' })
    } else {
      error.value = response.message || 'Failed to create order'
      snackbarStore.show({
        message: error.value,
        type: 'error'
      })
    }
  } catch (err) {
    console.error(err)
    error.value = 'An unexpected error occurred'
    snackbarStore.show({
      message: error.value,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTests()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button 
          @click="router.go(-1)"
          class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-100 bg-slate-50/50"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Create Lab Order</h1>
          <p class="text-slate-500 mt-1 text-sm">Fill in the details to register a new laboratory order.</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column: Details -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Error message if any -->
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
          <svg class="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 class="text-lg font-semibold text-slate-800">Order Information</h2>
          </div>
          
          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- OPD Appointment Search -->
              <div class="relative">
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">OPD Appointment ID (Optional)</label>
                
                <div v-if="selectedOpdAppointment" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-indigo-900">{{ selectedOpdAppointment.appointmentId }}</span>
                    <span class="text-xs text-indigo-700" v-if="selectedOpdAppointment.patientId">Patient: {{ selectedOpdAppointment.patientId.fullName }}</span>
                  </div>
                  <button type="button" @click="clearOpdAppointment" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div v-else>
                  <div class="relative flex items-center border border-slate-200 rounded-xl bg-white shadow-inner focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all overflow-hidden">
                    <span class="pl-4 pr-3 py-2.5 text-sm font-semibold font-mono text-slate-400 select-none bg-slate-50 border-r border-slate-200">EH-OPD-</span>
                    <input 
                      v-model="opdAppointmentSearchQuery"
                      type="text" 
                      placeholder="e.g. 0426-0001" 
                      class="w-full px-4 py-2.5 bg-transparent border-0 text-sm placeholder-slate-400 focus:outline-none"
                      :disabled="loading"
                    />
                  </div>
                  <!-- Dropdown Results -->
                  <div v-if="opdAppointmentSearchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <ul class="py-1">
                      <li 
                        v-for="app in opdAppointmentSearchResults" 
                        :key="app._id"
                        @click="selectOpdAppointment(app)"
                        class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex flex-col"
                      >
                        <span class="text-sm font-semibold text-slate-800 font-mono">{{ app.appointmentId }}</span>
                        <span class="text-xs text-slate-500" v-if="app.patientId">Patient: {{ app.patientId.fullName }} ({{ app.patientId.patientCode }})</span>
                        <span class="text-[10px] text-slate-400" v-if="app.doctorId">Doctor: Dr. {{ app.doctorId.fullName }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Patient Search -->
              <div class="relative">
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Patient <span class="text-rose-500">*</span></label>
                
                <div v-if="selectedPatient" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-indigo-900">{{ selectedPatient.fullName }}</span>
                    <span class="text-xs text-indigo-700">{{ selectedPatient.patientCode }} | {{ selectedPatient.mobileNo }}</span>
                  </div>
                  <button type="button" @click="clearPatient" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div v-else>
                  <input 
                    v-model="patientSearchQuery"
                    type="text" 
                    placeholder="Search by name, phone or code..." 
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                    :disabled="loading"
                  />
                  <!-- Dropdown Results -->
                  <div v-if="patientSearchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <ul class="py-1">
                      <li 
                        v-for="p in patientSearchResults" 
                        :key="p._id"
                        @click="selectPatient(p)"
                        class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex flex-col"
                      >
                        <span class="text-sm font-semibold text-slate-800">{{ p.fullName }}</span>
                        <span class="text-xs text-slate-500">{{ p.patientCode }} - {{ p.mobileNo }}</span>
                      </li>
                    </ul>
                  </div>
                  <!-- Quick Add Button -->
                  <button 
                    v-if="patientSearchQuery.length >= 2 && patientSearchResults.length === 0 && !isSearchingPatients"
                    type="button"
                    @click="showPatientModal = true"
                    class="mt-2 w-full text-center px-4 py-2 border border-dashed border-indigo-300 rounded-lg text-indigo-600 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                  >
                    + Add New Patient "{{ patientSearchQuery }}"
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Referral Source <span class="text-rose-500">*</span></label>
                <div class="flex items-center gap-4 mt-2">
                  <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input type="radio" v-model="form.referral" value="Doctor" class="text-indigo-600 focus:ring-indigo-500" :disabled="loading">
                    Doctor
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input type="radio" v-model="form.referral" value="Self" class="text-indigo-600 focus:ring-indigo-500" :disabled="loading">
                    Self
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input type="radio" v-model="form.referral" value="Other" class="text-indigo-600 focus:ring-indigo-500" :disabled="loading">
                    Other
                  </label>
                </div>
              </div>
              
              <div v-if="form.referral === 'Doctor'" class="relative">
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Doctor <span class="text-rose-500">*</span></label>
                
                <div v-if="selectedDoctor" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-indigo-900">{{ selectedDoctor.fullName }}</span>
                    <span class="text-xs text-indigo-700">{{ selectedDoctor.doctorCode || selectedDoctor.specializationId?.name || 'Doctor' }}</span>
                  </div>
                  <button type="button" @click="clearDoctor" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div v-else>
                  <input 
                    v-model="doctorSearchQuery"
                    type="text" 
                    placeholder="Search doctor by name..." 
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                    :disabled="loading"
                  />
                  <!-- Dropdown Results -->
                  <div v-if="doctorSearchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <ul class="py-1">
                      <li 
                        v-for="d in doctorSearchResults" 
                        :key="d._id"
                        @click="selectDoctor(d)"
                        class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex flex-col"
                      >
                        <span class="text-sm font-semibold text-slate-800">{{ d.fullName }}</span>
                        <span class="text-xs text-slate-500">{{ d.doctorCode }} - {{ d.specializationId?.name }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                <select 
                  v-model="form.priority"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner"
                  :disabled="loading"
                >
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="URGENT">URGENT</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Clinical Notes</label>
                <textarea 
                  v-model="form.clinicalNotes"
                  rows="2"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner resize-none"
                  placeholder="Any relevant clinical history or notes..."
                  :disabled="loading"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Remarks (Internal)</label>
                <textarea 
                  v-model="form.remarks"
                  rows="2"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner resize-none"
                  placeholder="Internal remarks for the laboratory..."
                  :disabled="loading"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Select Tests Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-96">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-slate-800">Add Tests</h2>
            <div class="relative w-64">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                v-model="testSearchQuery"
                type="text" 
                placeholder="Search tests..." 
                class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div class="p-4 overflow-y-auto flex-1 bg-slate-50/30">
            <div v-if="labStore.loading && filteredAvailableTests.length === 0" class="flex justify-center py-8">
              <span class="text-slate-400 text-sm">Loading tests...</span>
            </div>
            <div v-else-if="filteredAvailableTests.length === 0" class="flex justify-center py-8">
              <span class="text-slate-400 text-sm">No tests found.</span>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                v-for="test in filteredAvailableTests" 
                :key="test._id"
                @click="addTest(test)"
                class="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-800 text-sm">{{ test.name }}</span>
                    <span v-if="test.code" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{{ test.code }}</span>
                  </div>
                  <span class="text-xs text-slate-500 mt-1 block">₹{{ test.rate?.toLocaleString() || '0' }}</span>
                </div>
                <div class="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-8">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 class="text-lg font-semibold text-slate-800">Selected Tests</h2>
          </div>
          
          <div class="p-6">
            <div v-if="selectedTests.length === 0" class="text-center py-8">
              <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <p class="text-sm text-slate-500 font-medium">No tests selected yet</p>
              <p class="text-xs text-slate-400 mt-1">Select tests from the left to add them to this order.</p>
            </div>
            
            <ul v-else class="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
              <li v-for="(item, index) in selectedTests" :key="index" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex-1 pr-3">
                  <p class="text-sm font-semibold text-slate-800 leading-tight">{{ item.testName }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">₹{{ item.rate.toLocaleString() }}</p>
                </div>
                <button 
                  type="button" 
                  @click="removeTest(index)"
                  class="text-rose-400 hover:text-rose-600 transition-colors p-1 focus:outline-none"
                  title="Remove"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </li>
            </ul>

            <div class="border-t border-slate-200 pt-5 space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">Subtotal</span>
                <span class="font-medium text-slate-700">₹{{ totalAmount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between items-center text-lg font-bold">
                <span class="text-slate-800">Total</span>
                <span class="text-indigo-600">₹{{ totalAmount.toLocaleString() }}</span>
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
              :disabled="loading || selectedTests.length === 0"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? 'Processing...' : 'Confirm Order' }}</span>
            </button>
          </div>
        </div>
      </div>
      
    </form>

    <!-- Quick Add Patient Modal -->
    <Teleport to="body">
      <div v-if="showPatientModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div @click="showPatientModal = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 flex flex-col overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">Quick Add Patient</h3>
            <button @click="showPatientModal = false" class="text-slate-400 hover:text-slate-600"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <form @submit.prevent="createQuickPatient" class="p-6 space-y-4">
            <BaseInput 
              v-model="newPatient.fullName"
              id="newPatientName"
              label="Full Name"
              required
              :disabled="isCreatingPatient"
            />
            <BaseInput 
              v-model="newPatient.mobileNo"
              id="newPatientMobile"
              label="Mobile Number"
              required
              :disabled="isCreatingPatient"
            />
            <div class="grid grid-cols-3 gap-4">
              <BaseInput 
                v-model.number="newPatient.age"
                id="newPatientAge"
                label="Age (Years)"
                type="number"
                :disabled="isCreatingPatient"
              />
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select 
                  v-model="newPatient.gender"
                  class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  :disabled="isCreatingPatient"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <BaseInput 
                v-model="newPatient.address"
                id="newPatientAddress"
                label="Address"
                :disabled="isCreatingPatient"
              />
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" @click="showPatientModal = false" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700" :disabled="isCreatingPatient">
                {{ isCreatingPatient ? 'Saving...' : 'Save Patient' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
