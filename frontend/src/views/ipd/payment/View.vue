<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import InvoiceModal from './Invoice.vue'

const props = defineProps({
  admission: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['payment-success'])
const snackbarStore = useSnackbarStore()
const admissionStore = useIpdAdmissionStore()

const loading = ref(false)
const bills = ref([])
const advances = ref([])

const totalDeposit = computed(() => {
  return advances.value.reduce((sum, item) => sum + item.amount, 0)
})

const fetchDetails = async () => {
  if (!props.admission?._id) return
  loading.value = true
  
  try {
    const [billRes, advRes] = await Promise.all([
      admissionStore.fetchAdmissionBills(props.admission._id),
      admissionStore.fetchAdmissionAdvances(props.admission._id)
    ])
    
    if (billRes.success) bills.value = billRes.data
    if (advRes.success) advances.value = advRes.data
  } catch (error) {
    console.error('Error fetching IPD payment details:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.admission, fetchDetails, { immediate: true })

// Payment Modal State
const showPaymentModal = ref(false)
const processingPayment = ref(false)
const activeBill = ref(null)

const paymentForm = ref({
  deductDeposit: 0,
  amount: 0,
  paymentMode: 'CASH',
  transactionNo: '',
  remarks: ''
})

const handlePayClicked = (bill) => {
  activeBill.value = bill
  paymentForm.value = {
    deductDeposit: 0,
    amount: bill.balanceAmount,
    paymentMode: 'CASH',
    transactionNo: '',
    remarks: ''
  }
  showPaymentModal.value = true
}

const handleDepositInput = () => {
  let val = Number(paymentForm.value.deductDeposit) || 0
  const maxDeposit = totalDeposit.value
  const billTotal = activeBill.value?.balanceAmount || 0
  
  if (val > maxDeposit) val = maxDeposit
  if (val > billTotal) val = billTotal
  
  paymentForm.value.deductDeposit = val
  paymentForm.value.amount = Math.max(0, billTotal - val)
}

const submitPayment = async () => {
  const deductVal = Number(paymentForm.value.deductDeposit) || 0
  const remainingVal = Number(paymentForm.value.amount) || 0
  
  if (deductVal === 0 && remainingVal <= 0) {
    snackbarStore.show({ message: 'Please enter a valid payment amount', type: 'error' })
    return
  }

  processingPayment.value = true
  try {
    // 1. Process Deposit Deduction first
    if (deductVal > 0) {
      await api.post(`/billing/bills/${activeBill.value._id}/pay`, {
        amount: deductVal,
        paymentMode: 'ADVANCE_DEPOSIT',
        remarks: 'Deducted from IPD Advance Deposit'
      })
    }
    
    // 2. Process Remaining Amount
    if (remainingVal > 0) {
      await api.post(`/billing/bills/${activeBill.value._id}/pay`, {
        amount: remainingVal,
        paymentMode: paymentForm.value.paymentMode,
        transactionNo: paymentForm.value.transactionNo,
        remarks: paymentForm.value.remarks
      })
    }
    
    snackbarStore.show({ message: 'Payment processed successfully', type: 'success' })
    showPaymentModal.value = false
    emit('payment-success')
    fetchDetails()
  } catch (error) {
    console.error('Error processing payment:', error)
    snackbarStore.show({ 
      message: error.response?.data?.message || 'Failed to process payment', 
      type: 'error' 
    })
  } finally {
    processingPayment.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Print logic
const showInvoice = ref(false)
const invoiceBillDetails = ref(null)
const fetchingInvoice = ref(false)
const exportingPdf = ref(false)

const handlePrint = async (bill) => {
  fetchingInvoice.value = true
  try {
    const res = await api.get(`/billing/bills/${bill._id}`)
    invoiceBillDetails.value = res.data.data
    showInvoice.value = true
  } catch (error) {
    console.error('Error fetching bill details for print:', error)
    snackbarStore.show({ message: 'Failed to load bill details for printing', type: 'error' })
  } finally {
    fetchingInvoice.value = false
  }
}

const handleExportAllBillsAndCharges = async () => {
  if (!props.admission?._id) return
  exportingPdf.value = true

  try {
    const [chargesRes, advRes, billListRes] = await Promise.all([
      admissionStore.fetchAdmissionCharges(props.admission._id),
      admissionStore.fetchAdmissionAdvances(props.admission._id),
      admissionStore.fetchAdmissionBills(props.admission._id)
    ])

    const allCharges = chargesRes.success ? chargesRes.data : []
    const allAdvances = advRes.success ? advRes.data : []
    const billList = billListRes.success ? billListRes.data : []

    const detailedBills = await Promise.all(
      billList.map(async (b) => {
        try {
          const r = await api.get(`/billing/bills/${b._id}`)
          return r.data.data || b
        } catch {
          return b
        }
      })
    )

    const totalChargesSum = allCharges.reduce((sum, c) => {
      const base = c.amount || 0
      const addonsTotal = (c.addons || []).reduce((s, a) => s + (a.amount || 0), 0)
      return sum + base + addonsTotal
    }, 0)

    const totalAdvancesSum = allAdvances.reduce((sum, a) => sum + (a.amount || 0), 0)
    const totalBilledSum = detailedBills.reduce((sum, b) => sum + (b.netAmount || 0), 0)
    const totalPaidSum = detailedBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0)
    const totalBalanceSum = detailedBills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0)

    const patient = props.admission.patientId || {}
    const adm = props.admission || {}

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Detailed Statement - ${patient.fullName || 'Patient'}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; line-height: 1.4; }
            .header-table { width: 100%; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; }
            .hospital-title { font-size: 20px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-title { font-size: 11px; color: #64748b; font-weight: 600; }
            
            .demo-grid { width: 100%; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px; }
            .demo-grid td { padding: 4px 8px; vertical-align: top; }
            .label { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 9px; }
            .val { font-weight: 600; color: #0f172a; }

            .summary-box { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 15px; }
            .card { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 6px; text-align: center; }
            .card-title { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .card-val { font-size: 13px; font-weight: 800; color: #3730a3; margin-top: 2px; }

            .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e1b4b; background: #e0e7ff; padding: 6px 10px; border-radius: 6px; margin: 15px 0 8px 0; letter-spacing: 0.5px; }

            table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
            table.data-table th { background: #3730a3; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
            table.data-table td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; color: #1e293b; }
            table.data-table tr:nth-child(even) { background-color: #f8fafc; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; font-weight: bold; }
            .addon-tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 3px; font-size: 8.5px; font-weight: 600; margin-top: 2px; }
            .ot-tag { display: block; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 3px 6px; border-radius: 4px; font-size: 8.5px; margin-top: 3px; }

            .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 40px; padding-top: 4px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="hospital-title">EMMANUEL HOSPITAL & RESEARCH CENTRE</div>
                <div class="sub-title">Detailed IPD Charges & Invoicing Statement</div>
              </td>
              <td class="text-right" style="font-size: 10px; color: #64748b;">
                Generated On: ${new Date().toLocaleString('en-IN')}<br>
                Status: <strong>${adm.status || 'ACTIVE'}</strong>
              </td>
            </tr>
          </table>

          <table class="demo-grid">
            <tr>
              <td style="width: 25%;">
                <span class="label">Patient Name</span><br>
                <span class="val" style="font-size: 12px; color: #4338ca;">${patient.fullName || '-'}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">MRN / Patient Code</span><br>
                <span class="val font-mono">${patient.mrn || patient.patientCode || '-'}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">IPD Admission No</span><br>
                <span class="val font-mono">${adm.admissionNo || '-'}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">Age / Gender / Contact</span><br>
                <span class="val">${patient.age || '-'} Yrs / ${patient.gender || '-'} / ${patient.mobileNo || '-'}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Bed / Ward Location</span><br>
                <span class="val">${adm.bedId?.bedNumber ? 'Bed ' + adm.bedId.bedNumber + ' (' + (adm.bedId.wardId?.name || 'Ward') + ')' : '-'}</span>
              </td>
              <td>
                <span class="label">Admitting Doctor</span><br>
                <span class="val">${adm.doctorId?.fullName || '-'}</span>
              </td>
              <td>
                <span class="label">Admission Date</span><br>
                <span class="val">${adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString('en-IN') : '-'}</span>
              </td>
              <td>
                <span class="label">Discharge Date</span><br>
                <span class="val">${adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString('en-IN') : 'Active Admission'}</span>
              </td>
            </tr>
          </table>

          <div class="summary-box">
            <div class="card">
              <div class="card-title">Accumulated Charges</div>
              <div class="card-val">₹${totalChargesSum.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Advance Deposits</div>
              <div class="card-val" style="color: #047857;">₹${totalAdvancesSum.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Billed</div>
              <div class="card-val" style="color: #4338ca;">₹${totalBilledSum.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Paid</div>
              <div class="card-val" style="color: #059669;">₹${totalPaidSum.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Balance Due</div>
              <div class="card-val" style="color: #e11d48;">₹${totalBalanceSum.toFixed(2)}</div>
            </div>
          </div>

          <!-- Section 1: Detailed Patient Charges Register -->
          <div class="section-header">1. Complete Itemized Patient Charges Register</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Date & Time</th>
                <th style="width: 14%;">Category</th>
                <th style="width: 38%;">Description & Breakdown</th>
                <th style="width: 10%; text-align: right;">Unit Rate</th>
                <th style="width: 5%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${allCharges.length === 0 ? '<tr><td colspan="7" class="text-center">No patient charges logged.</td></tr>' : 
                allCharges.map((c, idx) => {
                  const dt = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
                  const cat = (c.chargeCategoryId?.name || c.chargeType || 'Other')
                  const baseAmt = c.amount || 0
                  const addons = c.addons || []
                  const addonsSum = addons.reduce((s, a) => s + (a.amount || 0), 0)
                  const lineTotal = baseAmt + addonsSum

                  let descHtml = `<strong>${c.description}</strong>`
                  if (c.ot_description) {
                    descHtml += `<div class="ot-tag"><strong>OT Notes:</strong> ${c.ot_description}</div>`
                  }
                  if (addons.length > 0) {
                    descHtml += `<div style="margin-top: 3px;">`
                    addons.forEach(a => {
                      descHtml += `<span class="addon-tag">+ ${a.itemName} (₹${(a.amount || 0).toLocaleString()})</span> `
                    })
                    descHtml += `</div>`
                  }

                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${dt}</td>
                      <td><span style="font-weight: 700; color: #475569;">${cat}</span></td>
                      <td>${descHtml}</td>
                      <td class="text-right font-mono">₹${(c.rate || 0).toFixed(2)}</td>
                      <td class="text-center font-mono">${c.quantity || 1}</td>
                      <td class="text-right font-mono" style="font-weight: 800;">₹${lineTotal.toFixed(2)}</td>
                    </tr>
                  `
                }).join('')
              }
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="6" class="text-right" style="text-transform: uppercase;">Total Accumulated Charges:</td>
                <td class="text-right font-mono" style="font-size: 12px; color: #4338ca;">₹${totalChargesSum.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Section 2: Generated Bills Summary -->
          <div class="section-header">2. Invoices & Billing Summary</div>
          ${detailedBills.length === 0 ? '<p style="color: #64748b; margin-left: 5px;">No bills generated for this admission.</p>' :
            detailedBills.map(b => `
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 10px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-weight: 800; color: #4338ca;" class="font-mono">${b.billNo}</span>
                    <span style="font-size: 9px; color: #64748b; margin-left: 8px;">Date: ${b.generatedAt ? new Date(b.generatedAt).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                  <div>
                    <span style="font-weight: 700; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #e0e7ff; color: #3730a3;">${b.status}</span>
                  </div>
                </div>
                <table class="data-table" style="margin-bottom: 0;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #475569;">
                      <th style="width: 50%;">Item Description</th>
                      <th style="width: 15%; text-align: right;">Rate</th>
                      <th style="width: 10%; text-align: center;">Qty</th>
                      <th style="width: 25%; text-align: right;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(b.items || []).map(item => `
                      <tr>
                        <td>${item.description}</td>
                        <td class="text-right font-mono">₹${(item.rate || 0).toFixed(2)}</td>
                        <td class="text-center font-mono">${item.quantity || 1}</td>
                        <td class="text-right font-mono">₹${(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr style="background: #fafafa; font-weight: bold;">
                      <td colspan="3" class="text-right">Bill Net Amount:</td>
                      <td class="text-right font-mono" style="color: #4338ca;">₹${(b.netAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr style="background: #fafafa;">
                      <td colspan="3" class="text-right" style="color: #047857; font-weight: 700;">Paid Amount:</td>
                      <td class="text-right font-mono" style="color: #047857; font-weight: 700;">₹${(b.paidAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr style="background: #fafafa;">
                      <td colspan="3" class="text-right" style="color: #e11d48; font-weight: 700;">Balance Due:</td>
                      <td class="text-right font-mono" style="color: #e11d48; font-weight: 700;">₹${(b.balanceAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `).join('')
          }

          <!-- Section 3: Advance Deposits & Payments Register -->
          <div class="section-header">3. Advance Deposits & Payment Transactions</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">Date & Time</th>
                <th style="width: 20%;">Payment Mode</th>
                <th style="width: 35%;">Receipt / Remarks</th>
                <th style="width: 20%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${allAdvances.length === 0 ? '<tr><td colspan="5" class="text-center">No advance deposits recorded.</td></tr>' :
                allAdvances.map((adv, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${adv.createdAt ? new Date(adv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td><span style="font-weight: 700;" class="font-mono">${adv.paymentMode || 'CASH'}</span></td>
                    <td>${adv.receiptNo ? 'Receipt: ' + adv.receiptNo : ''} ${adv.remarks || ''}</td>
                    <td class="text-right font-mono" style="font-weight: 700; color: #047857;">₹${(adv.amount || 0).toFixed(2)}</td>
                  </tr>
                `).join('')
              }
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="4" class="text-right" style="text-transform: uppercase;">Total Advance Deposits:</td>
                <td class="text-right font-mono" style="font-size: 11px; color: #047857;">₹${totalAdvancesSum.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line">Patient / Relative Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Authorized Accounts Officer</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `

    const printWin = window.open('', '_blank')
    printWin.document.write(printContent)
    printWin.document.close()
  } catch (error) {
    console.error('Error exporting detailed statement:', error)
    snackbarStore.show({ message: 'Failed to export detailed bills and charges statement', type: 'error' })
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
          <svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ admission.patientId?.fullName }}</h2>
          <div class="text-sm font-medium text-slate-500 flex gap-3 mt-1">
            <span>MRN: <strong class="text-slate-700 font-mono">{{ admission.patientId?.mrn || admission.patientId?.patientCode }}</strong></span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Export All Bills & Charges Button -->
        <button 
          @click="handleExportAllBillsAndCharges"
          :disabled="exportingPdf"
          class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="exportingPdf" class="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Detailed Statement
        </button>

        <!-- Total Deposit Widget -->
        <div class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm">
            <span class="text-emerald-600/80 font-semibold mr-1">Available Deposit:</span>
            <strong class="font-bold font-mono text-base">₹{{ totalDeposit.toFixed(2) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
      
      <div v-else-if="bills.length === 0" class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
        <p class="text-slate-500">No bills generated for this admission.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="bill in bills" 
          :key="bill._id"
          class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill Number</span>
              <h4 class="font-bold font-mono text-indigo-600 text-lg">{{ bill.billNo }}</h4>
              <p class="text-xs text-slate-500 mt-1">Generated: {{ formatDate(bill.generatedAt) }}</p>
            </div>
            
            <div class="flex flex-col items-end gap-2">
              <span 
                class="px-2.5 py-1 rounded-md text-[10px] font-bold border"
                :class="{
                  'bg-emerald-50 text-emerald-700 border-emerald-200': bill.status === 'PAID',
                  'bg-amber-50 text-amber-700 border-amber-200': bill.status === 'PARTIALLY_PAID',
                  'bg-rose-50 text-rose-700 border-rose-200': bill.status === 'DRAFT' || bill.status === 'UNPAID',
                }"
              >
                {{ bill.status }}
              </span>
                    <div class="flex items-center gap-2">
                      <button 
                        @click="handlePrint(bill)"
                        class="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                      <button 
                        v-if="bill.status !== 'PAID'"
                        @click="handlePayClicked(bill)"
                        class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        Pay Now
                      </button>
                    </div>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <span class="text-xs text-slate-500">Total Amount</span>
              <div class="font-mono font-bold text-slate-800">₹{{ bill.netAmount?.toFixed(2) }}</div>
            </div>
            <div>
              <span class="text-xs text-slate-500">Paid Amount</span>
              <div class="font-mono font-bold text-emerald-600">₹{{ bill.paidAmount?.toFixed(2) }}</div>
            </div>
            <div>
              <span class="text-xs text-slate-500">Balance Amount</span>
              <div class="font-mono font-bold text-rose-600">₹{{ bill.balanceAmount?.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-800">Process Payment</h3>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Deposit Deduction -->
          <div v-if="totalDeposit > 0" class="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div class="flex justify-between text-sm mb-2">
              <span class="font-bold text-emerald-800">Deduct from Deposit</span>
              <span class="text-emerald-600 font-mono">Available: ₹{{ totalDeposit.toFixed(2) }}</span>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.deductDeposit"
                @input="handleDepositInput"
                class="w-full pl-8 pr-4 py-2 border-emerald-200 rounded-lg text-emerald-800 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              >
            </div>
          </div>
          
          <div class="border-t border-slate-100 pt-4">
            <label class="block text-sm font-bold text-slate-700 mb-1">Remaining Balance to Pay</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.amount" 
                readonly
                class="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-lg text-slate-800"
              >
            </div>
          </div>

          <div v-if="paymentForm.amount > 0">
            <label class="block text-sm font-bold text-slate-700 mb-1">Payment Mode</label>
            <select v-model="paymentForm.paymentMode" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          
          <div v-if="paymentForm.amount > 0 && ['UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentForm.paymentMode)">
            <label class="block text-sm font-bold text-slate-700 mb-1">Transaction/Reference No.</label>
            <input type="text" v-model="paymentForm.transactionNo" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter reference number">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Remarks (Optional)</label>
            <input type="text" v-model="paymentForm.remarks" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any comments...">
          </div>
        </div>
        
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showPaymentModal = false" class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button @click="submitPayment" :disabled="processingPayment" class="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
            <span v-if="processingPayment">Processing...</span>
            <span v-else>Confirm Payment</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Invoice Modal Component -->
    <InvoiceModal 
      :show="showInvoice" 
      :admission="admission"
      :billDetails="invoiceBillDetails"
      @close="showInvoice = false"
    />
  </div>
</template>
