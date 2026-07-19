<script setup>
import { ref, watch,computed } from 'vue'
import { useLabStore } from '../../../stores/labStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const orderData = ref(null)
const tests = ref([])

const calculateAge = (patient) => {
  if (!patient) return '-'
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth)
    const today = new Date()
    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()
    if (months < 0 || (months === 0 && days < 0)) years--
    
    const lastBirthday = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate())
    const diffTime = Math.abs(today.getTime() - lastBirthday.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))
    return years > 0 ? `${years}Y ${diffDays}D` : `${diffDays}D`
  }
  return patient.age ? `${patient.age}Y` : '-'
}

const testsWithSections = computed(() => {
  return tests.value.map(test => {
    const groups = {}
    test.parameters.forEach(param => {
      const sec = param.section || 'General'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(param)
    })
    
    const groupedParams = Object.keys(groups).map(section => ({
      section,
      params: groups[section]
    })).sort((a, b) => a.section.localeCompare(b.section))

    return {
      ...test,
      groupedParams
    }
  })
})
const fetchResults = async () => {
  if (!props.order?._id) return
  loading.value = true
  try {
    const res = await labStore.fetchOrderResults(props.order._id)
    orderData.value = res.order
    tests.value = res.tests
  } catch (error) {
    console.error('Error fetching results:', error)
    snackbarStore.show({ message: 'Failed to load test parameters', type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchResults()
  }
})

const saveResults = async () => {
  loading.value = true
  try {
    // Flatten results to send to backend
    const resultsData = []
    tests.value.forEach(test => {
      test.parameters.forEach(param => {
        resultsData.push({
          orderItemId: test.orderItemId,
          parameterId: param.parameterId,
          measuredValue: param.measuredValue || '',
          isOutOfRange: !!param.isOutOfRange
        })
      })
    })

    // Validation for empty and required fields
    let hasEmptyRequired = false
    let hasEmptyOptional = false

    tests.value.forEach(test => {
      test.parameters.forEach(param => {
        const val = param.measuredValue ? param.measuredValue.toString().trim() : ''
        if (!val) {
          if (param.isRequired) hasEmptyRequired = true
          else hasEmptyOptional = true
        }
      })
    })

    if (hasEmptyRequired) {
      snackbarStore.show({ message: 'Please fill in all required parameters.', type: 'error' })
      loading.value = false
      return
    }

    if (hasEmptyOptional) {
      if (!confirm('Some optional parameter results are empty. Do you want to save anyway?')) {
        loading.value = false;
        return
      }
    }

    const res = await labStore.saveOrderResults(props.order._id, resultsData)
    snackbarStore.show({ message: 'Lab results saved successfully!', type: 'success' })
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error saving results:', error)
    snackbarStore.show({ message: 'Failed to save laboratory results', type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="text-lg font-bold text-slate-800">Enter Lab Results</h3>
          <p class="font-mono text-xs text-indigo-600 font-semibold mt-0.5" v-if="order">{{ order.orderNo }}</p>
        </div>
        <button @click="emit('close')" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && tests.length === 0" class="flex flex-col items-center justify-center py-32 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Loading parameters...</span>
      </div>

      <!-- Main Body -->
      <div v-else class="flex-grow overflow-y-auto p-6 space-y-6">
        <!-- Patient Banner -->
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Patient</div>
            <div class="font-semibold text-slate-800 mt-1">{{ order.patientId?.fullName }}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Age / Gender</div>
            <div class="font-semibold text-slate-800 mt-1">{{ calculateAge(order.patientId) }} / {{ order.patientId?.gender }}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Referring Doctor</div>
            <div class="font-semibold text-slate-800 mt-1">{{ order.referral === 'Self' ? 'Self-Referred' : `Dr. ${order.doctorId?.fullName || 'N/A'}` }}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Order Date</div>
            <div class="font-semibold text-slate-800 mt-1">{{ formatDate(order.orderDate) }}</div>
          </div>
        </div>

        <!-- Form Fields grouped by Test -->
        <div class="space-y-6">
          <div v-for="test in testsWithSections" :key="test.testId" class="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
            <!-- Parameters table/list -->
            <div class="p-5">
              <div v-if="test.parameters.length === 0" class="text-center py-4 text-xs text-slate-400">
                No parameters configured for this test.
              </div>
              <div v-else class="space-y-4">
                <!-- Header row for screen sizes above mobile -->
                <div class="hidden md:grid md:grid-cols-12 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                  <div class="col-span-4">Parameter Name</div>
                  <div class="col-span-3 text-center">Result Value</div>
                  <div class="col-span-1 text-center">Unit</div>
                  <div class="col-span-3 text-center">Reference Ranges</div>
                  <div class="col-span-1 text-center">Out of Range</div>
                </div>

                <!-- Lab Test Name Row -->
                <div class="col-span-12 bg-indigo-50/60 px-4 py-2.5 text-sm font-bold text-indigo-900 uppercase tracking-widest border-b border-indigo-100 text-center">
                  {{ test.testName }}
                </div>

                <template v-for="group in test.groupedParams" :key="group.section">
                  <!-- Section Header Row -->
                  <div class="hidden md:block col-span-12 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-y border-slate-100/80 mt-2 first:mt-0">
                    {{ group.section }}
                  </div>
                  
                  <!-- Parameter Entry Row -->
                  <div 
                    v-for="param in group.params" 
                    :key="param.parameterId"
                    class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-2 border-b border-slate-50 last:border-b-0"
                  >
                    <!-- Name -->
                    <div class="col-span-1 md:col-span-4">
                      <span class="text-sm font-semibold text-slate-700">{{ param.name }}</span>
                      <span v-if="param.isRequired" class="text-rose-500 ml-1" title="Required">*</span>
                    </div>

                    <!-- Value Input -->
                    <div class="col-span-1 md:col-span-3">
                      <template v-if="param.resultType === 'OPTION'">
                        <select 
                          v-model="param.measuredValue"
                          class="w-full text-center py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold"
                        >
                          <option value="">Select</option>
                          <option v-for="opt in param.options" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                      </template>
                      
                      <template v-else-if="param.resultType === 'BOOLEAN'">
                        <select 
                          v-model="param.measuredValue"
                          class="w-full text-center py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </template>
                      
                      <template v-else-if="param.resultType === 'TEXT'">
                        <input 
                          v-model="param.measuredValue"
                          type="text"
                          placeholder="Enter text"
                          class="w-full text-center py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                        />
                      </template>
                      
                      <template v-else>
                        <input 
                          v-model="param.measuredValue"
                          type="text"
                          placeholder="Enter value"
                          class="w-full text-center py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono"
                        />
                      </template>
                    </div>

                  <!-- Unit -->
                  <div class="col-span-1 md:col-span-1 text-center text-xs font-semibold text-slate-500">
                    {{ param.unit || '-' }}
                  </div>

                  <!-- Ranges -->
                  <div class="col-span-1 md:col-span-3 text-center text-[11px] text-slate-500 space-y-0.5">
                    <template v-if="param.referenceIntervals && param.referenceIntervals.length > 0">
                      <div v-for="(interval, idx) in param.referenceIntervals" :key="idx" class="flex justify-center gap-1">
                        <span class="font-semibold text-indigo-600">{{ interval.label }}:</span>
                        <span class="font-mono">{{ interval.range }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div v-if="param.normalRangeMale">Male: <span class="font-mono">{{ param.normalRangeMale }}</span></div>
                      <div v-if="param.normalRangeFemale">Female: <span class="font-mono">{{ param.normalRangeFemale }}</span></div>
                      <div v-if="param.normalRangeChild">Child: <span class="font-mono">{{ param.normalRangeChild }}</span></div>
                      <div v-if="!param.normalRangeMale && !param.normalRangeFemale && !param.normalRangeChild" class="italic text-slate-400">Not specified</div>
                    </template>
                  </div>

                    <!-- Out of Range Toggle -->
                    <div class="col-span-1 md:col-span-1 flex justify-center">
                      <label class="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          v-model="param.isOutOfRange"
                          class="sr-only peer"
                        />
                        <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button 
          @click="emit('close')"
          :disabled="loading"
          class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button 
          @click="saveResults"
          :disabled="loading"
          class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="loading" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
          Submit Results
        </button>
      </div>
    </div>
  </div>
</template>
