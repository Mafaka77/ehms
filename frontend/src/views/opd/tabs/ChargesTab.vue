<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useOpdStore } from '../../../stores/opdStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useDoctorStore } from '../../../stores/doctorStore'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const opdStore = useOpdStore()
const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()
const doctorStore = useDoctorStore()

const loading = ref(false)
const initialLoading = ref(true)
const charges = ref([])
const chargeCategories = ref([])
const chargeMasters = ref([])
const showAddModal = ref(false)
const submitting = ref(false)
const editingChargeId = ref(null)

const otPackageItems = ref([])
const selectedAddons = ref([])
const loadingOtPackage = ref(false)
const otCustomAddonName = ref('')
const otCustomAddonAmount = ref(0)
const otCustomAddonDoctorId = ref('')
const hasPredefinedPackageItems = ref(false)

const getLocalDateTimeString = () => {
  const d = new Date()
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
  const istDate = new Date(utc + (3600000 * 5.5))
  return istDate.getFullYear() + '-' +
    String(istDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(istDate.getDate()).padStart(2, '0') + 'T' +
    String(istDate.getHours()).padStart(2, '0') + ':' +
    String(istDate.getMinutes()).padStart(2, '0')
}

const chargeForm = ref({
  chargeCategoryId: '',
  chargeMasterId: '',
  doctorId: '',
  description: '',
  rate: 0,
  quantity: 1,
  chargeDate: getLocalDateTimeString()
})

const fetchCharges = async () => {
  loading.value = true
  const res = await opdStore.fetchPatientCharges(props.appointment._id)
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
  return doctorStore.doctors.filter(d => d.fullName?.toLowerCase().includes(q))
}
const selectAddonDoctor = (item, docId, docName) => {
  item.doctorId = docId
  addonDoctorSearch.value[item._id] = docName ? `${docName}` : ''
  closeAddonDoctorDropdown(item._id)
}
const getAddonDoctorLabel = (item) => {
  if (!item.doctorId) return ''
  const doc = doctorStore.doctors.find(d => d._id === item.doctorId)
  return doc ? `${doc.fullName}` : ''
}

// Custom addon doctor search
const customAddonDoctorSearch = ref('')
const showCustomAddonDoctorDropdown = ref(false)
const filteredCustomAddonDoctors = computed(() => {
  const q = customAddonDoctorSearch.value.toLowerCase()
  return doctorStore.doctors.filter(d => d.fullName?.toLowerCase().includes(q))
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
  return selected ? `${selected.name} (₹${selected.standardRate})` : '-- Custom / Other --'
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

const onCategoryChange = async () => {
  chargeMasters.value = []
  chargeForm.value.chargeMasterId = ''
  chargeForm.value.doctorId = ''
  chargeForm.value.description = ''
  chargeForm.value.rate = 0
  otPackageItems.value = []
  selectedAddons.value = []
  hasPredefinedPackageItems.value = false

  if (!chargeForm.value.chargeCategoryId) return

  const res = await admissionStore.fetchChargeMasters(chargeForm.value.chargeCategoryId)
  if (res.success) {
    chargeMasters.value = res.data
  }
}

const onChargeMasterChange = async () => {
  const selected = chargeMasters.value.find(m => m._id === chargeForm.value.chargeMasterId)
  
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
  const selectedCat = chargeCategories.value.find(c => c._id === chargeForm.value.chargeCategoryId)
  const catName = selectedCat ? selectedCat.name : ''
  const baseName = selectedMaster ? selectedMaster.name : catName

  let baseRate = 0
  if (!hasPredefinedPackageItems.value && selectedMaster) {
    baseRate = selectedMaster.standardRate || 0
  }

  chargeForm.value.rate = baseRate

  const activeAddons = otPackageItems.value.filter(item => selectedAddons.value.includes(item._id))
  const addonNames = activeAddons.map(item => item.itemName).join(', ')
  const descriptionWithAddons = addonNames ? `${baseName} (${addonNames})` : baseName

  chargeForm.value.description = descriptionWithAddons
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
  customAddonDoctorSearch.value = ''
  
  updateRateAndDescriptionFromAddons()
}

const removeCustomAddon = (id) => {
  otPackageItems.value = otPackageItems.value.filter(item => item._id !== id)
  selectedAddons.value = selectedAddons.value.filter(itemId => itemId !== id)
  updateRateAndDescriptionFromAddons()
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

const getChargeTotal = (charge) => {
  const base = charge.amount || 0
  const addonsTotal = (charge.addons || []).reduce((sum, a) => sum + (a.amount || 0), 0)
  return base + addonsTotal
}

const totalCharges = computed(() => {
  return charges.value.reduce((sum, c) => sum + getChargeTotal(c), 0)
})

const openAddModal = () => {
  editingChargeId.value = null
  chargeForm.value = {
    chargeCategoryId: '',
    chargeMasterId: '',
    description: '',
    rate: 0,
    quantity: 1,
    chargeDate: getLocalDateTimeString()
  }
  otPackageItems.value = []
  selectedAddons.value = []
  hasPredefinedPackageItems.value = false
  categorySearch.value = ''
  masterSearch.value = ''
  otCustomAddonName.value = ''
  otCustomAddonAmount.value = 0
  otCustomAddonDoctorId.value = ''
  customAddonDoctorSearch.value = ''
  showAddModal.value = true
}

const editCharge = async (charge) => {
  editingChargeId.value = charge._id
  chargeForm.value = {
    chargeCategoryId: charge.chargeCategoryId?._id || charge.chargeCategoryId || '',
    chargeMasterId: charge.chargeMasterId?._id || charge.chargeMasterId || '',
    description: charge.description,
    rate: charge.rate,
    quantity: charge.quantity,
    chargeDate: (() => {
      const d = new Date(charge.createdAt || new Date())
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
      const istDate = new Date(utc + (3600000 * 5.5))
      return istDate.getFullYear() + '-' +
        String(istDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(istDate.getDate()).padStart(2, '0') + 'T' +
        String(istDate.getHours()).padStart(2, '0') + ':' +
        String(istDate.getMinutes()).padStart(2, '0')
    })()
  }
  
  otPackageItems.value = []
  selectedAddons.value = []
  hasPredefinedPackageItems.value = false
  categorySearch.value = ''
  masterSearch.value = ''
  otCustomAddonName.value = ''
  otCustomAddonAmount.value = 0
  otCustomAddonDoctorId.value = ''
  customAddonDoctorSearch.value = ''

  if (chargeForm.value.chargeMasterId) {
    loadingOtPackage.value = true
    const res = await admissionStore.fetchPackageItems(chargeForm.value.chargeMasterId)
    if (res.success && res.data && res.data.length > 0) {
      otPackageItems.value = res.data.map(item => {
        const matchingAddon = charge.addons?.find(a => !a.isCustom && (a.packageItemId === item._id || a.itemName === item.itemName))
        return {
          ...item,
          doctorId: matchingAddon ? (matchingAddon.doctorId?._id || matchingAddon.doctorId || '') : ''
        }
      })
      hasPredefinedPackageItems.value = true
      selectedAddons.value = charge.addons?.filter(a => !a.isCustom).map(a => {
        const matching = otPackageItems.value.find(opi => opi.itemName === a.itemName)
        return matching ? matching._id : null
      }).filter(Boolean) || []
    }
    loadingOtPackage.value = false
  }

  if (charge.addons && charge.addons.length > 0) {
    for (const addon of charge.addons) {
      if (addon.isCustom) {
        const customId = 'custom_' + Date.now() + Math.random().toString(36).substr(2, 9)
        otPackageItems.value.push({
          _id: customId,
          itemName: addon.itemName,
          defaultAmount: addon.amount,
          isCustom: true,
          doctorId: addon.doctorId?._id || addon.doctorId || ''
        })
        selectedAddons.value.push(customId)
      }
    }
  }

  showAddModal.value = true
}

const submitCharge = async () => {
  if (!chargeForm.value.chargeCategoryId) {
    snackbarStore.show({ message: 'Please select a charge category', type: 'error' })
    return
  }
  if (!chargeForm.value.description) {
    snackbarStore.show({ message: 'Please enter a description', type: 'error' })
    return
  }
  if (chargeForm.value.rate < 0 || chargeForm.value.quantity <= 0) {
    snackbarStore.show({ message: 'Please enter valid rate and quantity', type: 'error' })
    return
  }

  const activeAddons = selectedActiveAddons.value
  const addonsPayload = activeAddons.map(a => ({
    itemName: a.itemName,
    amount: Number(a.defaultAmount || 0),
    packageItemId: a.isCustom ? null : a._id,
    chargeCategoryId: chargeForm.value.chargeCategoryId,
    isCustom: !!a.isCustom,
    doctorId: a.doctorId || null
  }))

  const payload = {
    chargeCategoryId: chargeForm.value.chargeCategoryId,
    chargeMasterId: chargeForm.value.chargeMasterId || null,
    description: chargeForm.value.description,
    rate: Number(chargeForm.value.rate || 0),
    quantity: Number(chargeForm.value.quantity || 1),
    chargeDate: new Date(chargeForm.value.chargeDate + "+05:30").toISOString(),
    addons: addonsPayload
  }

  submitting.value = true
  let res;
  if (editingChargeId.value) {
    res = await opdStore.updatePatientCharge(props.appointment._id, editingChargeId.value, payload)
  } else {
    res = await opdStore.addPatientCharge(props.appointment._id, payload)
  }
  submitting.value = false

  if (res.success) {
    snackbarStore.show({ message: `Patient charge ${editingChargeId.value ? 'updated' : 'added'} successfully`, type: 'success' })
    showAddModal.value = false
    await fetchCharges()
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const deleteCharge = async (chargeId) => {
  if (!confirm('Are you sure you want to delete this charge record?')) return
  const res = await opdStore.deletePatientCharge(props.appointment._id, chargeId)
  if (res.success) {
    snackbarStore.show({ message: 'Charge deleted successfully', type: 'success' })
    await fetchCharges()
    emit('refresh')
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

onMounted(async () => {
  initialLoading.value = true
  await Promise.all([
    fetchCharges(),
    fetchCategories()
  ])
  if (doctorStore.doctors.length === 0) {
    doctorStore.fetchDoctors(1, 500)
  }
  initialLoading.value = false
  window.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
      <div>
        <h3 class="text-base font-bold text-slate-800">OPD Patient Treatment Charges</h3>
        <p class="text-xs text-slate-500 mt-0.5">Add procedures, investigations or additional services for this OPD appointment.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <span class="text-[10px] text-slate-400 font-bold uppercase block">Total Charges</span>
          <span class="text-lg font-extrabold text-indigo-600 font-mono">₹{{ totalCharges.toLocaleString() }}</span>
        </div>
        <button
          @click="openAddModal"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Add Charge
        </button>
      </div>
    </div>

    <!-- Charges Table -->
    <div v-if="initialLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-7 w-7 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>

    <div v-else-if="charges.length === 0" class="p-8 text-center bg-white rounded-xl border border-slate-100 text-slate-500">
      <svg class="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
      <p class="font-semibold text-slate-600 text-sm">No additional treatment charges added yet.</p>
      <p class="text-xs text-slate-400 mt-1 mb-4">Consultation fee is included by default during billing.</p>
      <button
        @click="openAddModal"
        class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Add First Charge
      </button>
    </div>

    <div v-else class="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold">
          <tr>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Description & Addons</th>
            <th class="px-4 py-3 text-right">Rate</th>
            <th class="px-4 py-3 text-center">Qty</th>
            <th class="px-4 py-3 text-right">Amount</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="c in charges" :key="c._id" class="hover:bg-slate-50/50">
            <td class="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{{ formatDate(c.createdAt) }}</td>
            <td class="px-4 py-3 font-semibold text-slate-700">{{ c.chargeCategoryId?.name || '-' }}</td>
            <td class="px-4 py-3">
              <p class="font-bold text-slate-800">{{ c.description }}</p>
              <div v-if="c.doctorId" class="text-[10px] text-indigo-600 font-bold mt-1 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                {{ c.doctorId.fullName || c.doctorId.name }}
              </div>
              <!-- Addon badges -->
              <div v-if="c.addons && c.addons.length > 0" class="mt-1.5 flex flex-wrap gap-1">
                <span 
                  v-for="addon in c.addons" 
                  :key="addon._id" 
                  class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 inline-flex items-center gap-1.5"
                >
                  <span>{{ addon.itemName }}</span>
                  <span v-if="addon.doctorId" class="px-1 py-0.2 text-[8px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                    {{ addon.doctorId.fullName || addon.doctorId.name || addon.doctorId }}
                  </span>
                  <span class="text-slate-500 font-extrabold">(₹{{ addon.amount?.toLocaleString() }})</span>
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-mono">₹{{ c.rate?.toLocaleString() }}</td>
            <td class="px-4 py-3 text-center font-mono font-semibold">{{ c.quantity }}</td>
            <td class="px-4 py-3 text-right font-mono font-bold text-indigo-600">₹{{ getChargeTotal(c).toLocaleString() }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="[
                'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                c.isBilled ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
              ]">
                {{ c.isBilled ? 'Billed' : 'Unbilled' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div v-if="!c.isBilled" class="flex justify-end items-center gap-2">
                <button 
                  @click="editCharge(c)"
                  class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  @click="deleteCharge(c._id)"
                  class="text-rose-500 hover:text-rose-700 font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Delete
                </button>
              </div>
              <span v-else class="text-slate-400 text-[11px]">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Extra Charge Modal (Rich IPD PatientCharge Flow) -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity overflow-y-auto"
    >
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl flex flex-col my-8 animate-in zoom-in-95 duration-200 overflow-visible">
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 class="font-bold text-slate-800 text-base">{{ editingChargeId ? 'Edit Patient Charge' : 'Add Patient Charge' }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ editingChargeId ? 'Update details for this procedure or service.' : 'Post procedures, services or manual fees to this OPD appointment.' }}</p>
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
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between cursor-pointer"
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
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between cursor-pointer"
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
                    class="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-between cursor-pointer"
                    :class="{ 'bg-indigo-50/40 text-indigo-600 font-bold': chargeForm.chargeMasterId === master._id }"
                  >
                    <span class="truncate">{{ master.name }} (₹{{ master.standardRate }})</span>
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
            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                    <input v-if="item.isCustom" type="text" v-model="item.itemName" @click.stop @input="updateRateAndDescriptionFromAddons" class="text-xs font-bold text-slate-700 bg-white border border-slate-200 focus:border-indigo-500 rounded px-1.5 py-0.5 w-44 outline-none" placeholder="Custom Addon Name" />
                    <span v-else class="text-xs font-bold text-slate-700 block leading-tight">{{ item.itemName }}</span>
                    <!-- Doctor Searchable Combobox -->
                    <div v-if="selectedAddons.includes(item._id)" class="mt-1.5 relative" @click.stop>
                      <div class="flex items-center gap-1">
                        <div class="relative flex-1">
                          <input
                            type="text"
                            :placeholder="getAddonDoctorLabel(item) || 'Search doctor...' "
                            :value="addonDoctorSearch[item._id] !== undefined ? addonDoctorSearch[item._id] : getAddonDoctorLabel(item)"
                            @input="e => { addonDoctorSearch[item._id] = e.target.value; addonDoctorOpen[item._id] = true }"
                            @focus="() => { if (addonDoctorSearch[item._id] === undefined) addonDoctorSearch[item._id] = ''; addonDoctorOpen[item._id] = true }"
                            @blur="() => setTimeout(() => closeAddonDoctorDropdown(item._id), 180)"
                            class="w-44 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-text pr-5"
                          />
                          <button
                            v-if="item.doctorId || addonDoctorSearch[item._id]"
                            type="button"
                            @mousedown.prevent
                            @click.stop="selectAddonDoctor(item, '', ''); addonDoctorSearch[item._id] = ''"
                            class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                            title="Clear doctor"
                          >
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div
                        v-if="addonDoctorOpen[item._id]"
                        class="absolute z-[60] left-0 mt-0.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto"
                        @mousedown.prevent
                      >
                        <button
                          type="button"
                          @click="selectAddonDoctor(item, '', '')"
                          class="w-full text-left px-3 py-1.5 text-[10px] text-slate-500 hover:bg-slate-50 cursor-pointer"
                        >-- No Doctor --</button>
                        <button
                          v-for="doc in filteredAddonDoctors(item._id)"
                          :key="doc._id"
                          type="button"
                          @click="selectAddonDoctor(item, doc._id, doc.fullName)"
                          class="w-full text-left px-3 py-1.5 text-[10px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-all"
                          :class="{ 'bg-indigo-50 font-bold text-indigo-700': item.doctorId === doc._id }"
                        > {{ doc.fullName }}</button>
                        <div v-if="filteredAddonDoctors(item._id).length === 0" class="px-3 py-2 text-[10px] text-slate-400 text-center">No doctor found</div>
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
                  <div v-if="item.isCustom" class="flex items-center gap-0.5">
                    <span class="text-xs font-extrabold text-slate-800">₹</span>
                    <input 
                      type="number" 
                      v-model.number="item.defaultAmount" 
                      @click.stop 
                      @input="updateRateAndDescriptionFromAddons"
                      class="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 rounded px-1 py-0.5 w-16 text-right outline-none" 
                    />
                  </div>
                  <span v-else class="text-xs font-extrabold text-slate-800">₹{{ item.defaultAmount.toLocaleString() }}</span>
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
            <div class="mt-3 pt-3 border-t border-slate-200/60 space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Add Custom Addon/Fee</span>
              <div>
                <input 
                  type="text" 
                  v-model="otCustomAddonName" 
                  placeholder="Custom addon name (e.g. Special Equipment Fee)..." 
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white font-medium shadow-xs"
                />
              </div>
              <div class="flex gap-2 items-center">
                <input 
                  type="number" 
                  v-model.number="otCustomAddonAmount" 
                  placeholder="Amount (₹)..." 
                  min="0"
                  class="w-36 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white font-semibold shadow-xs"
                />
                <div class="flex-1 relative" @click.stop>
                  <input
                    type="text"
                    v-model="customAddonDoctorSearch"
                    :placeholder="otCustomAddonDoctorId ? (doctorStore.doctors.find(d => d._id === otCustomAddonDoctorId)?.fullName ? ' ' + doctorStore.doctors.find(d => d._id === otCustomAddonDoctorId).fullName : 'Search doctor...') : 'Search & assign doctor (optional)...'"
                    @focus="showCustomAddonDoctorDropdown = true"
                    @blur="() => setTimeout(() => { showCustomAddonDoctorDropdown = false }, 180)"
                    class="w-full pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-[11px] text-slate-700 bg-white font-medium shadow-xs cursor-text"
                  />
                  <button
                    v-if="otCustomAddonDoctorId || customAddonDoctorSearch"
                    type="button"
                    @mousedown.prevent
                    @click.stop="selectCustomAddonDoctor('', ''); customAddonDoctorSearch = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                    title="Clear doctor"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div
                    v-if="showCustomAddonDoctorDropdown"
                    class="absolute z-[60] left-0 mt-0.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto"
                    @mousedown.prevent
                  >
                    <button
                      type="button"
                      @click="selectCustomAddonDoctor('', '')"
                      class="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >-- No Doctor --</button>
                    <button
                      v-for="doc in filteredCustomAddonDoctors"
                      :key="doc._id"
                      type="button"
                      @click="selectCustomAddonDoctor(doc._id, doc.fullName)"
                      class="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-all"
                      :class="{ 'bg-indigo-50 font-bold text-indigo-700': otCustomAddonDoctorId === doc._id }"
                    >{{ doc.fullName }}</button>
                    <div v-if="filteredCustomAddonDoctors.length === 0" class="px-3 py-2 text-xs text-slate-400 text-center">No doctor found</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  @click="addCustomAddon" 
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 shadow-sm"
                  title="Add custom component"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>


          <!-- Description -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Description</label>
            <input 
              type="text" 
              v-model="chargeForm.description"
              placeholder="E.g. Consultation fee, IV Cannula, Procedure fee..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Charge Date (Backdating) -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Date</label>
            <input 
              type="datetime-local" 
              v-model="chargeForm.chargeDate"
              :max="getLocalDateTimeString()"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            />
          </div>

          <!-- Rate and Quantity row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Rate (₹)</label>
              <input 
                type="number" 
                v-model.number="chargeForm.rate"
                min="0"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all text-right"
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

          <!-- Detailed calculated charge amount breakdown card -->
          <div class="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 space-y-3 text-xs">
            <div class="flex justify-between items-center pb-2 border-b border-indigo-100/60">
              <span class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Charge Amount Breakdown</span>
              <span class="font-black text-indigo-700 text-base">₹{{ totalCalculatedCharge.toLocaleString() }}</span>
            </div>

            <div class="space-y-1.5 text-slate-600">
              <div class="flex justify-between items-center text-[11px]">
                <span>Base Charge Rate (₹{{ (chargeForm.rate || 0).toLocaleString() }} × {{ chargeForm.quantity }} qty):</span>
                <span class="font-bold text-slate-800">₹{{ baseChargeSubtotal.toLocaleString() }}</span>
              </div>

              <template v-if="selectedActiveAddons.length > 0">
                <div class="pt-1.5 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Included Addons / Package Components ({{ selectedActiveAddons.length }})</span>
                  <span>₹{{ addonsSubtotal.toLocaleString() }}</span>
                </div>
                <div 
                  v-for="addon in selectedActiveAddons" 
                  :key="addon._id" 
                  class="flex justify-between items-center pl-2 text-[11px] text-slate-600"
                >
                  <span class="truncate max-w-[220px]">• {{ addon.itemName }}</span>
                  <span class="font-medium text-slate-700">₹{{ (addon.defaultAmount || 0).toLocaleString() }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            @click="showAddModal = false"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button" 
            @click="submitCharge"
            :disabled="submitting"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg v-if="submitting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{{ editingChargeId ? 'Update Patient Charge' : 'Post Patient Charge' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
