<script setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRadiologyStore } from '../../../stores/radiologyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import BaseInput from '../../../components/BaseInput.vue'
import api from '../../../axios/api'

const router = useRouter()
const route = useRoute()
const radiologyStore = useRadiologyStore()
const snackbarStore = useSnackbarStore()

const orderId = route.params.id
const loading = ref(false)
const pageLoading = ref(true)
const error = ref('')

// ── Order info header (readonly display) ─────────────────────────────────────
const orderInfo = ref(null)

// ── Form ──────────────────────────────────────────────────────────────────────
const form = reactive({
  patientId: '',
  referral: 'Doctor',
  doctorId: '',
  priority: 'ROUTINE',
  status: 'ORDERED',
  paymentStatus: 'UNPAID',
  clinicalNotes: '',
  remarks: ''
})

// ── Patient search ────────────────────────────────────────────────────────────
const patientSearchQuery = ref('')
const isSearchingPatients = ref(false)
const patientSearchResults = ref([])
const selectedPatient = ref(null)

const searchPatients = async () => {
  if (patientSearchQuery.value.length < 2) { patientSearchResults.value = []; return }
  isSearchingPatients.value = true
  try {
    const res = await api.get('/patients', { params: { search: patientSearchQuery.value } })
    patientSearchResults.value = res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    isSearchingPatients.value = false
  }
}
let ptTimer = null
watch(patientSearchQuery, () => {
  clearTimeout(ptTimer)
  if (selectedPatient.value && patientSearchQuery.value === selectedPatient.value.fullName) return
  ptTimer = setTimeout(searchPatients, 400)
})
const selectPatient = (p) => {
  selectedPatient.value = p
  form.patientId = p._id
  patientSearchQuery.value = p.fullName
  patientSearchResults.value = []
}
const clearPatient = () => {
  selectedPatient.value = null
  form.patientId = ''
  patientSearchQuery.value = ''
}

// ── Doctor search ─────────────────────────────────────────────────────────────
const doctorSearchQuery = ref('')
const isSearchingDoctors = ref(false)
const doctorSearchResults = ref([])
const selectedDoctor = ref(null)

const searchDoctors = async () => {
  if (doctorSearchQuery.value.length < 2) { doctorSearchResults.value = []; return }
  isSearchingDoctors.value = true
  try {
    const res = await api.get('/doctors', { params: { search: doctorSearchQuery.value } })
    doctorSearchResults.value = res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    isSearchingDoctors.value = false
  }
}
let drTimer = null
watch(doctorSearchQuery, () => {
  clearTimeout(drTimer)
  if (selectedDoctor.value && doctorSearchQuery.value === selectedDoctor.value.fullName) return
  drTimer = setTimeout(searchDoctors, 400)
})
const selectDoctor = (d) => {
  selectedDoctor.value = d
  form.doctorId = d._id
  doctorSearchQuery.value = d.fullName
  doctorSearchResults.value = []
}
const clearDoctor = () => {
  selectedDoctor.value = null
  form.doctorId = ''
  doctorSearchQuery.value = ''
}

// ── Quick-add Patient ─────────────────────────────────────────────────────────
const showPatientModal = ref(false)
const newPatient = reactive({ fullName: '', mobileNo: '' })
const isCreatingPatient = ref(false)

const openPatientModal = () => {
  const query = (patientSearchQuery.value || '').trim()
  if (/^\d+$/.test(query)) {
    newPatient.mobileNo = query
    newPatient.fullName = ''
  } else {
    newPatient.fullName = query
  }
  showPatientModal.value = true
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
    }
  } catch (err) {
    snackbarStore.show({ message: err.response?.data?.message || 'Failed to create patient', type: 'error' })
  } finally {
    isCreatingPatient.value = false
  }
}

// ── Radiology tests ───────────────────────────────────────────────────────────
const allTests = ref([])
const testSearchQuery = ref('')
const selectedTests = ref([])
const selectedCategoryFilter = ref('')

const allCategories = computed(() => {
  const map = {}
  allTests.value.forEach(t => {
    if (t.radiologyId) map[t.radiologyId._id || t.radiologyId] = t.radiologyId?.name || 'Unknown'
  })
  return Object.entries(map).map(([id, name]) => ({ id, name }))
})

const filteredAvailableTests = computed(() => {
  let list = allTests.value
  if (selectedCategoryFilter.value) list = list.filter(t => (t.radiologyId?._id || t.radiologyId) === selectedCategoryFilter.value)
  if (testSearchQuery.value) {
    const q = testSearchQuery.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || (t.code && t.code.toLowerCase().includes(q)))
  }
  return list
})

const totalAmount = computed(() => selectedTests.value.reduce((sum, t) => sum + (t.rate || 0), 0))

const fetchAllTests = async () => {
  try {
    const res = await api.get('/radiology/test', { params: { limit: 1000 } })
    allTests.value = (res.data.data || []).filter(t => t.isActive)
  } catch (err) {
    console.error('Error loading radiology tests:', err)
  }
}

const isTestSelected = (testId) => selectedTests.value.some(t => t.testId === testId)

const addTest = (test) => {
  if (!isTestSelected(test._id)) {
    selectedTests.value.push({ testId: test._id, testName: test.name, testCode: test.code, rate: test.rate || 0, amount: test.rate || 0 })
  }
}
const removeTest = (index) => selectedTests.value.splice(index, 1)

// ── Load existing order ───────────────────────────────────────────────────────
const fetchOrderData = async () => {
  if (!orderId) return
  pageLoading.value = true
  try {
    const result = await radiologyStore.getOrderById(orderId)
    const order = result.order
    const items = result.items || []

    orderInfo.value = order

    // Patient
    if (order.patientId && typeof order.patientId === 'object') {
      selectedPatient.value = order.patientId
      form.patientId = order.patientId._id
      patientSearchQuery.value = order.patientId.fullName
    } else {
      form.patientId = order.patientId
    }

    // Doctor
    if (order.doctorId && typeof order.doctorId === 'object') {
      selectedDoctor.value = order.doctorId
      form.doctorId = order.doctorId._id
      doctorSearchQuery.value = order.doctorId.fullName
    } else if (order.doctorId) {
      form.doctorId = order.doctorId
    }

    form.referral = order.referral || 'Doctor'
    form.priority = order.priority || 'ROUTINE'
    form.status = order.status || 'ORDERED'
    form.paymentStatus = order.paymentStatus || 'UNPAID'
    form.clinicalNotes = order.clinicalNotes || ''
    form.remarks = order.remarks || ''

    // Populate selected tests from existing items
    if (items.length > 0) {
      selectedTests.value = items.map(item => ({
        testId: item.radiologyTestId?._id || item.radiologyTestId,
        testName: item.radiologyTestId?.name || 'Unknown Test',
        testCode: item.radiologyTestId?.code || '',
        rate: item.rate,
        amount: item.amount
      }))
    }
  } catch (err) {
    error.value = 'Failed to load order details'
    snackbarStore.show({ message: error.value, type: 'error' })
  } finally {
    pageLoading.value = false
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  error.value = ''
  if (!form.patientId) { error.value = 'Patient is required'; return }
  if (form.referral === 'Doctor' && !form.doctorId) { error.value = 'Doctor is required when referral is Doctor'; return }
  if (selectedTests.value.length === 0) { error.value = 'Please select at least one radiology test'; return }

  loading.value = true
  try {
    const orderData = { ...form, tests: selectedTests.value }
    const response = await radiologyStore.updateOrder(orderId, orderData)
    if (response.success) {
      snackbarStore.show({ message: 'Radiology order updated successfully!', type: 'success' })
      router.push({ name: 'radiology-order' })
    } else {
      error.value = response.message || 'Failed to update order'
      snackbarStore.show({ message: error.value, type: 'error' })
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    snackbarStore.show({ message: error.value, type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(async () => {
  await Promise.all([fetchAllTests(), fetchOrderData()])
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        @click="router.go(-1)"
        class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all bg-slate-50/50"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Edit Radiology Order</h1>
        <p class="text-slate-500 mt-0.5 text-sm">Update the details of this radiology order.</p>
      </div>
    </div>

    <!-- Page Loading -->
    <div v-if="pageLoading" class="flex flex-col items-center justify-center py-32">
      <svg class="animate-spin h-10 w-10 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-slate-400 text-sm font-medium">Loading order details...</p>
    </div>

    <template v-else>
      <!-- Order Info Banner -->
      <div v-if="orderInfo" class="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-5">
        <div>
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Order No</p>
          <p class="text-base font-bold font-mono text-indigo-700 mt-0.5">{{ orderInfo.orderNo }}</p>
        </div>
        <div class="w-px h-8 bg-indigo-100 hidden sm:block"></div>
        <div>
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Order Date</p>
          <p class="text-sm font-semibold text-slate-700 mt-0.5">{{ formatDate(orderInfo.orderDate) }}</p>
        </div>
        <div class="w-px h-8 bg-indigo-100 hidden sm:block"></div>
        <div>
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Amount</p>
          <p class="text-sm font-bold text-emerald-700 mt-0.5">₹{{ orderInfo.totalAmount?.toLocaleString('en-IN') || '0' }}</p>
        </div>
        <div class="w-px h-8 bg-indigo-100 hidden sm:block"></div>
        <div>
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Status</p>
          <p class="text-sm font-bold text-violet-700 mt-0.5">{{ orderInfo.status?.replace('_', ' ') }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- ── Left Column ──────────────────────────────────── -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Error -->
          <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 animate-shake">
            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Order Info Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 class="text-base font-semibold text-slate-800">Order Information</h2>
            </div>
            <div class="p-6 space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                <!-- Patient -->
                <div class="relative">
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Patient <span class="text-rose-500">*</span></label>
                  <div v-if="selectedPatient" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div>
                      <span class="text-sm font-bold text-indigo-900">{{ selectedPatient.fullName }}</span>
                      <span class="text-xs text-indigo-700 block">{{ selectedPatient.patientCode }} · {{ selectedPatient.mobileNo }}</span>
                    </div>
                    <button type="button" @click="clearPatient" class="text-indigo-400 hover:text-indigo-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div v-else>
                    <input v-model="patientSearchQuery" type="text" placeholder="Search by name, phone or code..." class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner" :disabled="loading" />
                    <div v-if="patientSearchResults.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <ul class="py-1">
                        <li v-for="p in patientSearchResults" :key="p._id" @click="selectPatient(p)" class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <span class="text-sm font-semibold text-slate-800">{{ p.fullName }}</span>
                          <span class="text-xs text-slate-500 block">{{ p.patientCode }} · {{ p.mobileNo }}</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      v-if="patientSearchQuery.length >= 2 && patientSearchResults.length === 0 && !isSearchingPatients"
                      type="button"
                      @click="openPatientModal"
                      class="mt-2 w-full text-center px-4 py-2 border border-dashed border-indigo-300 rounded-lg text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors"
                    >+ Add New Patient "{{ patientSearchQuery }}"</button>
                  </div>
                </div>

                <!-- Referral -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Referral Source <span class="text-rose-500">*</span></label>
                  <div class="flex items-center gap-4 mt-2">
                    <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="radio" v-model="form.referral" value="Doctor" class="text-indigo-600" :disabled="loading"> Doctor</label>
                    <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="radio" v-model="form.referral" value="Self" class="text-indigo-600" :disabled="loading"> Self</label>
                    <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="radio" v-model="form.referral" value="Other" class="text-indigo-600" :disabled="loading"> Other</label>
                  </div>
                </div>

                <!-- Doctor -->
                <div v-if="form.referral === 'Doctor'" class="relative">
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Doctor <span class="text-rose-500">*</span></label>
                  <div v-if="selectedDoctor" class="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div>
                      <span class="text-sm font-bold text-indigo-900">{{ selectedDoctor.fullName }}</span>
                      <span class="text-xs text-indigo-700 block">{{ selectedDoctor.doctorCode || selectedDoctor.specializationId?.name || '' }}</span>
                    </div>
                    <button type="button" @click="clearDoctor" class="text-indigo-400 hover:text-indigo-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div v-else>
                    <input v-model="doctorSearchQuery" type="text" placeholder="Search doctor by name..." class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner" :disabled="loading" />
                    <div v-if="doctorSearchResults.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <ul class="py-1">
                        <li v-for="d in doctorSearchResults" :key="d._id" @click="selectDoctor(d)" class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <span class="text-sm font-semibold text-slate-800">{{ d.fullName }}</span>
                          <span class="text-xs text-slate-500 block">{{ d.doctorCode }} · {{ d.specializationId?.name }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Priority -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select v-model="form.priority" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-inner" :disabled="loading">
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="URGENT">URGENT</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>

                <!-- Order Status -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Order Status</label>
                  <select v-model="form.status" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-inner" :disabled="loading">
                    <option value="ORDERED">ORDERED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="PARTIALLY_COMPLETED">PARTIALLY COMPLETED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <!-- Payment Status -->
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Payment Status</label>
                  <select v-model="form.paymentStatus" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-inner" :disabled="loading">
                    <option value="UNPAID">UNPAID</option>
                    <option value="PAID">PAID</option>
                    <option value="IPD">IPD</option>
                    <option value="CREDIT">CREDIT</option>
                    <option value="CASHLESS">CASHLESS</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

              </div>

              <!-- Clinical Notes + Remarks -->
              <div class="grid grid-cols-1 gap-5">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Clinical Notes</label>
                  <textarea v-model="form.clinicalNotes" rows="2" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none shadow-inner" placeholder="Any relevant clinical history or notes..." :disabled="loading"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Remarks (Internal)</label>
                  <textarea v-model="form.remarks" rows="2" class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 resize-none shadow-inner" placeholder="Internal remarks..." :disabled="loading"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Test Picker Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-96">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 class="text-base font-semibold text-slate-800">Radiology Tests</h2>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <select v-model="selectedCategoryFilter" class="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-600 focus:outline-none focus:border-indigo-500">
                  <option value="">All Categories</option>
                  <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <div class="relative flex-1 min-w-0">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input v-model="testSearchQuery" type="text" placeholder="Search tests..." class="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
            <div class="p-4 overflow-y-auto flex-1 bg-slate-50/30">
              <div v-if="filteredAvailableTests.length === 0" class="flex justify-center py-8">
                <span class="text-slate-400 text-sm">{{ allTests.length === 0 ? 'Loading tests...' : 'No tests found.' }}</span>
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="test in filteredAvailableTests"
                  :key="test._id"
                  @click="addTest(test)"
                  class="p-3 bg-white border rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  :class="isTestSelected(test._id) ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-800 text-sm">{{ test.name }}</span>
                      <span v-if="test.code" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{{ test.code }}</span>
                    </div>
                    <span class="text-xs text-slate-500 mt-0.5 block">₹{{ test.rate?.toLocaleString('en-IN') || '0' }}</span>
                  </div>
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0"
                    :class="isTestSelected(test._id) ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600'"
                  >
                    <svg v-if="isTestSelected(test._id)" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Right Column: Summary ────────────────────────── -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-8">
            <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 class="text-base font-semibold text-slate-800">Selected Tests</h2>
              <span v-if="selectedTests.length > 0" class="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{{ selectedTests.length }}</span>
            </div>
            <div class="p-6">
              <!-- Empty state -->
              <div v-if="selectedTests.length === 0" class="text-center py-8">
                <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
                  </svg>
                </div>
                <p class="text-sm text-slate-500 font-medium">No tests selected</p>
                <p class="text-xs text-slate-400 mt-1">Click a test from the list to add it.</p>
              </div>

              <!-- Test list -->
              <ul v-else class="space-y-2.5 mb-6 max-h-[320px] overflow-y-auto pr-1">
                <li
                  v-for="(item, index) in selectedTests"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                >
                  <div class="flex-1 pr-2 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 leading-tight truncate">{{ item.testName }}</p>
                    <p class="text-xs text-slate-400 mt-0.5 font-mono">{{ item.testCode }} · ₹{{ item.rate?.toLocaleString('en-IN') }}</p>
                  </div>
                  <button type="button" @click="removeTest(index)" class="text-slate-300 hover:text-rose-500 transition-colors p-1 shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </li>
              </ul>

              <!-- Total -->
              <div class="border-t border-slate-200 pt-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-500">Subtotal</span>
                  <span class="font-medium text-slate-700">₹{{ totalAmount.toLocaleString('en-IN') }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold">
                  <span class="text-slate-800">Total</span>
                  <span class="text-indigo-600">₹{{ totalAmount.toLocaleString('en-IN') }}</span>
                </div>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:scale-100"
                :disabled="loading || selectedTests.length === 0"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
              </button>

              <!-- Cancel link -->
              <button
                type="button"
                @click="router.push({ name: 'radiology-order' })"
                class="w-full mt-3 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

      </form>
    </template>

    <!-- Quick Add Patient Modal -->
    <Teleport to="body">
      <div v-if="showPatientModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div @click="showPatientModal = false" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">Quick Add Patient</h3>
            <button @click="showPatientModal = false" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form @submit.prevent="createQuickPatient" class="p-6 space-y-4">
            <BaseInput v-model="newPatient.fullName" id="editPatientName" label="Full Name" required :disabled="isCreatingPatient" />
            <BaseInput v-model="newPatient.mobileNo" id="editPatientMobile" label="Mobile Number" required :disabled="isCreatingPatient" />
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" @click="showPatientModal = false" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-75" :disabled="isCreatingPatient">
                {{ isCreatingPatient ? 'Saving...' : 'Save Patient' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
.animate-shake { animation: shake 0.4s ease-in-out; }
</style>
