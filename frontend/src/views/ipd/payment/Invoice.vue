<script setup>
import { ref } from 'vue'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { useSnackbarStore } from '../../../stores/snackbarStore'

const snackbarStore = useSnackbarStore()

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  admission: {
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
const viewMode = ref('edit')
const pdfPreviewUrl = ref(null)
const currentFilename = ref('')

const generateInvoicePDF = async (preview = false) => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
    const wasPreview = viewMode.value === 'preview'
    if (wasPreview) {
      viewMode.value = 'edit'
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Wait for Vue to update the DOM
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const element = document.querySelector('.opd-print-receipt-container')
    if (!element) throw new Error('Receipt container not found')
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    // Create A5 Landscape PDF (210mm x 148.5mm)
    const pdf = new jsPDF('l', 'mm', 'a5')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Grab the sections to calculate pixel heights
    const tbody = element.querySelector('.main-tbody')
    const tfoot = element.querySelector('.main-tfoot')
    
    const contRect = element.getBoundingClientRect()
    const tbodyRect = tbody.getBoundingClientRect()
    const tfootRect = tfoot.getBoundingClientRect()
    
    const headerY = 0
    const headerH = Math.round(tbodyRect.top - contRect.top)
    
    const bodyY = headerH
    const bodyH = Math.round(tfootRect.top - tbodyRect.top)
    
    const footerY = bodyY + bodyH
    const footerH = Math.round(tfootRect.bottom - tfootRect.top)
    
    const cropCanvas = (y, h) => {
      const c = document.createElement('canvas')
      c.width = canvas.width
      const sy = Math.max(0, y * 2)
      const sh = Math.max(0, Math.min(h * 2, canvas.height - sy))
      c.height = sh || 1 // prevent 0 height canvas
      const ctx = c.getContext('2d')
      if (sh > 0) {
        ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh)
      }
      return c.toDataURL('image/jpeg', 0.98)
    }
    
    const headerData = cropCanvas(headerY, headerH)
    const bodyData = cropCanvas(bodyY, bodyH) // Not used entirely anymore, but we can keep cropCanvas
    const footerData = cropCanvas(footerY, footerH)
    
    const ratio = pdfWidth / canvas.width
    const headerPdfH = (headerH * 2) * ratio
    const footerPdfH = (footerH * 2) * ratio
    
    const pdfToDom = 1 / (2 * ratio)
    const maxDomH_Standard = (pageHeight - headerPdfH - 8) * pdfToDom
    const maxDomH_LastPage = (pageHeight - headerPdfH - footerPdfH - 8) * pdfToDom
    
    // Find all breakable items
    const breakableElements = Array.from(element.querySelectorAll('.items-table tbody tr, .financials-summary'))
    const breaks = breakableElements.map(el => {
      const rect = el.getBoundingClientRect()
      return {
        top: rect.top - tbodyRect.top,
        bottom: rect.bottom - tbodyRect.top
      }
    })
    
    let currentDomOffset = 0
    const totalDomHeight = bodyH
    let pages = []
    
    while (currentDomOffset < totalDomHeight) {
      let remainingHeight = totalDomHeight - currentDomOffset
      
      // Check if the rest of the body fits with the footer
      if (remainingHeight <= maxDomH_LastPage) {
        pages.push({
          offset: currentDomOffset,
          height: remainingHeight,
          isLast: true
        })
        break
      }
      
      let nextOffset = currentDomOffset + maxDomH_Standard
      let breakPoint = nextOffset
      
      // Find a clean break
      for (let i = breaks.length - 1; i >= 0; i--) {
        if (breaks[i].bottom <= nextOffset && breaks[i].bottom > currentDomOffset) {
          breakPoint = breaks[i].bottom
          break
        }
      }
      
      if (breakPoint === currentDomOffset) breakPoint = nextOffset
      
      pages.push({
        offset: currentDomOffset,
        height: breakPoint - currentDomOffset,
        isLast: false
      })
      currentDomOffset = breakPoint
    }
    
    pages.forEach((page, index) => {
      if (index > 0) pdf.addPage()
      const pageNum = index + 1
      const total = pages.length
      
      const pageBodyPdfH = page.height * 2 * ratio
      
      // Crop this specific chunk of the body
      const chunkData = cropCanvas(bodyY + page.offset, page.height)
      pdf.addImage(chunkData, 'JPEG', 0, headerPdfH, pdfWidth, pageBodyPdfH)
      
      // Cover remaining space with white just in case
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, headerPdfH, 'F')
      pdf.rect(0, headerPdfH + pageBodyPdfH, pdfWidth, pageHeight - (headerPdfH + pageBodyPdfH), 'F')
      
      // Draw header
      pdf.addImage(headerData, 'JPEG', 0, 0, pdfWidth, headerPdfH)
      
      // Draw footer only if it's the last page
      if (page.isLast) {
        pdf.addImage(footerData, 'JPEG', 0, pageHeight - footerPdfH, pdfWidth, footerPdfH)
      }
      
      // Page number
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Page ${pageNum} of ${total}`, 15, pageHeight - 8)
    })
    
    const patientName = props.admission?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const billNo = props.billDetails?.billNo || 'Invoice'
    const filename = `${patientName}_${billNo}.pdf`
    currentFilename.value = filename
    
    if (preview) {
      const blob = pdf.output('blob')
      if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = URL.createObjectURL(blob)
      viewMode.value = 'preview'
    } else {
      pdf.save(filename)
      if (wasPreview) viewMode.value = 'preview'
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    snackbarStore.show({ message: 'Failed to generate PDF', type: 'error' })
    if (viewMode.value === 'preview') viewMode.value = 'edit'
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

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}
</script>

<template>
  <div v-if="show && billDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:items-start print:justify-start">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" @click="emit('close')"></div>

    <!-- Modal Wrapper -->
    <div :class="[
      'relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 flex flex-col print:max-h-none print:overflow-visible print:bg-white print:shadow-none print:rounded-none print:block',
      printingPDF ? 'max-h-none overflow-visible' : 'max-h-[90vh] overflow-hidden'
    ]">
      
      <!-- Preview Area -->
      <div v-show="viewMode === 'edit'" :class="[
        'p-6 flex justify-center bg-slate-100 flex-grow print:p-0 print:bg-white print:overflow-visible print:block',
        printingPDF ? 'overflow-visible' : 'overflow-y-auto'
      ]">
        <!-- Receipt Mockup Sheet (210mm x 148mm ratio) -->
        <div class="opd-print-receipt-container select-none">
          <table class="w-full receipt-table">
            <thead class="main-thead">
              <tr>
                <td>
                  <!-- Header Brand -->
                  <div class="receipt-header">
                    <h1>Emmanuel Hospital</h1>
                    <p>Luangmual Near Appollo School of Nursing, Aizawl, Mizoram - 796009</p>
                    <p>Phone: +91 8974326872 | Email: emmanuelhospital4@gmail.com</p>
                    <p>GSTIN: 15CDTPN0612H1ZK</p>
                    <hr class="receipt-divider" />
                    <h2>IPD BILL / INVOICE</h2>
                  </div>

                  <!-- Demographics Block -->
                  <div class="demographics">
                    <div>
                      <p><strong>Bill No:</strong> <span class="font-mono">{{ billDetails.billNo }}</span></p>
                      <p><strong>Date:</strong> {{ formatDate(billDetails.generatedAt || billDetails.createdAt) }}</p>
                      <p><strong>Status:</strong> <span class="uppercase font-bold">{{ billDetails.status }}</span></p>
                      <p><strong>Admission No:</strong> <span class="font-mono">{{ admission.admissionNo }}</span></p>
                    </div>
                    <div class="text-right">
                      <p class="patient-name truncate"><strong>Patient:</strong> {{ admission.patientId?.fullName }}</p>
                      <p><strong>Code:</strong> <span class="font-mono">{{ admission.patientId?.patientCode }}</span></p>
                      <p><strong>Age/Gender:</strong> {{ admission.patientId?.age }} Yrs / {{ admission.patientId?.gender }}</p>
                      <p><strong>Contact:</strong> {{ admission.patientId?.mobileNo }}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody class="main-tbody">
              <tr>
                <td>
                  <!-- Itemized Table -->
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th class="text-right">Rate</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in billDetails.items" :key="item._id">
                        <td class="font-medium truncate max-w-[200px]">{{ item.description }}</td>
                        <td class="text-right font-mono">{{ formatCurrency(item.rate) }}</td>
                        <td class="text-center font-mono">{{ item.quantity }}</td>
                        <td class="text-right font-mono font-semibold">{{ formatCurrency(item.amount) }}</td>
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
                    <div class="flex justify-between" v-if="billDetails.taxAmount > 0">
                      <span>Tax:</span>
                      <span class="font-mono">{{ formatCurrency(billDetails.taxAmount) }}</span>
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
                </td>
              </tr>
            </tbody>
            <tfoot class="main-tfoot">
              <tr>
                <td>
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
                    <p class="wish">*** Thank You for Visiting EHMS ***</p>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!-- PDF Real Preview Mode -->
      <div v-if="viewMode === 'preview'" class="flex-grow bg-slate-600 flex flex-col relative min-h-[60vh]">
        <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm z-10">
          <div class="flex flex-col items-center">
            <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></span>
            <span class="text-white font-medium shadow-sm">Generating Preview...</span>
          </div>
        </div>
        <iframe :src="pdfPreviewUrl" class="w-full h-full flex-grow border-0" title="PDF Preview"></iframe>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-white border-t border-slate-100 flex justify-between items-center gap-3 screen-only">
        <div>
          <button 
            v-if="viewMode === 'edit'"
            @click="generateInvoicePDF(true)"
            :disabled="printingPDF"
            class="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></span>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview PDF
          </button>
          
          <button 
            v-if="viewMode === 'preview'"
            @click="viewMode = 'edit'"
            :disabled="printingPDF"
            class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoice
          </button>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          
          <a v-if="viewMode === 'preview' && pdfPreviewUrl" :href="pdfPreviewUrl" :download="currentFilename" class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </a>
          
          <button 
            v-else
            @click="generateInvoicePDF(false)"
            :disabled="printingPDF"
            class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print & Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Using explicit hex colors to avoid oklch() issues in html2canvas */
.opd-print-receipt-container {
  width: 210mm;
  min-height: 148mm;
  height: max-content;
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
  margin-bottom: 16px;
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
    size: A4 portrait;
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
    min-height: 297mm !important;
    overflow: hidden !important;
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
