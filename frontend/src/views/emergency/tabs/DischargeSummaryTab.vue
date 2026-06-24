<script setup>
import { ref, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEmergencyStore } from '../../../stores/emergencyStore'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])
const snackbarStore = useSnackbarStore()
const emergencyStore = useEmergencyStore()

const summaryText = ref('')
const saving = ref(false)

watch(() => props.visit, (newVal) => {
  if (newVal) {
    summaryText.value = newVal.dischargeSummary || ''
  }
}, { immediate: true })

const saveSummary = async () => {
  saving.value = true
  try {
    await emergencyStore.updateDischargeSummary(props.visit._id, summaryText.value)
    snackbarStore.show({ message: 'Discharge summary saved successfully', type: 'success' })
    emit('refresh')
  } catch (error) {
    snackbarStore.show({ message: 'Failed to save discharge summary', type: 'error' })
  } finally {
    saving.value = false
  }
}

const printSummary = () => {
  const printContent = `
    <html>
      <head>
        <title>Discharge Summary - ${props.visit.patientId?.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0 0 10px 0; color: #1e293b; }
          .patient-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-block { flex: 1; }
          .info-label { font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 500; }
          .summary-content { white-space: pre-wrap; font-size: 14px; background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 300px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Emergency Discharge Summary</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="patient-info">
          <div class="info-block">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${props.visit.patientId?.fullName}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Patient Code</div>
            <div class="info-value">${props.visit.patientId?.patientCode}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Visit No</div>
            <div class="info-value">${props.visit.visitNo}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Attending Doctor</div>
            <div class="info-value">Dr. ${props.visit.doctorId?.fullName || 'On Duty'}</div>
          </div>
        </div>
        <h3 style="margin-bottom: 15px; color: #1e293b;">Clinical Summary & Instructions</h3>
        <div class="summary-content">${summaryText.value || 'No summary provided.'}</div>
        
        <div class="footer">
          <div></div>
          <div class="signature-box">
            <div class="signature-line">Doctor's Signature</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-bold text-slate-800">Clinical Discharge Summary</h2>
      <button 
        @click="printSummary"
        class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Print Summary
      </button>
    </div>
    
    <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-4">
      <p class="font-medium flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Record final diagnosis, treatments administered, and home care instructions for the patient here.
      </p>
    </div>

    <div class="relative">
      <textarea
        v-model="summaryText"
        rows="12"
        placeholder="Type the clinical discharge summary here..."
        class="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-y transition-shadow"
      ></textarea>
    </div>

    <div class="flex justify-end pt-2">
      <button
        @click="saveSummary"
        :disabled="saving"
        class="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 rounded-xl font-semibold text-sm shadow-md shadow-emerald-100 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
      >
        <span v-if="saving" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Save Discharge Summary
      </button>
    </div>
  </div>
</template>
