<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  appointment: {
    type: Object,
    required: true
  },
  installment: {
    type: Object,
    default: null
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
</script>

<template>
  <div v-if="show && installment" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:items-start print:justify-start">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" @click="emit('close')"></div>

    <!-- Modal Wrapper -->
    <div class="relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:bg-white print:shadow-none print:rounded-none">

      <!-- Preview Area -->
      <div class="p-6 overflow-y-auto flex justify-center bg-slate-100 flex-grow print:p-0 print:bg-white print:overflow-visible print:block">
        <!-- Receipt Mockup Sheet (210mm x 148mm ratio) -->
        <div class="opd-print-receipt-container select-none">
          <div class="receipt-content">

            <!-- Header Brand -->
            <div class="receipt-header">
              <h1>EHMS Hospital &amp; Research Centre</h1>
              <p>123 Health Care Avenue, Medical City</p>
              <p>Mob: +91 98765 43210 | Email: billing@ehms.com</p>
              <hr class="receipt-divider" />
              <h2>DENTAL PAYMENT RECEIPT</h2>
            </div>

            <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Payment No:</strong> <span class="font-mono">{{ installment.paymentId?.paymentNo || 'N/A' }}</span></p>
                <p><strong>Date:</strong> {{ formatDate(installment.paidDate) }}</p>
                <p><strong>Status:</strong> <span class="uppercase font-bold">{{ installment.status }}</span></p>
                <p><strong>Appt No:</strong> <span class="font-mono">{{ appointment.appointmentId }}</span></p>
              </div>
              <div class="text-right">
                <p class="patient-name truncate"><strong>Patient:</strong> {{ appointment.patientId?.fullName }}</p>
                <p><strong>Code:</strong> <span class="font-mono">{{ appointment.patientId?.patientCode }}</span></p>
                <p><strong>Age/Gender:</strong> {{ appointment.patientId?.age }} Yrs / {{ appointment.patientId?.gender }}</p>
                <p><strong>Contact:</strong> {{ appointment.patientId?.mobileNo }}</p>
              </div>
            </div>

            <div class="doctor-section">
              <p><strong>Consulting Doctor:</strong> Dr. {{ appointment.doctorId?.fullName || 'N/A' }}</p>
              <p><strong>Procedure:</strong> {{ installment.dentalPatientChargesId?.description }}</p>
            </div>

            <!-- Itemized Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Payment Mode</th>
                  <th class="text-right">Paid Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-medium truncate max-w-[200px]">Installment Payment against Procedure: {{ installment.dentalPatientChargesId?.description }}</td>
                  <td class="text-center">{{ installment.paymentMode || installment.paymentId?.paymentMode || 'CASH' }}</td>
                  <td class="text-right font-mono font-semibold text-emerald-600">{{ formatCurrency(installment.amount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div class="financials-summary">
              <div class="flex justify-between">
                <span>Procedure Cost:</span>
                <span class="font-mono">{{ formatCurrency(installment.dentalPatientChargesId?.amount) }}</span>
              </div>
              <div class="flex justify-between net-payable">
                <span>Amount Paid Now:</span>
                <span class="font-mono">{{ formatCurrency(installment.amount) }}</span>
              </div>
              <div class="flex justify-between balance-due">
                <span>Remaining Balance on Procedure:</span>
                <span class="font-mono">{{ formatCurrency(installment.balance) }}</span>
              </div>
            </div>

            <!-- Signatures -->
            <div class="signatures">
              <div>
                <p>Received By:</p>
                <p class="operator-name">{{ installment.createdBy?.fullName || 'Cashier' }}</p>
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signature</span>
              </div>
            </div>

            <!-- Notice -->
            <div class="notice">
              <p>This is a computer-generated receipt and does not require a physical signature.</p>
              <p class="wish">*** Thank You for Visiting EHMS ***</p>
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
          Print Receipt
        </button>
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
