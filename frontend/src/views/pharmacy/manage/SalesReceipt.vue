<script setup>
import { ref } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

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
  <div v-if="show && sale" class="fixed inset-0 z-[999] flex items-center justify-center p-4 screen-only animate-in fade-in duration-200">
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
                  <th>Medicine Name</th>
                  <th class="text-center">Batch No</th>
                  <th class="text-right">Rate</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item._id">
                  <td class="font-medium truncate max-w-[220px]">
                    {{ item.medicineId?.medicineName }}
                    <span v-if="item.medicineId?.brandName" class="text-[9px] text-slate-500 font-normal ml-1">({{ item.medicineId.brandName }})</span>
                  </td>
                  <td class="text-center font-mono font-bold text-[10px]">{{ item.batchId?.batchNo || '—' }}</td>
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
</template>

<style scoped>
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
    size: A4 portrait;
    margin: 0;
  }
  body * {
    visibility: hidden;
  }
  .print-receipt-container, .print-receipt-container * {
    visibility: visible;
  }
  .print-receipt-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm;
    min-height: 148mm;
    height: auto;
    margin: 0;
    padding: 10mm;
    box-shadow: none;
    border: none;
    z-index: 999999;
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
