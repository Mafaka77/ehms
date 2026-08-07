<script setup>
const props = defineProps({
  activeAdmissions: {
    type: Array,
    default: () => []
  },
  doctorName: {
    type: String,
    default: ''
  }
})

const formatDateTime = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  if ((hours === 0 && minutes === 0 && seconds === 0) || (hours === 5 && minutes === 30 && seconds === 0)) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<template>
  <div class="p-4">
    <div v-if="activeAdmissions.length" class="overflow-x-auto">
      <table class="w-full text-xs text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="py-2.5 px-3">Admission No</th>
            <th class="py-2.5 px-3">Patient Name</th>
            <th class="py-2.5 px-3">Gender / Age</th>
            <th class="py-2.5 px-3">Ward</th>
            <th class="py-2.5 px-3">Admission Date &amp; Time</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          <tr v-for="adm in activeAdmissions" :key="adm._id" class="hover:bg-slate-50/60 transition-all">
            <td class="py-3 px-3 font-bold text-slate-900">{{ adm.admissionNo }}</td>
            <td class="py-3 px-3 font-bold text-slate-800">{{ adm.patientId?.fullName || '—' }}</td>
            <td class="py-3 px-3 text-slate-500">{{ adm.patientId?.gender || '—' }} ({{ adm.patientId?.age || 0 }} yrs)</td>
            <td class="py-3 px-3 font-semibold text-slate-800">{{ adm.wardId?.name || '—' }}</td>
            <td class="py-3 px-3 text-slate-500 whitespace-nowrap">{{ formatDateTime(adm.admissionDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="p-12 text-center text-slate-400 text-xs">
      No active IPD admissions under {{ doctorName }}
    </div>
  </div>
</template>
