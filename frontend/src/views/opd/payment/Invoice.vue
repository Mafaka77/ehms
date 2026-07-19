<script setup>
import { ref, watch, computed } from 'vue'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  appointment: {
    type: Object,
    required: true
  },
  billDetails: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const printingPDF = ref(false)

const pdfPreviewUrl = ref(null)
const currentFilename = ref('')
const receiptRef = ref(null)

const generateInvoicePDF = async () => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const element = receiptRef.value
    if (!element) throw new Error('Receipt container not found')
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    const pdf = new jsPDF('l', 'mm', 'a5')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const ratio = pdfWidth / canvas.width
    const imgHeight = canvas.height * ratio
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight)
    
    const patientName = props.appointment.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const filename = `OPD_Invoice_${patientName}.pdf`
    currentFilename.value = filename
    
    const blob = pdf.output('blob')
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = URL.createObjectURL(blob)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    printingPDF.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal && props.billDetails) {
    generateInvoicePDF()
  } else {
    if (pdfPreviewUrl.value) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = null
    }
  }
}, { immediate: true })

const patientAge = computed(() => {
  const patient = props.appointment?.patientId
  if (!patient) return '-'
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth)
    const today = new Date()
    
    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()
    
    if (months < 0 || (months === 0 && days < 0)) {
      years--
    }
    
    const lastBirthday = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate())
    const diffTime = Math.abs(today.getTime() - lastBirthday.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))
    
    return years > 0 ? `${years}Y ${diffDays}D` : `${diffDays}D`
  }
  return patient.age ? `${patient.age}Y` : '-'
})


const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}
</script>

<template>
  <div v-if="show && billDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:items-start print:justify-start">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" @click="emit('close')"></div>

    <!-- Modal Wrapper -->
    <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:bg-white print:shadow-none print:rounded-none">

      <!-- Preview Area -->
      <div class="flex-grow flex flex-col relative bg-slate-600 min-h-[500px]">
        
        <!-- Loading State -->
        <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-800 z-50">
          <div class="flex flex-col items-center">
            <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-400 border-t-transparent mb-3"></span>
            <span class="text-white font-medium shadow-sm">Generating PDF Preview...</span>
          </div>
        </div>

        <!-- Hidden DOM for html2canvas -->
        <div v-show="!pdfPreviewUrl" class="absolute inset-0 overflow-y-auto bg-slate-200 p-8 flex justify-center z-0">
          <div ref="receiptRef" class="opd-print-receipt-container select-none bg-white">
            <div class="receipt-content">

            <!-- Header Brand -->
            <div class="receipt-header">
              <div class="flex items-center justify-between mb-2">
                <img src="../../../assets/logo_final.png" alt="Logo" class="h-16 w-auto object-contain" />
                <div class="text-right">
                   <p>Y-67,Luangmual,Aizawl, Mizoram - 796009</p>
                   <p>Phone: 0389-2913340 / 8974326872</p>
                </div>
              </div>
              <hr class="receipt-divider" />
              <h2>OPD CONSULTATION BILL / INVOICE</h2>
            </div>

            <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Bill No:</strong> <span class="font-mono">{{ billDetails.billNo }}</span></p>
                <p><strong>Date:</strong> {{ formatDate(billDetails.generatedAt || billDetails.createdAt) }}</p>
                <p><strong>Status:</strong> <span class="uppercase font-bold">{{ billDetails.status }}</span></p>
                <p><strong>Appt No:</strong> <span class="font-mono">{{ appointment.appointmentId }}</span></p>
              </div>
              <div class="text-right">
                <p class="patient-name truncate"><strong>Patient:</strong> {{ appointment.patientId?.fullName }}</p>
                <p><strong>Code:</strong> <span class="font-mono">{{ appointment.patientId?.patientCode }}</span></p>
                <p><strong>Age/Gender:</strong> {{ patientAge }} / {{ appointment.patientId?.gender }}</p>
                <p><strong>Contact:</strong> {{ appointment.patientId?.mobileNo }}</p>
              </div>
            </div>

            <div class="doctor-section">
              <p><strong>Consulting Doctor:</strong> Dr. {{ appointment.doctorId?.fullName || 'N/A' }}
                <span v-if="appointment.doctorId?.specializationId?.name"> &mdash; {{ appointment.doctorId.specializationId.name }}</span>
              </p>
              <p><strong>Appointment Date:</strong> {{ formatDate(appointment.appointmentDate) }}</p>
            </div>

            <!-- Itemized Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Rate</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Discount</th>
                  <th class="text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in billDetails.items" :key="item._id">
                  <td class="font-medium truncate max-w-[200px]">{{ item.description }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(item.rate) }}</td>
                  <td class="text-center font-mono">{{ item.quantity }}</td>
                  <td class="text-right font-mono discount-col">-{{ formatCurrency(item.discountAmount) }}</td>
                  <td class="text-right font-mono font-semibold">{{ formatCurrency(item.netAmount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div class="financials-summary">
              <div class="flex justify-between">
                <span>Gross Total:</span>
                <span class="font-mono">{{ formatCurrency(billDetails.grossAmount) }}</span>
              </div>
              <div class="flex justify-between discount-col font-medium" v-if="billDetails.discountAmount > 0">
                <span>Discount:</span>
                <span class="font-mono">-{{ formatCurrency(billDetails.discountAmount) }}</span>
              </div>
              <div class="flex justify-between net-payable">
                <span>Net Payable:</span>
                <span class="font-mono">{{ formatCurrency(billDetails.netAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Paid Amount:</span>
                <span class="font-mono">{{ formatCurrency(billDetails.paidAmount) }}</span>
              </div>
              <div class="flex justify-between balance-due">
                <span>Balance Due:</span>
                <span class="font-mono">{{ formatCurrency(billDetails.balanceAmount) }}</span>
              </div>
            </div>

            <!-- Signatures -->
            <div class="signatures">
              <div>
                <p>Prepared By:</p>
                <p class="operator-name">{{ billDetails.generatedBy?.fullName || 'Cashier' }}</p>
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signature</span>
              </div>
            </div>

            <!-- Notice -->
            <div class="notice">
              <p>This is a computer-generated invoice and does not require a physical signature.</p>
              <p class="wish">*** Thank You for Visiting ***</p>
            </div>
          </div>
        </div>
        </div>

        <!-- PDF Preview Iframe -->
        <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="absolute inset-0 w-full h-full border-0 z-10" title="PDF Preview"></iframe>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 screen-only">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
        <a
          v-if="pdfPreviewUrl"
          :href="pdfPreviewUrl"
          :download="currentFilename"
          class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Using explicit hex colors to avoid oklch() issues in html2canvas */
.opd-print-receipt-container {
  width: 210mm;
  height: 148mm;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #ffffff;
  border: 1px dashed #cbd5e1;
  color: #0f172a;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  font-family: ui-mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.receipt-header {
  text-align: center;
  margin-bottom: 12px;
}

.receipt-header h1 {
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.025em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.receipt-header p {
  font-size: 10px;
  color: #64748b;
  margin: 0;
}

.receipt-divider {
  border: 0;
  border-top: 1px dashed #cbd5e1;
  margin: 8px 0;
}

.receipt-header h2 {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: #1e293b;
  margin: 4px 0 0 0;
}

.demographics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
  row-gap: 2px;
  font-size: 10px;
  margin-bottom: 8px;
  line-height: 1.25;
}

.demographics p {
  margin: 0;
  color: #334155;
}

.demographics .patient-name {
  color: #0f172a;
  font-weight: bold;
}

.doctor-section {
  border-top: 1px dashed #e2e8f0;
  padding-top: 5px;
  font-size: 10px;
  margin-bottom: 10px;
  color: #334155;
}

.doctor-section p {
  margin: 0 0 2px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 12px;
}

.items-table th {
  border-top: 1px dashed #cbd5e1;
  border-bottom: 1px dashed #cbd5e1;
  font-weight: bold;
  padding: 5px 0;
  color: #475569;
}

.items-table td {
  border-bottom: 1px dashed #f1f5f9;
  padding: 5px 0;
  color: #334155;
}

.discount-col {
  color: #16a34a !important;
}

.financials-summary {
  width: 50%;
  margin-left: auto;
  font-size: 10px;
  border-top: 1px dashed #cbd5e1;
  padding-top: 8px;
  line-height: 1.25;
}

.financials-summary > div {
  margin-bottom: 3px;
}

.financials-summary .net-payable {
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
  color: #1e1b4b;
  font-size: 11px;
  font-weight: bold;
}

.financials-summary .balance-due {
  border-top: 1px dotted #e2e8f0;
  padding-top: 4px;
  color: #dc2626;
  font-weight: bold;
}

.signatures {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #64748b;
  line-height: 1.25;
}

.signatures .operator-name {
  font-weight: bold;
  color: #1e293b;
  margin: 2px 0 0 0;
}

.signatures .sig-line {
  border-top: 1px dotted #cbd5e1;
  padding-top: 4px;
  display: inline-block;
}

.notice {
  text-align: center;
  margin-top: 12px;
  font-size: 8px;
  color: #94a3b8;
  font-style: italic;
  line-height: 1.25;
}

.notice p {
  margin: 0;
}

.notice .wish {
  font-weight: bold;
  color: #475569;
  margin-top: 2px;
}

@media print {
  @page {
    size: A5 landscape;
    margin: 0;
  }
  

  body * {
    visibility: hidden;
  }
  .opd-print-receipt-container, .opd-print-receipt-container * {
    visibility: visible;
  }
  .opd-print-receipt-container {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    height: 148mm !important;
    overflow: hidden !important;
    height: auto !important;
    margin: 0 !important;
    padding: 10mm !important;
    box-shadow: none !important;
    border: none !important;
    z-index: 999999 !important;
    background-color: white !important;
  }
  .items-table tr {
    page-break-inside: avoid;
  }
  .signatures {
    page-break-inside: avoid;
  }
  .notice {
    page-break-inside: avoid;
  }
}
</style>
