<script setup>
import { ref } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  order: {
    type: Object,
    required: true
  },
  billDetails: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

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
</script>

<template>
  <div v-if="show && billDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 screen-only animate-in fade-in duration-200">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>
    
    <!-- Modal Wrapper -->
    <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
      
      <!-- Preview Area -->
      <div class="p-6 overflow-y-auto flex justify-center bg-slate-100 flex-grow">
        <!-- Receipt Mockup Sheet (Sized to 210mm x 148mm ratio on screen) -->
        <div class="print-receipt-container select-none">
          <!-- Receipt Content -->
          <div class="receipt-content">
            <!-- Header Brand -->
            <div class="receipt-header">
              <h1>EHMS Hospital & Research Centre</h1>
              <p>123 Health Care Avenue, Medical City</p>
              <p>Mob: +91 98765 43210 | Email: billing@ehms.com</p>
              <hr class="receipt-divider" />
              <h2>LABORATORY BILL / INVOICE</h2>
            </div>

            <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Bill No:</strong> <span class="font-mono">{{ billDetails.billNo }}</span></p>
                <p><strong>Date:</strong> {{ formatDate(billDetails.generatedAt || billDetails.createdAt) }}</p>
                <p><strong>Status:</strong> <span class="uppercase font-bold">{{ billDetails.status }}</span></p>
                <p><strong>Order No:</strong> <span class="font-mono">{{ order.orderNo }}</span></p>
              </div>
              <div class="text-right">
                <p class="patient-name truncate"><strong>Patient:</strong> {{ order.patientId?.fullName }}</p>
                <p><strong>Code:</strong> <span class="font-mono">{{ order.patientId?.patientCode }}</span></p>
                <p><strong>Age/Gender:</strong> {{ order.patientId?.age }} Yrs / {{ order.patientId?.gender }}</p>
                <p><strong>Contact:</strong> {{ order.patientId?.mobileNo }}</p>
              </div>
            </div>

            <div class="doctor-section">
              <p><strong>Referring Clinician:</strong> Dr. {{ order.doctorId?.fullName || 'Self/Referral' }}</p>
            </div>

            <!-- Itemized Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Test Name</th>
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

            <!-- Signatures Operator info -->
            <div class="signatures">
              <div>
                <p>Prepared By:</p>
                <p class="operator-name">{{ billDetails.generatedBy?.fullName || 'Cashier' }}</p>
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signature</span>
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
      <div class="p-4 bg-white border-t border-slate-100 flex justify-end gap-3 screen-only">
        <button 
          @click="emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
        <button 
          @click="printInvoicePDF"
          :disabled="printingPDF"
          class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
</template>

<style scoped>
/* Scoped custom styling using standard hex colors to bypass Tailwind v4 oklch() color issues in html2canvas */
.print-receipt-container {
  width: 210mm;
  height: 148mm;
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

.doctor-section {
  border-top: 1px dashed #e2e8f0;
  padding-top: 6px;
  font-size: 10px;
  margin-bottom: 12px;
  color: #334155;
}

.doctor-section p {
  margin: 0;
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
  margin-bottom: 4px;
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
  
  /* Reset layout structure for printing */
  html, body, #app, .min-h-screen, .flex-1, main, .fixed, .relative {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  body * {
    visibility: hidden;
  }
  .print-receipt-container, .print-receipt-container * {
    visibility: visible;
  }
  .print-receipt-container {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    min-height: 148mm !important;
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
