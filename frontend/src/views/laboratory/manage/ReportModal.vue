<script setup>
import { ref, watch } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
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

const emit = defineEmits(['close'])

const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const printingPDF = ref(false)
const orderData = ref(null)
const tests = ref([])

const fetchResults = async () => {
  if (!props.order?._id) return
  loading.value = true
  try {
    const res = await labStore.fetchOrderResults(props.order._id)
    orderData.value = res.order
    tests.value = res.tests
  } catch (error) {
    console.error('Error fetching results:', error)
    snackbarStore.show({ message: 'Failed to load report data', type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchResults()
  }
})

const printReportPDF = async () => {
  if (printingPDF.value) return
  
  // Open window immediately to bypass popup blockers
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    snackbarStore.show({ message: 'Popup blocked. Please allow popups for this site.', type: 'error' })
    return
  }
  printWindow.document.write('<p style="font-family:sans-serif;text-align:center;margin-top:100px;">Generating PDF... Please wait...</p>')

  printingPDF.value = true
  try {
    const element = document.querySelector('.print-report-container')
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution vector output
      useCORS: true,
      logging: false
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    // Create jsPDF instance (portrait, mm, A4 is [210, 297])
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    
    // Generate blob URL
    const blob = pdf.output('blob')
    const blobUrl = URL.createObjectURL(blob)
    
    printWindow.location.href = blobUrl
    
    setTimeout(() => {
      try {
        printWindow.print()
      } catch (e) {
        console.error('Auto-print report error:', e)
      }
    }, 500)
  } catch (error) {
    printWindow.close()
    console.error('Error generating PDF report:', error)
    snackbarStore.show({ message: 'Failed to generate PDF report', type: 'error' })
  } finally {
    printingPDF.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 screen-only animate-in fade-in duration-200">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Wrapper -->
    <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
      
      <!-- Preview Area -->
      <div class="p-6 overflow-y-auto flex justify-center bg-slate-100 flex-grow">
        <!-- A4 Page representation on screen -->
        <div class="print-report-container select-none">
          <div class="report-content">
            <!-- Header Brand -->
            <div class="report-header">
              <h1>EHMS LABORATORY & DIAGNOSTIC CENTRE</h1>
              <p>123 Health Care Avenue, Medical City</p>
              <p>Mob: +91 98765 43210 | Email: diagnostics@ehms.com</p>
              <hr class="report-divider" />
              <h2>LABORATORY INVESTIGATION REPORT</h2>
            </div>

            <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Patient Name:</strong> {{ order.patientId?.fullName }}</p>
                <p><strong>Patient ID / Code:</strong> <span class="font-mono">{{ order.patientId?.patientCode || 'N/A' }}</span></p>
                <p><strong>Age / Gender:</strong> {{ order.patientId?.age }} Yrs / {{ order.patientId?.gender }}</p>
                <p><strong>Contact No:</strong> {{ order.patientId?.mobileNo }}</p>
              </div>
              <div class="text-right">
                <p><strong>Order No:</strong> <span class="font-mono">{{ order.orderNo }}</span></p>
                <p><strong>Date Ordered:</strong> {{ formatDate(order.orderDate) }}</p>
                <p><strong>Report Date:</strong> {{ formatDate(new Date()) }}</p>
                <p><strong>Ref. Clinician:</strong> Dr. {{ order.doctorId?.fullName || 'Self/Referral' }}</p>
              </div>
            </div>

            <!-- Parameters results list -->
            <div class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Test / Parameter Name</th>
                    <th class="text-center">Measured Value</th>
                    <th class="text-center">Unit</th>
                    <th class="text-center">Reference Ranges</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="test in tests" :key="test.testId">
                    <!-- Test Category Header -->
                    <tr class="test-header-row">
                      <td colspan="4" class="font-bold uppercase text-slate-800 text-xs py-2 bg-slate-50/50">
                        {{ test.testName }}
                      </td>
                    </tr>
                    <!-- Parameters -->
                    <tr 
                      v-for="param in test.parameters" 
                      :key="param.parameterId"
                      class="param-row"
                    >
                      <td class="pl-4 font-medium">{{ param.name }}</td>
                      <td class="text-center font-mono" :class="{ 'out-of-range': param.isOutOfRange }">
                        {{ param.measuredValue || '-' }}
                        <span v-if="param.isOutOfRange" class="out-of-range-tag font-bold ml-1">*</span>
                      </td>
                      <td class="text-center font-semibold text-slate-500">{{ param.unit || '-' }}</td>
                      <td class="text-center text-[10px] text-slate-500">
                        <template v-if="param.referenceIntervals && param.referenceIntervals.length > 0">
                          <span v-for="(interval, idx) in param.referenceIntervals" :key="idx">
                            {{ interval.label }}: {{ interval.range }}<span v-if="idx < param.referenceIntervals.length - 1"> | </span>
                          </span>
                        </template>
                        <template v-else>
                          <span v-if="param.normalRangeMale">M: {{ param.normalRangeMale }}<span v-if="param.normalRangeFemale || param.normalRangeChild"> | </span></span>
                          <span v-if="param.normalRangeFemale">F: {{ param.normalRangeFemale }}<span v-if="param.normalRangeChild"> | </span></span>
                          <span v-if="param.normalRangeChild">C: {{ param.normalRangeChild }}</span>
                          <span v-if="!param.normalRangeMale && !param.normalRangeFemale && !param.normalRangeChild">-</span>
                        </template>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Signatures Section -->
            <div class="signatures">
              <div>
                <p>Prepared By:</p>
                <p class="operator-name">Lab Technician</p>
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signatory / Pathologist</span>
              </div>
            </div>

            <!-- Computer Generated Notice -->
            <div class="notice">
              <p>*** End of Report ***</p>
              <p class="wish">This is a computer-verified diagnostic report and does not require a physical signature.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 screen-only">
        <button 
          @click="emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
        <button 
          @click="printReportPDF"
          :disabled="printingPDF"
          class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped custom styling using standard hex colors to bypass Tailwind v4 oklch() color issues in html2canvas-pro */
.print-report-container {
  width: 210mm;
  height: 297mm;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #ffffff;
  border: 1px dashed #cbd5e1;
  color: #0f172a;
  padding: 20mm 15mm;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.report-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-header {
  text-align: center;
  margin-bottom: 24px;
}

.report-header h1 {
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.025em;
  color: #1e3a8a;
  margin: 0 0 6px 0;
}

.report-header p {
  font-size: 11px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.report-divider {
  border: 0;
  border-top: 2px solid #1e3a8a;
  margin: 12px 0;
}

.report-header h2 {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: #0f172a;
  margin: 8px 0 0 0;
}

.demographics {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  column-gap: 24px;
  row-gap: 6px;
  font-size: 12px;
  margin-bottom: 24px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  line-height: 1.5;
}

.demographics p {
  margin: 0;
  color: #334155;
}

.demographics strong {
  color: #0f172a;
}

.results-table-container {
  flex-grow: 1;
  margin-bottom: 30px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.results-table th {
  border-top: 2px solid #475569;
  border-bottom: 2px solid #475569;
  font-weight: bold;
  padding: 8px 6px;
  color: #1e293b;
  text-align: left;
}

.results-table th:nth-child(2),
.results-table th:nth-child(3),
.results-table th:nth-child(4) {
  text-align: center;
}

.test-header-row td {
  padding: 10px 4px 6px 4px;
}

.param-row td {
  border-bottom: 1px solid #f1f5f9;
  padding: 8px 6px;
  color: #334155;
}

.out-of-range {
  color: #dc2626 !important;
  font-weight: bold;
}

.out-of-range-tag {
  color: #dc2626;
}

.signatures {
  margin-top: auto;
  padding-top: 40px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #475569;
}

.signatures .operator-name {
  font-weight: bold;
  color: #0f172a;
  margin: 4px 0 0 0;
}

.signatures .sig-line {
  border-top: 1px solid #94a3b8;
  padding-top: 6px;
  display: inline-block;
  width: 200px;
}

.notice {
  text-align: center;
  margin-top: 30px;
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.4;
}

.notice p {
  margin: 0;
}

.notice .wish {
  font-style: italic;
  margin-top: 4px;
}
</style>
