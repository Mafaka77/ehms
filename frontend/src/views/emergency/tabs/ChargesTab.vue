<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { DateTime } from 'luxon'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useEmergencyStore } from '../../../stores/emergencyStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useDoctorStore } from '../../../stores/doctorStore'
import { useAuthStore } from '../../../stores/authStore'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const emergencyStore = useEmergencyStore()
const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()
const doctorStore = useDoctorStore()
const authStore = useAuthStore()

const isSuperAdmin = computed(() => {
  const roleName = authStore.user?.roleName || authStore.user?.role?.name || authStore.user?.role;
  return roleName === "SuperAdmin" || roleName === "Super Admin";
})

const isCategoryMasked = (categoryId) => {
  if (!categoryId) return false;
  if (typeof categoryId === "object" && categoryId !== null) return !!categoryId.mask;
  const cat = chargeCategories.value.find(c => c._id === categoryId);
  return cat ? !!cat.mask : false;
}

const formatAmount = (amount, shouldMask = false) => {
  if (isSuperAdmin.value) {
    return "₹" + Number(amount || 0).toLocaleString();
  }
  if (shouldMask) {
    return "₹XXXX";
  }
  return "₹" + Number(amount || 0).toLocaleString();
}

const loading = ref(false)
const initialLoading = ref(true)
const charges = ref([])
const chargeCategories = ref([])
const chargeMasters = ref([])
const showAddModal = ref(false)
const submitting = ref(false)

const otPackageItems = ref([])
const selectedAddons = ref([])
const loadingOtPackage = ref(false)
const otCustomAddonName = ref('')
const otCustomAddonAmount = ref(0)
const otCustomAddonDoctorId = ref('')
const hasPredefinedPackageItems = ref(false)

const getLocalDatetimeString = () => {
  return DateTime.now().setZone('Asia/Kolkata').toFormat("yyyy-MM-dd'T'HH:mm")
}

const chargeForm = ref({
  chargeCategoryId: '',
  chargeMasterId: '',
  doctorId: '',
  description: '',
  rate: 0,
  quantity: 1,
  chargeDate: getLocalDatetimeString()
})

const fetchCharges = async () => {
  loading.value = true
  const res = await emergencyStore.fetchPatientCharges(props.visit._id)
  if (res.success) {
    charges.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

const fetchCategories = async () => {
  const res = await admissionStore.fetchChargeCategories()
  if (res.success) {
    chargeCategories.value = res.data
  }
}

// State for custom searchable dropdowns
const showCategoryDropdown = ref(false)
const categorySearch = ref('')
const categorySearchInput = ref(null)

const showMasterDropdown = ref(false)
const masterSearch = ref('')
const masterSearchInput = ref(null)

const showDoctorDropdown = ref(false)
const doctorSearch = ref('')
const doctorSearchInput = ref(null)

// Per-addon row doctor search state — keyed by item._id
const addonDoctorSearch = ref({})
const addonDoctorOpen = ref({})

const openAddonDoctorDropdown = (itemId) => {
  addonDoctorOpen.value = { ...addonDoctorOpen.value, [itemId]: true }
  if (!addonDoctorSearch.value[itemId]) addonDoctorSearch.value[itemId] = ''
}
const closeAddonDoctorDropdown = (itemId) => {
  addonDoctorOpen.value = { ...addonDoctorOpen.value, [itemId]: false }
}
const filteredAddonDoctors = (itemId) => {
  const q = (addonDoctorSearch.value[itemId] || '').toLowerCase()
  return doctorStore.doctors.filter(d => 
    d.fullName?.toLowerCase().includes(q) || 
    d.specializationId?.name?.toLowerCase().includes(q)
  )
}
const selectAddonDoctor = (item, docId, docName) => {
  item.doctorId = docId
  addonDoctorSearch.value[item._id] = docName ? `${docName}` : ''
  closeAddonDoctorDropdown(item._id)
}
const getAddonDoctorLabel = (item) => {
  if (!item.doctorId) return ''
  const doc = doctorStore.doctors.find(d => d._id === item.doctorId)
  return doc ? `${doc.fullName} (${doc.specializationId?.name || 'General'})` : ''
}

// Custom addon doctor search
const customAddonDoctorSearch = ref('')
const showCustomAddonDoctorDropdown = ref(false)
const filteredCustomAddonDoctors = computed(() => {
  const q = customAddonDoctorSearch.value.toLowerCase()
  return doctorStore.doctors.filter(d => 
    d.fullName?.toLowerCase().includes(q) || 
    d.specializationId?.name?.toLowerCase().includes(q)
  )
})
const selectCustomAddonDoctor = (docId, docName) => {
  otCustomAddonDoctorId.value = docId
  customAddonDoctorSearch.value = docName ? `${docName}` : ''
  showCustomAddonDoctorDropdown.value = false
}

const closeAllDropdowns = () => {
  showCategoryDropdown.value = false
  showMasterDropdown.value = false
  showDoctorDropdown.value = false
  showCustomAddonDoctorDropdown.value = false
  addonDoctorOpen.value = {}
}

const handleOutsideClick = () => {
  closeAllDropdowns()
}

const toggleCategoryDropdown = () => {
  const current = showCategoryDropdown.value
  closeAllDropdowns()
  showCategoryDropdown.value = !current
  if (showCategoryDropdown.value) {
    categorySearch.value = ''
    setTimeout(() => {
      categorySearchInput.value?.focus()
    }, 50)
  }
}

const toggleMasterDropdown = () => {
  const current = showMasterDropdown.value
  closeAllDropdowns()
  showMasterDropdown.value = !current
  if (showMasterDropdown.value) {
    masterSearch.value = ''
    setTimeout(() => {
      masterSearchInput.value?.focus()
    }, 50)
  }
}

const toggleDoctorDropdown = () => {
  const current = showDoctorDropdown.value
  closeAllDropdowns()
  showDoctorDropdown.value = !current
  if (showDoctorDropdown.value) {
    doctorSearch.value = ''
    setTimeout(() => {
      doctorSearchInput.value?.focus()
    }, 50)
  }
}

const filteredCategories = computed(() => {
  if (!categorySearch.value) return chargeCategories.value
  const q = categorySearch.value.toLowerCase()
  return chargeCategories.value.filter(c => c.name.toLowerCase().includes(q))
})

const selectedCategoryName = computed(() => {
  const selected = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  return selected ? selected.name : 'Select Category'
})

const selectCategory = async (cat) => {
  chargeForm.value.chargeCategoryId = cat._id
  showCategoryDropdown.value = false
  categorySearch.value = ''
  await onCategoryChange()
}

const filteredMasters = computed(() => {
  if (!masterSearch.value) return chargeMasters.value
  const q = masterSearch.value.toLowerCase()
  return chargeMasters.value.filter(m => m.name.toLowerCase().includes(q))
})

const selectedMasterName = computed(() => {
  const selected = chargeMasters.value.find(m => m._id === chargeForm.value.chargeMasterId)
  return selected ? `${selected.name} (${formatAmount(selected.standardRate, isCategoryMasked(chargeForm.value.chargeCategoryId))})` : '-- Custom / Other --'
})

const selectMaster = (master) => {
  chargeForm.value.chargeMasterId = master ? master._id : ''
  showMasterDropdown.value = false
  masterSearch.value = ''
  onChargeMasterChange()
}

const filteredDoctors = computed(() => {
  const docs = doctorStore.doctors || []
  if (!doctorSearch.value) return docs
  const q = doctorSearch.value.toLowerCase()
  return docs.filter(d => 
    d.fullName.toLowerCase().includes(q) || 
    (d.specializationId?.name && d.specializationId.name.toLowerCase().includes(q))
  )
})

const selectedDoctorName = computed(() => {
  const selected = doctorStore.doctors.find(d => d._id === chargeForm.value.doctorId)
  return selected ? `${selected.fullName} (${selected.specializationId?.name || 'General'})` : '-- Select Doctor --'
})

const selectDoctor = (doc) => {
  chargeForm.value.doctorId = doc ? doc._id : ''
  showDoctorDropdown.value = false
  doctorSearch.value = ''
  onDoctorChange()
}

const isDoctorCategory = computed(() => {
  const selectedCat = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  if (!selectedCat) return false
  const code = (selectedCat.code || '').toUpperCase()
  const name = (selectedCat.name || '').toLowerCase()
  return (
    code === 'DOCTOR' ||
    code === 'DOCTOR_CHARGES' ||
    code === 'DOCTOR_VISIT' ||
    name.includes('doctor') ||
    code === 'PROCEDURE' ||
    code === 'PROCEDURE_CHARGES' ||
    name.includes('procedure')
  )
})

const isOtCategory = computed(() => {
  const selectedCat = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  return selectedCat?.code === 'OT'
})

const onCategoryChange = async () => {
  chargeMasters.value = []
  chargeForm.value.chargeMasterId = ''
  chargeForm.value.doctorId = ''
  chargeForm.value.description = ''
  chargeForm.value.rate = 0
  otPackageItems.value = []
  selectedAddons.value = []
  hasPredefinedPackageItems.value = false
  if (chargeForm.value.chargeCategoryId) {
    const res = await admissionStore.fetchChargeMasters(chargeForm.value.chargeCategoryId)
    if (res.success) {
      chargeMasters.value = res.data
    }
  }
}

const onChargeMasterChange = async () => {
  const selected = chargeMasters.value.find(m => m._id === chargeForm.value.chargeMasterId)
  const doc = doctorStore.doctors.find(d => d._id === chargeForm.value.doctorId)
  const selectedCat = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  const catName = selectedCat ? selectedCat.name : ''
  const baseName = selected ? selected.name : catName
  
  otPackageItems.value = []
  selectedAddons.value = []
  hasPredefinedPackageItems.value = false
  
  if (selected) {
    chargeForm.value.rate = selected.standardRate
    loadingOtPackage.value = true
    const res = await admissionStore.fetchPackageItems(selected._id)
    if (res.success && res.data && res.data.length > 0) {
      otPackageItems.value = res.data.map(item => ({ ...item, doctorId: '' }))
      selectedAddons.value = res.data.filter(item => item.isMandatory).map(item => item._id)
      hasPredefinedPackageItems.value = true
    }
    loadingOtPackage.value = false
  } else {
    chargeForm.value.rate = 0
  }
  
  updateRateAndDescriptionFromAddons()
}

const updateRateAndDescriptionFromAddons = () => {
  const selectedMaster = chargeMasters.value.find(m => m._id === chargeForm.value.chargeMasterId)
  const doc = doctorStore.doctors.find(d => d._id === chargeForm.value.doctorId)
  const selectedCat = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  const catName = selectedCat ? selectedCat.name : ''
  const baseName = selectedMaster ? selectedMaster.name : catName

  let baseRate = 0
  if (!hasPredefinedPackageItems.value && selectedMaster) {
    baseRate = selectedMaster.standardRate || 0
  }

  // Only set the base rate — addon amounts are stored separately in PatientChargeAddon
  chargeForm.value.rate = baseRate

  const activeAddons = otPackageItems.value.filter(item => selectedAddons.value.includes(item._id))

  const addonNames = activeAddons.map(item => item.itemName).join(', ')
  const descriptionWithAddons = addonNames ? `${baseName} (${addonNames})` : baseName

  if (doc) {
    chargeForm.value.description = `${descriptionWithAddons} - ${doc.fullName}`.trim()
  } else {
    chargeForm.value.description = descriptionWithAddons
  }
}

const onDoctorChange = () => {
  updateRateAndDescriptionFromAddons()
}

const addCustomAddon = () => {
  if (!otCustomAddonName.value.trim()) {
    snackbarStore.show({ message: 'Addon name is required.', type: 'warning' })
    return
  }
  if (otCustomAddonAmount.value < 0) {
    snackbarStore.show({ message: 'Addon amount cannot be negative.', type: 'warning' })
    return
  }

  const newAddon = {
    _id: 'custom_' + Date.now(),
    itemName: otCustomAddonName.value.trim(),
    defaultAmount: Number(otCustomAddonAmount.value || 0),
    isMandatory: false,
    isCustom: true,
    doctorId: otCustomAddonDoctorId.value || ''
  }

  otPackageItems.value.push(newAddon)
  selectedAddons.value.push(newAddon._id)
  
  otCustomAddonName.value = ''
  otCustomAddonAmount.value = 0
  otCustomAddonDoctorId.value = ''
  
  updateRateAndDescriptionFromAddons()
}

const removeCustomAddon = (id) => {
  otPackageItems.value = otPackageItems.value.filter(item => item._id !== id)
  selectedAddons.value = selectedAddons.value.filter(itemId => itemId !== id)
  updateRateAndDescriptionFromAddons()
}

// Helper: total amount for a charge = base amount + all addon amounts
const getChargeTotal = (charge) => {
  const base = charge.amount || 0
  const addonsTotal = (charge.addons || []).reduce((sum, a) => sum + (a.amount || 0), 0)
  return base + addonsTotal
}

const selectedActiveAddons = computed(() => {
  return otPackageItems.value.filter(item => selectedAddons.value.includes(item._id))
})

const baseChargeSubtotal = computed(() => {
  return (chargeForm.value.rate || 0) * (chargeForm.value.quantity || 1)
})

const addonsSubtotal = computed(() => {
  return selectedActiveAddons.value.reduce((sum, item) => sum + (item.defaultAmount || 0), 0)
})

const totalCalculatedCharge = computed(() => {
  return baseChargeSubtotal.value + addonsSubtotal.value
})

const isAnyUnbilledChargeMasked = computed(() => {
  return charges.value.some(c => !c.isBilled && isCategoryMasked(c.chargeCategoryId))
})

const totalUnbilledAmount = computed(() => {
  return charges.value
    .filter(c => !c.isBilled)
    .reduce((sum, c) => sum + getChargeTotal(c), 0)
})

const expandedGroups = ref({})

const toggleGroup = (dateKey) => {
  expandedGroups.value[dateKey] = expandedGroups.value[dateKey] === false
}

const isGroupExpanded = (dateKey) => {
  return expandedGroups.value[dateKey] !== false
}

const groupedCharges = computed(() => {
  const groups = {}
  charges.value.forEach(charge => {
    const rawDate = charge.createdAt
    const d = new Date(rawDate)
    const dateKey = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    })
    const midnightDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        timestamp: midnightDate,
        charges: [],
        totalAmount: 0
      }
    }
    groups[dateKey].charges.push(charge)
    groups[dateKey].totalAmount += getChargeTotal(charge)
  })

  return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp)
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  })
}

const getCategoryBadgeClass = (code) => {
  switch (code) {
    case 'ROOM':
    case 'ROOM_RENT': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'LAB': return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'RADIOLOGY': return 'bg-pink-50 text-pink-700 border-pink-100'
    case 'PHARMACY': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'DOCTOR':
    case 'DOCTOR_VISIT': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'OT': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const openAddModal = async () => {
  chargeForm.value = {
    chargeCategoryId: chargeCategories.value.length > 0 ? chargeCategories.value[0]._id : '',
    chargeMasterId: '',
    doctorId: '',
    description: '',
    rate: 0,
    quantity: 1,
    chargeDate: getLocalDatetimeString()
  }
  closeAllDropdowns()
  showAddModal.value = true
  await onCategoryChange()
  
  // Reset OT package state
  otPackageItems.value = []
  selectedAddons.value = []
  loadingOtPackage.value = false
  otCustomAddonName.value = ''
  otCustomAddonAmount.value = 0
  otCustomAddonDoctorId.value = ''
  hasPredefinedPackageItems.value = false
}

const submitCharge = async () => {
  if (!chargeForm.value.chargeCategoryId) {
    snackbarStore.show({ message: 'Category is required.', type: 'warning' })
    return
  }
  if (!chargeForm.value.description.trim()) {
    snackbarStore.show({ message: 'Description is required.', type: 'warning' })
    return
  }
  if (chargeForm.value.rate < 0) {
    snackbarStore.show({ message: 'Rate cannot be negative.', type: 'warning' })
    return
  }
  if (chargeForm.value.quantity <= 0) {
    snackbarStore.show({ message: 'Quantity must be at least 1.', type: 'warning' })
    return
  }
  if (chargeForm.value.chargeDate > getLocalDatetimeString()) {
    snackbarStore.show({ message: 'Future dates (postdating) are not allowed.', type: 'warning' })
    return
  }

  submitting.value = true
  
  const chargeDateUTC = chargeForm.value.chargeDate
    ? DateTime.fromISO(chargeForm.value.chargeDate, { zone: 'Asia/Kolkata' }).toUTC().toISO()
    : DateTime.now().toUTC().toISO()

  const payload = {
    chargeCategoryId: chargeForm.value.chargeCategoryId,
    chargeMasterId: chargeForm.value.chargeMasterId || null,
    description: chargeForm.value.description,
    rate: chargeForm.value.rate,
    quantity: chargeForm.value.quantity,
    chargeDate: chargeDateUTC,
    doctorId: chargeForm.value.doctorId || null,
    addons: otPackageItems.value
      .filter(item => selectedAddons.value.includes(item._id))
      .map(item => ({
        itemName: item.itemName,
        amount: item.defaultAmount || 0,
        packageItemId: item.isCustom ? null : item._id,
        isCustom: !!item.isCustom,
        doctorId: item.doctorId || null,
        chargeCategoryId: chargeForm.value.chargeCategoryId,
        chargeMasterId: chargeForm.value.chargeMasterId || null
      }))
  }

  const res = await emergencyStore.addPatientCharge(props.visit._id, payload)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge added successfully', type: 'success' })
    showAddModal.value = false
    await fetchCharges()
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  submitting.value = false
}

const deleteCharge = async (charge) => {
  if (charge.isBilled) return
  if (!confirm(`Are you sure you want to delete the charge "${charge.description}"?`)) {
    return
  }

  const res = await emergencyStore.deletePatientCharge(props.visit._id, charge._id)
  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge deleted successfully', type: 'success' })
    await fetchCharges()
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const editingChargeId = ref(null)
const editingForm = ref({
  rate: 0,
  quantity: 1
})

const startEdit = (charge) => {
  editingChargeId.value = charge._id
  editingForm.value = {
    rate: charge.rate || 0,
    quantity: charge.quantity || 1
  }
}

const cancelEdit = () => {
  editingChargeId.value = null
}

const saveCharge = async (charge) => {
  if (editingForm.value.rate < 0) {
    snackbarStore.show({ message: 'Rate cannot be negative.', type: 'warning' })
    return
  }
  if (editingForm.value.quantity <= 0) {
    snackbarStore.show({ message: 'Quantity must be at least 1.', type: 'warning' })
    return
  }

  loading.value = true
  const res = await emergencyStore.updatePatientCharge(props.visit._id, charge._id, {
    rate: editingForm.value.rate,
    quantity: editingForm.value.quantity
  })

  if (res.success) {
    snackbarStore.show({ message: res.message || 'Charge updated successfully', type: 'success' })
    editingChargeId.value = null
    await fetchCharges()
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  loading.value = false
}

onMounted(async () => {
  initialLoading.value = true
  await Promise.all([
    fetchCategories(),
    fetchCharges(),
    doctorStore.fetchDoctors(1, 100)
  ])
  initialLoading.value = false
  window.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Initial Loading State -->
    <div v-if="initialLoading" class="py-16 text-center text-slate-400">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-sm font-medium">Loading charges data...</p>
    </div>

    <template v-else>
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="font-bold text-slate-800 text-base">Active Patient Charges</h3>
        <p class="text-xs text-slate-400">Total accumulated ward charges, fees and rental components during admission.</p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-right shrink-0">
          <span class="text-[10px] uppercase font-bold tracking-wider block leading-none text-slate-400">Total Unbilled Balance</span>
          <span class="text-lg font-bold">{{ formatAmount(totalUnbilledAmount, isAnyUnbilledChargeMasked) }}</span>
        </div>
        <button 
          @click="openAddModal"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Extra Charge
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center text-slate-400">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Fetching patient charges...
    </div>

    <!-- Empty State -->
    <div v-else-if="charges.length === 0" class="border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3 bg-slate-50/50">
      <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-700">No charges recorded</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No emergency charges have been billed or generated for this patient yet.</p>
      </div>
      <button 
        @click="openAddModal" 
        class="px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add First Charge
      </button>
    </div>

    <!-- Grouped Expandable Charges by Date -->
    <div v-else class="space-y-4">
      <div v-for="group in groupedCharges" :key="group.date" class="space-y-2">
        <!-- Date Group Header -->
        <div 
          @click="toggleGroup(group.date)"
          class="flex justify-between items-center bg-slate-50/75 border border-slate-200/60 hover:bg-slate-100/50 p-3.5 rounded-xl cursor-pointer select-none transition-all duration-200 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <svg 
              :class="['w-4 h-4 text-slate-500 transition-transform duration-200', isGroupExpanded(group.date) ? 'rotate-180' : '']" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="font-bold text-slate-800 text-sm">{{ group.date }}</span>
            <span class="text-xs text-slate-400 font-semibold bg-slate-200/50 px-2 py-0.5 rounded-md">
              {{ group.charges.length }} {{ group.charges.length === 1 ? 'charge' : 'charges' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Day Total:</span>
            <span class="font-extrabold text-slate-800 text-sm">{{ formatAmount(group.totalAmount, group.charges.some(c => isCategoryMasked(c.chargeCategoryId))) }}</span>
          </div>
        </div>

        <!-- Date Group Table (renders when expanded) -->
        <div 
          v-if="isGroupExpanded(group.date)" 
          class="overflow-x-auto border border-slate-100 rounded-xl shadow-sm bg-white"
        >
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th class="px-5 py-2.5 w-24">Time</th>
                <th class="px-5 py-2.5 w-32">Category</th>
                <th class="px-5 py-2.5">Item Description</th>
                <th class="px-5 py-2.5 text-right w-28">Unit Rate</th>
                <th class="px-5 py-2.5 text-center w-24">Qty</th>
                <th class="px-5 py-2.5 text-right w-28">Total Amount</th>
                <th class="px-5 py-2.5 text-center w-24">Status</th>
                <th class="px-5 py-2.5 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-650">
              <tr v-for="charge in group.charges" :key="charge._id" class="hover:bg-slate-50/20 transition-all">
                <td class="px-5 py-3 text-[10px] font-mono text-slate-400">{{ formatTime(charge.createdAt) }}</td>
                <td class="px-5 py-3">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold border capitalize" :class="getCategoryBadgeClass(charge.chargeCategoryId?.code || charge.chargeType)">
                    {{ (charge.chargeCategoryId?.name || charge.chargeType || 'Other')?.toLowerCase()?.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-5 py-3 font-semibold text-slate-800">
                  <div>{{ charge.description }}</div>
                  
                  <!-- Addons list if present -->
                  <div v-if="charge.addons && charge.addons.length > 0" class="mt-1.5 flex flex-wrap gap-1">
                    <span 
                      v-for="addon in charge.addons" 
                      :key="addon._id" 
                      class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 inline-flex items-center gap-1.5"
                    >
                      <span>{{ addon.itemName }}</span>
                      <span v-if="addon.doctorId" class="px-1 py-0.2 text-[8px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-650 rounded">
                        {{ addon.doctorId.fullName || addon.doctorId }}
                      </span>
                      <span class="text-slate-500 font-extrabold">({{ formatAmount(addon.amount, isCategoryMasked(charge.chargeCategoryId)) }})</span>
                    </span>
                  </div>

                  <div class="text-[10px] text-indigo-500 font-bold mt-1.5 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded" v-if="charge.doctorId">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ charge.doctorId.fullName }}
                  </div>
                </td>
                <td class="px-5 py-3 text-right">
                  <div v-if="editingChargeId === charge._id" class="flex justify-end">
                    <input 
                      v-if="isSuperAdmin"
                      type="number" 
                      v-model.number="editingForm.rate" 
                      min="0"
                      class="w-20 px-2 py-1 border border-slate-200 rounded text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    />
                    <input
                      v-else
                      type="text"
                      value="XXXX"
                      readonly
                      disabled
                      class="w-20 px-2 py-1 border border-slate-200 rounded text-right text-slate-400 bg-slate-50 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                  <template v-else>{{ formatAmount(charge.rate, isCategoryMasked(charge.chargeCategoryId)) }}</template>
                </td>
                <td class="px-5 py-3 text-center">
                  <div v-if="editingChargeId === charge._id" class="flex justify-center">
                    <input 
                      type="number" 
                      v-model.number="editingForm.quantity" 
                      min="1"
                      class="w-14 px-2 py-1 border border-slate-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    />
                  </div>
                  <span v-else class="font-bold text-slate-600">{{ charge.quantity }}</span>
                </td>
                <td class="px-5 py-3 text-right font-bold text-slate-900">
                  <span v-if="editingChargeId === charge._id">{{ formatAmount(editingForm.rate * editingForm.quantity, isCategoryMasked(charge.chargeCategoryId)) }}</span>
                  <span v-else>{{ formatAmount(getChargeTotal(charge), isCategoryMasked(charge.chargeCategoryId)) }}</span>
                </td>
                <td class="px-5 py-3 text-center">
                  <span 
                    class="px-2 py-0.5 rounded text-[9px] font-bold border"
                    :class="charge.isBilled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
                  >
                    {{ charge.isBilled ? 'Billed' : 'Unbilled' }}
                  </span>
                </td>
                <td class="px-5 py-3 text-right">
                  <div v-if="editingChargeId === charge._id" class="flex items-center justify-end gap-1">
                    <button 
                      @click.stop="saveCharge(charge)"
                      class="p-1 rounded border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer transition-all"
                      title="Save changes"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      @click.stop="cancelEdit"
                      class="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                      title="Cancel"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-else-if="!charge.isBilled" class="flex items-center justify-end gap-1.5">
                    <button 
                      v-if="isSuperAdmin"
                      @click.stop="startEdit(charge)"
                      class="p-1 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer transition-all"
                      title="Edit charge"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      @click.stop="deleteCharge(charge)"
                      class="p-1 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50 cursor-pointer transition-all"
                      title="Delete charge line"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-[10px] text-slate-400 mr-2 font-medium">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Extra Charge Modal -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity overflow-y-auto"
    >
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl flex flex-col my-8 animate-in zoom-in-95 duration-200 overflow-visible">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Add Extra Charge</h3>
            <p class="text-xs text-slate-400 mt-0.5">Post manual charges or fees to the patient file.</p>
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
        <div class="p-6 space-y-4">
          <!-- Category Selection -->
          <div class="space-y-1 relative">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Category</label>
            <div class="relative">
              <button 
                type="button"
                @click.stop="toggleCategoryDropdown"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-left cursor-pointer"
              >
                <span class="truncate">{{ selectedCategoryName }}</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0" :class="{ 'rotate-180': showCategoryDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                v-if="showCategoryDropdown"
                @click.stop
                class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-52 overflow-hidden animate-in fade-in duration-100"
              >
                <div class="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input 
                    type="text"
                    v-model="categorySearch"
                    placeholder="Search category..."
                    ref="categorySearchInput"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs text-slate-700"
                  />
                </div>
                <div class="overflow-y-auto flex-1 py-1">
                  <button
                    v-for="cat in filteredCategories"
                    :key="cat._id"
                    type="button"
                    @click="selectCategory(cat)"
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': chargeForm.chargeCategoryId === cat._id }"
                  >
                    <span class="truncate">{{ cat.name }}</span>
                    <svg v-if="chargeForm.chargeCategoryId === cat._id" class="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div v-if="filteredCategories.length === 0" class="px-3.5 py-3 text-center text-xs text-slate-400">
                    No categories found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Service / Item Selection -->
          <div class="space-y-1 relative">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Billing Item / Service</label>
            <div class="relative">
              <button 
                type="button"
                @click.stop="toggleMasterDropdown"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-left cursor-pointer"
              >
                <span class="truncate">{{ selectedMasterName }}</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0" :class="{ 'rotate-180': showMasterDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                v-if="showMasterDropdown"
                @click.stop
                class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-52 overflow-hidden animate-in fade-in duration-100"
              >
                <div class="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input 
                    type="text"
                    v-model="masterSearch"
                    placeholder="Search item / service..."
                    ref="masterSearchInput"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs text-slate-700"
                  />
                </div>
                <div class="overflow-y-auto flex-1 py-1">
                  <button
                    type="button"
                    @click="selectMaster(null)"
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': !chargeForm.chargeMasterId }"
                  >
                    <span>-- Custom / Other --</span>
                    <svg v-if="!chargeForm.chargeMasterId" class="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    v-for="master in filteredMasters"
                    :key="master._id"
                    type="button"
                    @click="selectMaster(master)"
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': chargeForm.chargeMasterId === master._id }"
                  >
                    <span class="truncate">{{ master.name }} ({{ formatAmount(master.standardRate, isCategoryMasked(chargeForm.chargeCategoryId)) }})</span>
                    <svg v-if="chargeForm.chargeMasterId === master._id" class="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div v-if="filteredMasters.length === 0" class="px-3.5 py-3 text-center text-xs text-slate-400">
                    No items found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Package Addons / Components (Dynamic) -->
          <div v-if="loadingOtPackage" class="py-2 text-center text-xs text-slate-400">
            <svg class="animate-spin h-4 w-4 mx-auto text-indigo-500 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading package addons...
          </div>
          <div v-else-if="chargeForm.chargeMasterId" class="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 animate-in fade-in duration-200">
            <div class="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Package Components / Addons</span>
              <span class="text-[10px] text-indigo-600 font-bold bg-white border border-indigo-100/50 px-2 py-0.5 rounded-md">
                {{ selectedAddons.length }} selected
              </span>
            </div>
            <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
              <label 
                v-for="item in otPackageItems" 
                :key="item._id" 
                class="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-250/60 hover:border-indigo-400 cursor-pointer select-none transition-all"
              >
                <div class="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    :value="item._id" 
                    v-model="selectedAddons" 
                    @change="updateRateAndDescriptionFromAddons" 
                    class="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <div>
                    <span class="text-xs font-bold text-slate-700 block leading-tight">{{ item.itemName }}</span>
                    <!-- Searchable Doctor Dropdown for Addon -->
                    <div v-if="selectedAddons.includes(item._id)" class="mt-1 relative" @click.stop.prevent>
                      <input 
                        type="text" 
                        :value="addonDoctorSearch[item._id] !== undefined ? addonDoctorSearch[item._id] : getAddonDoctorLabel(item)"
                        @input="e => { addonDoctorSearch[item._id] = e.target.value; addonDoctorOpen[item._id] = true }"
                        @focus="() => { if (addonDoctorSearch[item._id] === undefined) addonDoctorSearch[item._id] = ''; addonDoctorOpen[item._id] = true }"
                        placeholder="-- Assign Doctor --"
                        class="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700 focus:outline-none focus:border-indigo-500 font-medium w-48 cursor-pointer shadow-inner placeholder-slate-400 truncate pr-6"
                      />
                      <svg v-if="item.doctorId || addonDoctorSearch[item._id]" @click.stop="selectAddonDoctor(item, '', ''); addonDoctorSearch[item._id] = ''" class="w-3 h-3 text-slate-400 hover:text-rose-500 absolute right-1.5 top-1.5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      
                      <!-- Dropdown List -->
                      <div v-if="addonDoctorOpen[item._id]" class="absolute z-50 w-56 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto left-0 animate-in fade-in duration-100">
                        <div 
                          @click.stop="selectAddonDoctor(item, '', '')" 
                          class="px-3 py-2 text-[10px] text-slate-600 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                        >
                          -- Clear Selection --
                        </div>
                        <div 
                          v-for="doc in filteredAddonDoctors(item._id)" 
                          :key="doc._id"
                          @click.stop="selectAddonDoctor(item, doc._id, `${doc.fullName} (${doc.specializationId?.name || 'General'})`)"
                          class="px-3 py-2 text-[10px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                          :class="{'bg-indigo-50/50 font-bold': item.doctorId === doc._id}"
                        >
                          {{ doc.fullName }} <span class="text-slate-400 font-normal">({{ doc.specializationId?.name || 'General' }})</span>
                        </div>
                        <div v-if="filteredAddonDoctors(item._id).length === 0" class="px-3 py-3 text-center text-[10px] text-slate-400">
                          No doctors found
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-1 items-center mt-1">
                      <span v-if="item.isCustom" class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 uppercase inline-block">Custom</span>
                      <span v-else-if="item.isMandatory" class="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50 uppercase inline-block">Mandatory</span>
                      <span v-else class="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 uppercase inline-block">Optional</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-extrabold text-slate-800">{{ formatAmount(item.defaultAmount, isCategoryMasked(chargeForm.chargeCategoryId)) }}</span>
                  <button 
                    v-if="item.isCustom"
                    type="button"
                    @click.stop="removeCustomAddon(item._id)"
                    class="p-0.5 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-50 transition-all cursor-pointer"
                    title="Delete custom addon"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </label>
            </div>
            
            <!-- Add Custom Addon Inline -->
            <div class="mt-3 pt-3 border-t border-slate-200/60 space-y-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Add Custom Addon/Fee</span>
              <div class="flex gap-2 items-center">
                <input 
                  type="text" 
                  v-model="otCustomAddonName" 
                  placeholder="Custom addon name..." 
                  class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white font-medium"
                />
                <input 
                  type="number" 
                  v-model.number="otCustomAddonAmount" 
                  placeholder="Rate (₹)..." 
                  min="0"
                  class="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white text-right font-semibold"
                />
              </div>
              <div class="flex gap-2 items-center">
                <!-- Searchable Custom Addon Doctor -->
                <div class="flex-1 relative" @click.stop.prevent>
                  <input 
                    type="text"
                    v-model="customAddonDoctorSearch"
                    @focus="showCustomAddonDoctorDropdown = true"
                    placeholder="-- Assign Doctor (Optional) --"
                    class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white font-medium cursor-pointer shadow-inner placeholder-slate-400 pr-6 truncate"
                  />
                  <svg v-if="otCustomAddonDoctorId || customAddonDoctorSearch" @click.stop="selectCustomAddonDoctor('', '')" class="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 absolute right-2 top-2 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  
                  <div v-if="showCustomAddonDoctorDropdown" class="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto left-0 animate-in fade-in duration-100">
                    <div 
                      @click.stop="selectCustomAddonDoctor('', '')" 
                      class="px-3 py-2 text-[10px] text-slate-600 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                    >
                      -- Clear Selection --
                    </div>
                    <div 
                      v-for="doc in filteredCustomAddonDoctors" 
                      :key="doc._id"
                      @click.stop="selectCustomAddonDoctor(doc._id, `${doc.fullName} (${doc.specializationId?.name || 'General'})`)"
                      class="px-3 py-2 text-[10px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                      :class="{'bg-indigo-50/50 font-bold': otCustomAddonDoctorId === doc._id}"
                    >
                      {{ doc.fullName }} <span class="text-slate-400 font-normal">({{ doc.specializationId?.name || 'General' }})</span>
                    </div>
                    <div v-if="filteredCustomAddonDoctors.length === 0" class="px-3 py-3 text-center text-[10px] text-slate-400">
                      No doctors found
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  @click="addCustomAddon" 
                  class="p-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 w-8 h-8"
                  title="Add custom component"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Consulting Doctor Selection (Enabled only for Doctor Charges categories) -->
          <div v-if="!isOtCategory" class="space-y-1 relative">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide"> Doctor <span class="text-[10px] text-slate-400 lowercase">(Optional)</span></label>
            <div class="relative">
              <button 
                type="button"
                :disabled="!isDoctorCategory"
                @click.stop="toggleDoctorDropdown"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-left cursor-pointer disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                <span class="truncate">{{ isDoctorCategory ? selectedDoctorName : '-- Not Applicable --' }}</span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0" :class="{ 'rotate-180': showDoctorDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                v-if="showDoctorDropdown"
                @click.stop
                class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col max-h-52 overflow-hidden animate-in fade-in duration-100"
              >
                <div class="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input 
                    type="text"
                    v-model="doctorSearch"
                    placeholder="Search doctor..."
                    ref="doctorSearchInput"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs text-slate-700"
                  />
                </div>
                <div class="overflow-y-auto flex-1 py-1">
                  <button
                    type="button"
                    @click="selectDoctor(null)"
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': !chargeForm.doctorId }"
                  >
                    <span>-- Select Doctor --</span>
                    <svg v-if="!chargeForm.doctorId" class="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    v-for="doc in filteredDoctors"
                    :key="doc._id"
                    type="button"
                    @click="selectDoctor(doc)"
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': chargeForm.doctorId === doc._id }"
                  >
                    <span class="truncate">{{ doc.fullName }} ({{ doc.specializationId?.name || 'General' }})</span>
                    <svg v-if="chargeForm.doctorId === doc._id" class="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div v-if="filteredDoctors.length === 0" class="px-3.5 py-3 text-center text-xs text-slate-400">
                    No doctors found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Description</label>
            <input 
              type="text" 
              v-model="chargeForm.description"
              placeholder="E.g. Consultation fee, IV Cannula, Oxygen rental 2 hours..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Charge Date (Backdating) -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Date</label>
            <input 
              type="datetime-local" 
              v-model="chargeForm.chargeDate"
              :max="getLocalDatetimeString()"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Rate and Quantity row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Rate (₹)</label>
              <input 
                v-if="isSuperAdmin"
                type="number" 
                v-model.number="chargeForm.rate"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-right"
              />
              <input 
                v-else
                type="text" 
                value="XXXX"
                readonly
                disabled
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-400 bg-slate-50 font-medium text-xs text-right cursor-not-allowed"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity</label>
              <input 
                type="number" 
                v-model.number="chargeForm.quantity"
                min="1"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-center"
              />
            </div>
          </div>

          <!-- Summary calculated amount block -->
          <!-- Charge Amount Breakdown Card (IPD Style) -->
          <div class="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 space-y-3 text-xs">
            <div class="flex justify-between items-center pb-2 border-b border-indigo-100/60">
              <span class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Charge Amount Breakdown</span>
              <span class="font-black text-indigo-700 text-base">{{ formatAmount(totalCalculatedCharge, isCategoryMasked(chargeForm.chargeCategoryId)) }}</span>
            </div>

            <div class="space-y-1.5 text-slate-600">
              <div class="flex justify-between items-center">
                <span>Base Charge Rate ({{ formatAmount(chargeForm.rate, isCategoryMasked(chargeForm.chargeCategoryId)) }} × {{ chargeForm.quantity }} qty):</span>
                <span class="font-bold text-slate-800">{{ formatAmount(baseChargeSubtotal, isCategoryMasked(chargeForm.chargeCategoryId)) }}</span>
              </div>

              <template v-if="selectedActiveAddons.length > 0">
                <div class="flex justify-between items-center pt-1 border-t border-slate-200/40 text-indigo-900 font-semibold">
                  <span>Included Addons / Package Components ({{ selectedActiveAddons.length }})</span>
                </div>
                <div 
                  v-for="addon in selectedActiveAddons" 
                  :key="addon._id" 
                  class="flex justify-between items-center pl-2 text-[11px] text-slate-600"
                >
                  <span class="truncate max-w-[220px]">• {{ addon.itemName }}</span>
                  <span class="font-medium text-slate-700">{{ formatAmount(addon.defaultAmount || addon.amount, isCategoryMasked(chargeForm.chargeCategoryId)) }}</span>
                </div>
              </template>

              <div class="flex justify-between items-center pt-2 border-t border-indigo-100/80 font-extrabold text-slate-800">
                <span>Total Calculated Amount:</span>
                <span class="font-extrabold text-indigo-700 text-sm">{{ formatAmount(totalCalculatedCharge, isCategoryMasked(chargeForm.chargeCategoryId)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button"
            @click="showAddModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="submitCharge"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="submitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Post Charge
          </button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>
