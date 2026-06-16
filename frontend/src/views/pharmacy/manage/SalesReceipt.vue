<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  sale: {
    type: Object,
    default: null
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const printingPDF = ref(false)

const printInvoicePDF = () => {
  window.print()
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

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${month}/${year}`
}

const numberToWords = (num) => {
  if (num === 0 || !num) return 'Zero Rupees Only'
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow'
    n = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
    if (!n) return ''
    let str = ''
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : ''
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : ''
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : ''
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : ''
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : ''
    return str.trim()
  }
  
  let wholePart = Math.floor(num)
  let fractionalPart = Math.round((num - wholePart) * 100)
  
  let words = inWords(wholePart) + ' Rupees'
  if (fractionalPart > 0) {
    words += ' and ' + inWords(fractionalPart) + ' Paise'
  }
  return words + ' Only'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show && sale" class="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200 print:static print:block print:p-0">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" @click="emit('close')"></div>
    
    <!-- Modal Wrapper -->
    <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:static print:block print:max-w-none print:max-h-none print:overflow-visible print:bg-white print:shadow-none print:rounded-none">
      
      <!-- Preview Area -->
      <div class="p-6 overflow-y-auto flex justify-center bg-slate-100 flex-grow print:p-0 print:bg-white print:overflow-visible print:block">
        <!-- Receipt Mockup Sheet (Sized to 210mm x 148mm ratio on screen) -->
        <div class="print-receipt-container select-none">
          <!-- Receipt Content -->
          <div class="receipt-content">
            <!-- Header Brand -->
            <div class="receipt-header">
              <h1 class="uppercase tracking-widest text-slate-900">Emmanuel Hospital</h1>
              <p>Luangmual Near Appollo School of Nursing</p>
              <p>Aizawl, Mizoram - 796009</p>
              <p>Phone: +91 8974326872 | Email: emmanuelhospital4@gmail.com</p>
              <p>GSTIN: 15CDTPN0612H1ZK</p>
              <hr class="receipt-divider" />
              <h2>PHARMACY BILL / INVOICE</h2>
            </div>

            <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Bill No:</strong> <span class="font-mono">{{ sale.saleNo }}</span></p>
                <p><strong>Date:</strong> {{ formatDate(sale.createdAt) }}</p>
                <p><strong>Status:</strong> <span class="uppercase font-bold text-emerald-600">PAID</span></p>
              </div>
              <div class="text-right font-sans">
                <div v-if="sale.patientId">
                  <p class="patient-name truncate font-bold text-slate-900"><strong>Patient:</strong> {{ sale.patientId.fullName }}</p>
                  <p><strong>Code:</strong> <span class="font-mono">{{ sale.patientId.patientCode }}</span></p>
                  <p><strong>Age/Gender:</strong> {{ sale.patientId.age || '—' }} Yrs / {{ sale.patientId.gender || '—' }}</p>
                  <p><strong>Contact:</strong> {{ sale.patientId.mobileNo }}</p>
                </div>
                <div v-else>
                  <p class="patient-name truncate font-bold text-slate-900"><strong>Customer:</strong> {{ sale.customerName || 'Walk-in' }}</p>
                  <p v-if="sale.customerPhone"><strong>Contact:</strong> {{ sale.customerPhone }}</p>
                  <p v-else>—</p>
                </div>
              </div>
            </div>

            <!-- Itemized Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th class="text-left">Medicine Name</th>
                  <th class="text-center">Batch No</th>
                  <th class="text-center">Exp. Dt</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">CGST 2.50%</th>
                  <th class="text-right">CGST Amt</th>
                  <th class="text-right">SGST 2.50%</th>
                  <th class="text-right">SGST Amt</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item._id">
                  <td class="font-medium truncate max-w-[150px]">
                    {{ item.medicineId?.medicineName }}
                    <span v-if="item.medicineId?.brandName" class="text-[8px] text-slate-500 font-normal ml-1">({{ item.medicineId.brandName }})</span>
                  </td>
                  <td class="text-center font-mono font-bold text-[9px]">{{ item.batchId?.batchNo || '—' }}</td>
                  <td class="text-center font-mono text-[9px]">{{ formatDateShort(item.batchId?.expiryDate) }}</td>
                  <td class="text-center font-mono text-[9px]">{{ item.quantity }}</td>
                  <td class="text-right font-mono text-[9px]">{{ formatCurrency(item.rate) }}</td>
                  <td class="text-right font-mono text-[9px]">2.50%</td>
                  <td class="text-right font-mono text-[9px]">{{ formatCurrency((item.amount * 2.5) / 105) }}</td>
                  <td class="text-right font-mono text-[9px]">2.50%</td>
                  <td class="text-right font-mono text-[9px]">{{ formatCurrency((item.amount * 2.5) / 105) }}</td>
                  <td class="text-right font-mono font-semibold text-[9px]">{{ formatCurrency(item.amount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div class="financials-summary-container flex justify-between mt-3">
              <div class="amount-words text-[10px] font-semibold text-slate-700 italic max-w-[60%]">
                <span class="text-slate-500 text-[9px] uppercase tracking-wider not-italic">Amount in Words:</span><br/>
                {{ numberToWords(sale.totalAmount) }}
              </div>
              <div class="financials-summary w-48">
                <div class="flex justify-between">
                  <span>Gross Total:</span>
                  <span class="font-mono">{{ formatCurrency(sale.totalAmount) }}</span>
                </div>
                <div class="flex justify-between net-payable">
                  <span>Net Payable:</span>
                  <span class="font-mono">{{ formatCurrency(sale.totalAmount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Paid Amount:</span>
                  <span class="font-mono">{{ formatCurrency(sale.totalAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures Operator info -->
            <div class="signatures">
              <div>
                <p>Dispensed By:</p>
                <p class="operator-name">{{ sale.createdBy?.fullName || 'Pharmacist' }}</p>
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signatory</span>
              </div>
            </div>

            <!-- Computer Generated Notice -->
            <div class="notice">
              <p>This is a computer-generated invoice and does not require a physical signature.</p>
              <p class="wish">*** Get Well Soon ***</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 print:hidden">
        <button 
          @click="emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
        <button 
          @click="printInvoicePDF"
          :disabled="printingPDF"
          class="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<style scoped>
.print-receipt-container {
  width: 210mm;
  min-height: 148mm;
  height: auto;
  overflow: visible;
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

.demographics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
  row-gap: 4px;
  font-size: 10px;
  margin-bottom: 12px;
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
  margin-bottom: 16px;
}

.items-table th {
  border-top: 1px dashed #cbd5e1;
  border-bottom: 1px dashed #cbd5e1;
  font-weight: bold;
  padding: 6px 0;
  color: #475569;
}

.items-table td {
  border-bottom: 1px dashed #f1f5f9;
  padding: 6px 0;
  color: #334155;
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
  margin-bottom: 4px;
}

.financials-summary .net-payable {
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
  color: #1e1b4b;
  font-size: 11px;
  font-weight: bold;
}

.signatures {
  margin-top: 24px;
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
  margin-top: 16px;
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

  /* Hide the main application entirely during print so only the Teleported modal is processed */
  :global(#app) {
    display: none !important;
  }

  html, body {
    width: 210mm !important;
    height: auto !important;
    min-height: 148mm !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background-color: white !important;
  }

  .print-receipt-container {
    position: static !important;
    width: 210mm !important;
    min-height: 148mm !important;
    height: auto !important;
    overflow: visible !important;
    padding: 15mm !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
    border: none !important;
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
