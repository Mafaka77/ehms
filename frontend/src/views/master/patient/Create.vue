<script setup>
import { ref, watch } from 'vue'
import { usePatientStore } from '../../../stores/patientStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'created'])

const patientStore = usePatientStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)

const form = ref({
  fullName: '',
  fathersName: '',
  mothersName: '',
  maritalStatus: '',
  religion: '',
  husbandwifeName: '',
  gender: 'Male',
  dateOfBirth: '',
  age: null,
  bloodGroup: '',
  occupation: '',
  mobileNo: '',
  alternateMobileNo: '',
  email: '',
  address: '',
  contactPerson: '',
  contactPersonRelation: '',
  contactPersonMobile: '',
  contactPersonAddress: '',
  allergies: '',
  remarks: '',
  isActive: true
})

const errors = ref({})

// Calculate age automatically if DOB is changed
watch(() => form.value.dateOfBirth, (newDob) => {
  if (newDob) {
    const dob = new Date(newDob)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    form.value.age = age >= 0 ? age : 0
  }
})

const resetForm = () => {
  form.value = {
    fullName: '',
    fathersName: '',
    mothersName: '',
    maritalStatus: '',
    religion: '',
    husbandwifeName: '',
    gender: 'Male',
    dateOfBirth: '',
    age: null,
    bloodGroup: '',
    occupation: '',
    mobileNo: '',
    alternateMobileNo: '',
    email: '',
    address: '',
    contactPerson: '',
    contactPersonRelation: '',
    contactPersonMobile: '',
    contactPersonAddress: '',
    allergies: '',
    remarks: '',
    isActive: true
  }
  errors.value = {}
}

const validate = () => {
  errors.value = {}
  if (!form.value.fullName.trim()) {
    errors.value.fullName = 'Full Name is required'
  }
  if (!form.value.mobileNo.trim()) {
    errors.value.mobileNo = 'Mobile Number is required'
  } else if (!/^\d{10}$/.test(form.value.mobileNo.trim())) {
    errors.value.mobileNo = 'Mobile Number must be 10 digits'
  }
  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  loading.value = true
  const payload = {
    ...form.value,
    allergies: form.value.allergies
      ? form.value.allergies.split(',').map(a => a.trim()).filter(Boolean)
      : []
  }

  const res = await patientStore.createPatient(payload)
  loading.value = false

  if (res.success) {
    snackbarStore.show({ message: 'Patient registered successfully!', type: 'success' })
    resetForm()
    emit('created', res.data)
    emit('close')
  } else {
    snackbarStore.show({ message: res.message || 'Failed to register patient', type: 'error' })
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="text-base font-bold text-slate-800">Register New Patient</h3>
          <p class="text-xs text-slate-400">Fill in the details to create a new patient record</p>
        </div>
        <button
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
        
        <!-- Section: Basic Information -->
        <div>
          <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
            Basic &amp; Personal Details
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            <!-- Full Name -->
            <div class="sm:col-span-2 md:col-span-1">
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Full Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                v-model="form.fullName"
                placeholder="Full Name"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                :class="{ 'border-rose-400 focus:border-rose-500': errors.fullName }"
              />
              <p v-if="errors.fullName" class="text-[10px] text-rose-500 mt-0.5 font-semibold">{{ errors.fullName }}</p>
            </div>

            <!-- Father's Name -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Father's Name
              </label>
              <input
                type="text"
                v-model="form.fathersName"
                placeholder="Father's Name"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Mother's Name -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Mother's Name
              </label>
              <input
                type="text"
                v-model="form.mothersName"
                placeholder="Mother's Name"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Gender -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Gender
              </label>
              <select
                v-model="form.gender"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Date of Birth -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                v-model="form.dateOfBirth"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Age -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                v-model.number="form.age"
                min="0"
                placeholder="Age"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Marital Status -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Marital Status
              </label>
              <select
                v-model="form.maritalStatus"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="">-- Select Status --</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Spouse Name -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Spouse / Husband / Wife Name
              </label>
              <input
                type="text"
                v-model="form.husbandwifeName"
                placeholder="Spouse Name"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Religion -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Religion
              </label>
              <input
                type="text"
                v-model="form.religion"
                placeholder="e.g. Christian, Hindu, Muslim..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Occupation -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Occupation
              </label>
              <select
                v-model="form.occupation"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="">-- Select Occupation --</option>
                <option value="Private Employee">Private Employee</option>
                <option value="Government Employee">Government Employee</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Business">Business</option>
                <option value="Student">Student</option>
                <option value="Housewife">Housewife</option>
                <option value="Retired">Retired</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Farmer">Farmer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Blood Group -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Blood Group
              </label>
              <select
                v-model="form.bloodGroup"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="">-- Select Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

          </div>
        </div>

        <!-- Section: Contact & Address -->
        <div>
          <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
            Contact &amp; Address Details
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            <!-- Mobile No -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Mobile Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                v-model="form.mobileNo"
                maxlength="10"
                placeholder="10-digit mobile"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                :class="{ 'border-rose-400 focus:border-rose-500': errors.mobileNo }"
              />
              <p v-if="errors.mobileNo" class="text-[10px] text-rose-500 mt-0.5 font-semibold">{{ errors.mobileNo }}</p>
            </div>

            <!-- Alt Mobile -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Alt Mobile Number
              </label>
              <input
                type="text"
                v-model="form.alternateMobileNo"
                maxlength="10"
                placeholder="Alternate contact"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Email Address
              </label>
              <input
                type="email"
                v-model="form.email"
                placeholder="Email address"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Address -->
            <div class="sm:col-span-2 md:col-span-3">
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Address
              </label>
              <textarea
                v-model="form.address"
                rows="2"
                placeholder="Full address details..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium resize-none"
              ></textarea>
            </div>

          </div>
        </div>

        <!-- Section: Emergency / Contact Person -->
        <div>
          <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
            Contact Person / Emergency Contact
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            <!-- Contact Person Name -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                v-model="form.contactPerson"
                placeholder="Contact Person Name"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Relation -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Relation
              </label>
              <input
                type="text"
                v-model="form.contactPersonRelation"
                placeholder="e.g. Brother, Parent, Friend"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Contact Person Mobile -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Contact Person Mobile
              </label>
              <input
                type="text"
                v-model="form.contactPersonMobile"
                maxlength="10"
                placeholder="10-digit mobile"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Contact Person Address -->
            <div class="sm:col-span-2 md:col-span-3">
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Contact Person Address
              </label>
              <input
                type="text"
                v-model="form.contactPersonAddress"
                placeholder="Address of contact person"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

          </div>
        </div>

        <!-- Section: Medical Notes -->
        <div>
          <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
            Medical &amp; Additional Notes
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <!-- Allergies -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Known Allergies <span class="text-[9px] text-slate-400 lowercase">(comma separated)</span>
              </label>
              <input
                type="text"
                v-model="form.allergies"
                placeholder="e.g. Penicillin, Dust, Peanuts"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

            <!-- Remarks -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                v-model="form.remarks"
                placeholder="Additional notes..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
              />
            </div>

          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSave"
          :disabled="loading"
          class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span>{{ loading ? 'Saving...' : 'Register Patient' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
