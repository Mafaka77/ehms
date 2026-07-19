<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDoctorStore } from '../../stores/doctorStore'
import { useMasterSpecializationStore } from '../../stores/masterSpecializationStore'
import { useMasterDepartmentStore } from '../../stores/masterDepartmentStore'
import { useMasterDesignationStore } from '../../stores/masterDesignationStore'
import { useSnackbarStore } from '../../stores/snackbarStore'
import BaseInput from '../../components/BaseInput.vue'

const router = useRouter()
const route = useRoute()
const doctorStore = useDoctorStore()
const specStore = useMasterSpecializationStore()
const deptStore = useMasterDepartmentStore()
const desigStore = useMasterDesignationStore()
const snackbarStore = useSnackbarStore()

const loadingData = ref(false)
const savingData = ref(false)

const specSearch = ref('')
const isSpecOpen = ref(false)

const filteredSpecializations = computed(() => {
  return specStore.specializations.filter(s => 
    s.name.toLowerCase().includes(specSearch.value.toLowerCase())
  )
})

const selectSpecialization = (spec) => {
  form.value.specializationId = spec._id
  specSearch.value = spec.name
  isSpecOpen.value = false
}

const clearSpecialization = () => {
  form.value.specializationId = ''
  specSearch.value = ''
}

const deptSearch = ref('')
const isDeptOpen = ref(false)

const desigSearch = ref('')
const isDesigOpen = ref(false)

const filteredDepartments = computed(() => {
  return deptStore.departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.value.toLowerCase())
  )
})

const filteredDesignations = computed(() => {
  return desigStore.designations.filter(d => 
    d.designationName.toLowerCase().includes(desigSearch.value.toLowerCase())
  )
})

const selectDepartment = (dept) => {
  form.value.departmentId = dept._id
  deptSearch.value = dept.name
  isDeptOpen.value = false
}

const selectDesignation = (desig) => {
  form.value.designationId = desig._id
  desigSearch.value = desig.designationName
  isDesigOpen.value = false
}

const clearDepartment = () => {
  form.value.departmentId = ''
  deptSearch.value = ''
}

const clearDesignation = () => {
  form.value.designationId = ''
  desigSearch.value = ''
}

const form = ref({
  fullName: '',
  gender: '',
  mobileNo: '',
  email: '',
  qualification: '',
  registrationNo: '',
  specializationId: '',
  doctorType: 'CONSULTANT',
  consultationFee: 0,
  departmentId: '',
  designationId: '',
  basicSalary: 0,
  joiningDate: ''
})

const handleBack = () => {
  router.push('/doctors')
}

const loadData = async () => {
  loadingData.value = true
  try {
    await Promise.all([
      specStore.fetchSpecializations(1,100,''),
      deptStore.fetchDepartments(1,200,''),
      desigStore.fetchDesignations(1,200,'')
    ])
    
    // Load existing doctor
    const doctorId = route.params.id
    if (doctorId) {
      const res = await doctorStore.fetchDoctorById(doctorId)
      if (res.success && res.data) {
        const d = res.data
        form.value = {
          fullName: d.fullName || '',
          gender: d.gender || '',
          mobileNo: d.mobileNo || '',
          email: d.email || '',
          qualification: d.qualification || '',
          registrationNo: d.registrationNo || '',
          specializationId: d.specializationId?._id || d.specializationId || '',
          doctorType: d.doctorType || 'CONSULTANT',
          consultationFee: d.consultationFee || 0,
          departmentId: d.employeeId?.departmentId || '',
          designationId: d.employeeId?.designationId || '',
          basicSalary: d.employeeId?.basicSalary || 0,
          joiningDate: d.employeeId?.joiningDate ? d.employeeId.joiningDate.split('T')[0] : ''
        }
        
        if (d.specializationId) specSearch.value = d.specializationId.name || ''
      } else {
        snackbarStore.show({ message: 'Failed to fetch doctor details', type: 'error' })
        router.push('/doctors')
      }
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'Failed to load data.', type: 'error' })
  } finally {
    loadingData.value = false
  }
}

const handleSubmit = async () => {
  savingData.value = true
  try {
    const doctorId = route.params.id
    const response = await doctorStore.updateDoctor(doctorId, form.value)
    if (response.success) {
      snackbarStore.show({ message: 'Doctor updated successfully!', type: 'success' })
      handleBack()
    } else {
      snackbarStore.show({ message: response.message || 'Failed to update doctor', type: 'error' })
    }
  } catch (err) {
    console.error(err)
    snackbarStore.show({ message: 'An error occurred', type: 'error' })
  } finally {
    savingData.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 pb-10">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <button 
        @click="handleBack"
        class="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all shadow-sm focus:outline-none"
        title="Go Back"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Edit Doctor</h1>
        <p class="text-slate-500 text-sm mt-0.5">Update clinical staff member details.</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingData" class="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-100">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium">Loading form options...</span>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
      <form @submit.prevent="handleSubmit" class="space-y-8">
        
        <!-- Section 1: Basic Information -->
        <div>
          <h2 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Personal Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput v-model="form.fullName" id="fullName" label="Full Name" placeholder="Dr. John Doe" required />
            <BaseInput v-model="form.email" id="email" type="email" label="Email Address" placeholder="doctor@hospital.com" required />
            <BaseInput v-model="form.mobileNo" id="mobileNo" label="Mobile Number" placeholder="e.g. 9876543210" required />
            
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
              <div class="relative">
                <select v-model="form.gender" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-700 shadow-sm" required>
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>


          </div>
        </div>

        <!-- Section 2: Clinical Information -->
        <div>
          <h2 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Clinical Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput v-model="form.qualification" id="qualification" label="Qualification" placeholder="e.g. MBBS, MD" required />
            <BaseInput v-model="form.registrationNo" id="registrationNo" label="Medical Registration No." placeholder="Registration number" />
            <!-- <BaseInput v-model.number="form.consultationFee" id="consultationFee" type="number" label="Consultation Fee (₹)" placeholder="0" required /> -->
            
            <!-- Specialization Autocomplete -->
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Specialization <span class="text-rose-500">*</span></label>
              
              <div v-if="form.specializationId" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span class="text-sm font-bold text-indigo-900">{{ specSearch }}</span>
                <button type="button" @click="clearSpecialization" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div v-else class="relative">
                <input 
                  type="text" 
                  v-model="specSearch" 
                  @focus="isSpecOpen = true"
                  @blur="setTimeout(() => isSpecOpen = false, 200)"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Search specialization..."
                  :disabled="loadingData || savingData"
                  required
                />
                
                <div v-if="isSpecOpen && filteredSpecializations.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li 
                      v-for="spec in filteredSpecializations" 
                      :key="spec._id" 
                      @mousedown.prevent="selectSpecialization(spec)"
                      class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col"
                    >
                      <span class="text-sm font-semibold text-slate-700">{{ spec.name }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Doctor Type</label>
              <div class="relative">
                <select v-model="form.doctorType" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-700 shadow-sm" required>
                  <option value="VISITING">Visiting</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="PERMANENT">Permanent (Employee)</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Employee Details (Conditional) -->
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 -translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
          <div v-if="form.doctorType === 'PERMANENT'" class="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
            <div class="flex items-start gap-3 mb-6">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-800">HR / Employee Details</h2>
                <p class="text-sm text-slate-500">Permanent doctors are automatically registered as employees in the HR system.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Department Autocomplete -->
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              
              <div v-if="form.departmentId" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span class="text-sm font-bold text-indigo-900">{{ deptSearch }}</span>
                <button type="button" @click="clearDepartment" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div v-else class="relative">
                <input 
                  type="text" 
                  v-model="deptSearch" 
                  @focus="isDeptOpen = true"
                  @blur="setTimeout(() => isDeptOpen = false, 200)"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Search department..."
                  :disabled="loadingData || savingData"
                  required
                />
                
                <div v-if="isDeptOpen && filteredDepartments.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li 
                      v-for="dept in filteredDepartments" 
                      :key="dept._id" 
                      @mousedown.prevent="selectDepartment(dept)"
                      class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col"
                    >
                      <span class="text-sm font-semibold text-slate-700">{{ dept.name }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Designation Autocomplete -->
            <div class="relative">
              <label class="block text-sm font-semibold text-slate-700 mb-2">Designation</label>
              
              <div v-if="form.designationId" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span class="text-sm font-bold text-indigo-900">{{ desigSearch }}</span>
                <button type="button" @click="clearDesignation" class="text-indigo-400 hover:text-indigo-600 focus:outline-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div v-else class="relative">
                <input 
                  type="text" 
                  v-model="desigSearch" 
                  @focus="isDesigOpen = true"
                  @blur="setTimeout(() => isDesigOpen = false, 200)"
                  class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Search designation..."
                  :disabled="loadingData || savingData"
                  required
                />
                
                <div v-if="isDesigOpen && filteredDesignations.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li 
                      v-for="desig in filteredDesignations" 
                      :key="desig._id" 
                      @mousedown.prevent="selectDesignation(desig)"
                      class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col"
                    >
                      <span class="text-sm font-semibold text-slate-700">{{ desig.designationName }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

              <BaseInput v-model.number="form.basicSalary" id="basicSalary" type="number" label="Basic Salary (₹)" placeholder="0" required />
              <BaseInput v-model="form.joiningDate" id="joiningDate" type="date" label="Joining Date" required />
            </div>
          </div>
        </transition>

        <!-- Actions -->
        <div class="flex justify-end pt-6 border-t border-slate-100 gap-3">
          <button 
            type="button" 
            @click="handleBack"
            class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="savingData"
            class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <svg v-if="savingData" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>Update Doctor</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
