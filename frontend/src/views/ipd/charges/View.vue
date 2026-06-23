<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const route = useRoute()
const router = useRouter()
const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

const categoryId = route.params.id
const loading = ref(false)
const category = ref(null)
const masters = ref([])
const showAddModal = ref(false)
const submitting = ref(false)
const editMode = ref(false)
const editMasterId = ref(null)

// Package item states
const expandedMasters = ref([])
const packageItemsMap = ref({})
const loadingPackageMap = ref({})
const showPackageModal = ref(false)
const activeMasterForPackage = ref(null)
const submittingPackage = ref(false)

const packageForm = ref({
  itemName: '',
  categoryCode: '',
  defaultAmount: 0,
  isMandatory: true
})

const form = ref({
  code: '',
  name: '',
  description: '',
  billingUnit: 'ITEM',
  standardRate: 0,
  applicableTo: ['IPD'],
  remarks: ''
})

const billingUnits = [
  { value: 'DAY', label: 'Per Day' },
  { value: 'HOUR', label: 'Per Hour' },
  { value: 'VISIT', label: 'Per Visit' },
  { value: 'SESSION', label: 'Per Session' },
  { value: 'UNIT', label: 'Per Unit' },
  { value: 'ITEM', label: 'Per Item' },
  { value: 'TEST', label: 'Per Test' },
  { value: 'PROCEDURE', label: 'Per Procedure' }
]


const applicableOptions = [
  { value: 'OPD', label: 'OPD' },
  { value: 'IPD', label: 'IPD' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'DAYCARE', label: 'Daycare' },
  { value: 'DENTAL', label: 'Dental' }
]

const fetchCategoryDetails = async () => {
  loading.value = true
  const resCat = await admissionStore.fetchChargeCategoryById(categoryId)
  if (resCat.success) {
    category.value = resCat.data
    const resMasters = await admissionStore.fetchChargeMasters(categoryId)
    if (resMasters.success) {
      masters.value = resMasters.data
    }
  } else {
    snackbarStore.show({ message: resCat.message || 'Category details not found', type: 'error' })
    router.push({ name: 'ipd-charges' })
  }
  loading.value = false
}

const openAddModal = () => {
  editMode.value = false
  editMasterId.value = null
  form.value = {
    code: '',
    name: '',
    description: '',
    billingUnit: 'ITEM',
    standardRate: 0,
    applicableTo: ['IPD'],
    remarks: ''
  }
  showAddModal.value = true
}

const openEditModal = (master) => {
  editMode.value = true
  editMasterId.value = master._id
  form.value = {
    code: master.code || '',
    name: master.name || '',
    description: master.description || '',
    billingUnit: master.billingUnit || 'ITEM',
    standardRate: master.standardRate || 0,
    applicableTo: [...(master.applicableTo || [])],
    remarks: master.remarks || ''
  }
  showAddModal.value = true
}

const toggleApplicable = (optVal) => {
  const index = form.value.applicableTo.indexOf(optVal)
  if (index === -1) {
    form.value.applicableTo.push(optVal)
  } else {
    form.value.applicableTo.splice(index, 1)
  }
}

const submitChargeMaster = async () => {
  if (!form.value.code.trim()) {
    snackbarStore.show({ message: 'Code is required.', type: 'warning' })
    return
  }
  if (!form.value.name.trim()) {
    snackbarStore.show({ message: 'Name is required.', type: 'warning' })
    return
  }
  if (form.value.standardRate < 0) {
    snackbarStore.show({ message: 'Standard rate cannot be negative.', type: 'warning' })
    return
  }

  submitting.value = true
  let res;
  if (editMode.value) {
    res = await admissionStore.updateChargeMaster(editMasterId.value, form.value)
  } else {
    res = await admissionStore.createChargeMaster(categoryId, form.value)
  }
  
  if (res.success) {
    snackbarStore.show({ message: res.message || `Charge master ${editMode.value ? 'updated' : 'added'} successfully`, type: 'success' })
    showAddModal.value = false
    await fetchCategoryDetails()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submitting.value = false
}

// =====================
// Package items logic
// =====================

const toggleMasterExpand = async (master) => {
  if (!master.isPackage) return
  
  const index = expandedMasters.value.indexOf(master._id)
  if (index > -1) {
    expandedMasters.value.splice(index, 1)
  } else {
    expandedMasters.value.push(master._id)
    await fetchPackageItemsForMaster(master._id)
  }
}

const fetchPackageItemsForMaster = async (masterId) => {
  loadingPackageMap.value[masterId] = true
  const res = await admissionStore.fetchPackageItems(masterId)
  if (res.success) {
    packageItemsMap.value[masterId] = res.data
  } else {
    snackbarStore.show({ message: res.message || 'Failed to load package items', type: 'error' })
  }
  loadingPackageMap.value[masterId] = false
}

const openPackageModal = (master) => {
  activeMasterForPackage.value = master
  packageForm.value = {
    itemName: '',
    categoryCode: '',
    defaultAmount: 0,
    isMandatory: true
  }
  showPackageModal.value = true
}

const submitPackageItem = async () => {
  if (!packageForm.value.itemName.trim()) {
    snackbarStore.show({ message: 'Component name is required.', type: 'warning' })
    return
  }
  if (packageForm.value.defaultAmount === undefined || packageForm.value.defaultAmount === null || packageForm.value.defaultAmount < 0) {
    snackbarStore.show({ message: 'Default amount cannot be negative.', type: 'warning' })
    return
  }

  submittingPackage.value = true
  const res = await admissionStore.addPackageItem(activeMasterForPackage.value._id, packageForm.value)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Package component added successfully', type: 'success' })
    showPackageModal.value = false
    await fetchPackageItemsForMaster(activeMasterForPackage.value._id)
    await fetchCategoryDetails()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submittingPackage.value = false
}

const deletePackageItem = async (masterId, itemId) => {
  if (!confirm('Are you sure you want to delete this package component?')) return
  
  const res = await admissionStore.deletePackageItem(itemId)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Package component deleted successfully', type: 'success' })
    await fetchPackageItemsForMaster(masterId)
    await fetchCategoryDetails()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const deleteChargeMaster = async (masterId) => {
  if (!confirm('Are you sure you want to delete this service rate? All associated package components will also be deleted.')) return
  
  const res = await admissionStore.deleteChargeMaster(masterId)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Service rate deleted successfully', type: 'success' })
    await fetchCategoryDetails()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

onMounted(async () => {
  await fetchCategoryDetails()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header/Back Navigation -->
    <div class="flex items-center gap-4">
      <button 
        @click="router.push({ name: 'ipd-charges' })"
        class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all bg-slate-50/50 cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Category Service Rates</h1>
        <p class="text-slate-500 mt-1 text-sm">Configure billing rates, service items, and procedure packages for this category.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Retrieving category parameters...
    </div>

    <div v-else-if="category" class="space-y-6">
      <!-- Category Summary Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-extrabold text-slate-800 text-lg leading-tight">{{ category.name }}</h2>
              <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{{ category.code }}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 max-w-2xl">{{ category.description || 'No description provided.' }}</p>
          </div>
        </div>
        <button 
          @click="openAddModal"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Service Rate
        </button>
      </div>

      <!-- Service Rates Table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-50">
          <h3 class="font-bold text-slate-800 text-sm">Defined Service & Charge Rates</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th class="px-4 py-3.5 w-12 text-center"></th>
                <th class="px-4 py-3.5 w-32">Code</th>
                <th class="px-4 py-3.5">Service Name</th>
                <th class="px-4 py-3.5 w-28">Billing Unit</th>
                <th class="px-4 py-3.5 text-right w-32">Standard Rate (₹)</th>
                <th class="px-4 py-3.5 text-center w-44">Attributes</th>
                <th class="px-4 py-3.5 text-center w-24">Status</th>
                <th class="px-4 py-3.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr v-if="masters.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                  No billing items have been configured for this category yet.
                </td>
              </tr>
              <template v-for="master in masters" :key="master._id">
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-4 py-3.5 text-center">
                    <button 
                      v-if="master.isPackage"
                      @click="toggleMasterExpand(master)"
                      class="text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer"
                    >
                      <svg 
                        class="w-4 h-4 transform transition-transform" 
                        :class="expandedMasters.includes(master._id) ? 'rotate-90 text-indigo-600' : ''"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        stroke-width="3"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                  <td class="px-4 py-3.5 font-mono font-bold text-slate-400 uppercase">
                    {{ master.code }}
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-semibold text-slate-800 text-xs">{{ master.name }}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5" v-if="master.description">
                      {{ master.description }}
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-xs text-slate-500">
                    <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/50 font-medium">
                      {{ billingUnits.find(u => u.value === master.billingUnit)?.label || master.billingUnit }}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right font-semibold text-slate-800">
                    ₹{{ master.standardRate?.toLocaleString('en-IN') || 0 }}
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <div class="flex items-center justify-center gap-1.5 flex-wrap">
                      <span 
                        v-if="master.isVariableRate" 
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-amber-50 text-amber-700 border-amber-100 uppercase"
                      >
                        Variable
                      </span>
                      <span 
                        v-if="master.requiresApproval" 
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-rose-50 text-rose-700 border-rose-100 uppercase"
                      >
                        Approval Req
                      </span>
                      <span 
                        v-if="master.isPackage" 
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-100 uppercase"
                      >
                        Package
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold border"
                      :class="master.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'"
                    >
                      {{ master.isActive !== false ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button 
                        @click="openEditModal(master)"
                        class="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                        title="Edit Service Rate"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        @click="deleteChargeMaster(master._id)"
                        class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete Service Rate"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Package Sub-Items Details -->
                <tr v-if="master.isPackage && expandedMasters.includes(master._id)" class="bg-slate-50/20">
                  <td colspan="8" class="px-8 py-4 bg-teal-50/5 border-y border-teal-100/30">
                    <div class="space-y-4">
                      <!-- Component Header -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                          <h4 class="font-bold text-teal-850 text-xs">Package Components & Inclusion Details</h4>
                          <span class="text-[10px] font-medium text-slate-400" v-if="packageItemsMap[master._id]">
                            ({{ packageItemsMap[master._id].length }} items defined)
                          </span>
                        </div>
                        <button 
                          @click="openPackageModal(master)"
                          class="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add Package Component
                        </button>
                      </div>

                      <!-- Loading components -->
                      <div v-if="loadingPackageMap[master._id]" class="text-center py-6 text-slate-400 text-xs">
                        <svg class="animate-spin h-5 w-5 mx-auto text-teal-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading package components...
                      </div>

                      <!-- Components List -->
                      <div v-else-if="!packageItemsMap[master._id] || packageItemsMap[master._id].length === 0" class="border border-dashed border-teal-100 rounded-xl p-6 text-center text-slate-400 bg-white">
                        No sub-items have been defined for this package. The package rate defaults to standard rate.
                      </div>

                      <div v-else class="bg-white border border-teal-100/80 rounded-xl overflow-hidden shadow-xs">
                        <table class="w-full text-left text-xs">
                          <thead class="bg-teal-50/50 text-teal-900 font-bold border-b border-teal-100">
                            <tr>
                              <th class="px-4 py-2 w-1/3">Component Item Name</th>
                              <th class="px-4 py-2 w-1/4">Category Code</th>
                              <th class="px-4 py-2 w-1/6 text-center">Status</th>
                              <th class="px-4 py-2 w-1/6 text-right">Default Amount</th>
                              <th class="px-4 py-2 w-12 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-teal-50/50 text-slate-600">
                            <tr v-for="item in packageItemsMap[master._id]" :key="item._id" class="hover:bg-teal-50/10 transition-colors">
                              <td class="px-4 py-2.5 font-medium">{{ item.itemName }}</td>
                              <td class="px-4 py-2.5">
                                <span v-if="item.categoryCode" class="px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100/60 rounded uppercase">
                                  {{ item.categoryCode }}
                                </span>
                                <span v-else class="text-slate-400 italic font-light text-[10px]">No link</span>
                              </td>
                              <td class="px-4 py-2.5 text-center">
                                <span class="px-1.5 py-0.5 text-[9px] font-bold rounded" :class="item.isMandatory ? 'bg-teal-50 text-teal-755 border border-teal-100/60' : 'bg-slate-50 text-slate-500 border border-slate-200'">
                                  {{ item.isMandatory ? 'Mandatory' : 'Optional' }}
                                </span>
                              </td>
                              <td class="px-4 py-2.5 text-right font-semibold text-slate-800">₹{{ item.defaultAmount?.toLocaleString('en-IN') || 0 }}</td>
                              <td class="px-4 py-2.5 text-center">
                                <button 
                                  @click="deletePackageItem(master._id, item._id)"
                                  class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Remove Component"
                                >
                                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Service Rate Modal -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">{{ editMode ? 'Edit Service Rate' : 'Add New Service Rate' }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">Configure rate cards, item billing units, and base prices.</p>
          </div>
          <button 
            @click="showAddModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4 overflow-y-auto">
          <!-- Row 1: Code and Name -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Code</label>
              <input 
                type="text" 
                v-model="form.code"
                placeholder="E.g. OT_MINOR, CENTRAL_LINE..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all uppercase"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Service/Item Name</label>
              <input 
                type="text" 
                v-model="form.name"
                placeholder="E.g. OT Minor Procedure Package..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea 
              v-model="form.description"
              rows="2"
              placeholder="Provide a description of the billing item or medical procedure..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all resize-none"
            ></textarea>
          </div>

          <!-- Row 2: Billing Unit and Standard Rate -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Billing Unit</label>
              <select 
                v-model="form.billingUnit"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
              >
                <option v-for="unit in billingUnits" :key="unit.value" :value="unit.value">
                  {{ unit.label }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Standard Rate (₹)</label>
              <input 
                type="number" 
                v-model.number="form.standardRate"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-right font-semibold"
              />
            </div>
          </div>




          <!-- Applicable Modules -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Applicable Modalities</label>
            <div class="flex gap-4">
              <label v-for="opt in applicableOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" :checked="form.applicableTo.includes(opt.value)" @change="toggleApplicable(opt.value)" class="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                <span class="text-xs font-semibold text-slate-650">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Remarks -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Internal Remarks</label>
            <textarea v-model="form.remarks" rows="2" placeholder="Any internal office notes or pricing guidelines..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all resize-none"></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" @click="showAddModal = false" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancel</button>
          <button type="button" @click="submitChargeMaster" :disabled="submitting" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ editMode ? 'Update Rate Card' : 'Save Rate Card' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Package Component Modal -->
    <div 
      v-if="showPackageModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-5 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-teal-900 text-sm">Add Package Component</h3>
            <p class="text-[10px] text-teal-600 mt-0.5">Define sub-item, default price and optional link to category code.</p>
          </div>
          <button 
            @click="showPackageModal = false"
            class="text-teal-600 hover:text-teal-800 p-1.5 rounded-lg hover:bg-teal-100 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto">
          <!-- Component Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Component Name</label>
            <input 
              type="text" 
              v-model="packageForm.itemName"
              placeholder="E.g. OT Charge, Surgeon Fee..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Category Code Link (Optional) -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Linked Category Code <span class="text-[10px] text-slate-400 lowercase">(Optional)</span></label>
            <input 
              type="text" 
              v-model="packageForm.categoryCode"
              placeholder="E.g. SURGEON_CHARGE, OT_RENTAL..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700 bg-white font-medium text-xs transition-all uppercase"
            />
            <p class="text-[10px] text-slate-400 leading-normal mt-1">If this component belongs to a standard billing category, enter the code here to enable auto-matching in the bill.</p>
          </div>

          <!-- Default Amount & Mandatory Checkbox -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Default Amount (₹)</label>
              <input 
                type="number" 
                v-model.number="packageForm.defaultAmount"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700 bg-white font-medium text-xs transition-all text-right font-semibold"
              />
            </div>
            <div class="flex items-center pl-2 pt-6">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="packageForm.isMandatory" class="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer" />
                <span class="text-xs font-semibold text-slate-650">Mandatory Item</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" @click="showPackageModal = false" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">Cancel</button>
          <button type="button" @click="submitPackageItem" :disabled="submittingPackage" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <svg v-if="submittingPackage" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Save Component
          </button>
        </div>
      </div>
    </div>


  </div>
</template>
