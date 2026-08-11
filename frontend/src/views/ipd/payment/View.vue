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
    <!-- Header Banner -->
    <div class="p-5 px-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
          {{ (admission.patientId?.fullName || 'P')[0] }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-black text-slate-800 tracking-tight">{{ admission.patientId?.fullName || 'Unknown Patient' }}</h2>
            <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              {{ admission.status || 'ADMITTED' }}
            </span>
          </div>
          <div class="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <span>MRN: <strong class="text-slate-700 font-mono">{{ admission.patientId?.mrn || admission.patientId?.patientCode || '-' }}</strong></span>
            <span>•</span>
            <span v-if="admission.bedId">Bed: <strong class="text-slate-700 font-mono">{{ admission.bedId?.bedNo || '-' }}</strong> {{ admission.bedId?.wardId?.name ? `(${admission.bedId.wardId.name})` : '' }}</span>
            <span v-if="admission.consultantDoctorId?.fullName">• Doctor: <strong class="text-indigo-600">Dr. {{ admission.consultantDoctorId.fullName.replace(/^Dr\.\s*/i, '') }}</strong></span>
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        <!-- Export All Bills & Charges Button -->
        <button 
          @click="handleExportAllBillsAndCharges"
          :disabled="exportingPdf"
          class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

        <!-- Total Available Deposit Widget -->
        <div class="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs">
          <svg class="w-4.5 h-4.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-xs">
            <span class="text-emerald-700/80 font-bold mr-1 uppercase text-[10px] tracking-wide">Available Deposit:</span>
            <strong class="font-bold font-mono text-sm text-emerald-900">₹{{ totalDeposit.toFixed(2) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-4">
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-xs font-semibold">Fetching IPD bills and invoices...</span>
      </div>
      
      <div v-else-if="bills.length === 0" class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-slate-700">No Bills Generated</p>
        <p class="text-xs text-slate-400 mt-0.5">There are no generated invoices for this admission record yet.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="bill in bills" 
          :key="bill._id"
          class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md"
        >
          <!-- Bill Header Row -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice / Bill No</span>
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border tracking-wider"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': bill.status === 'PAID',
                    'bg-amber-50 text-amber-700 border-amber-200': bill.status === 'PARTIALLY_PAID',
                    'bg-rose-50 text-rose-700 border-rose-200': bill.status === 'DRAFT' || bill.status === 'UNPAID',
                  }"
                >
                  {{ bill.status }}
                </span>
              </div>
              <h4 class="font-black font-mono text-indigo-600 text-lg mt-0.5">{{ bill.billNo }}</h4>
              <p class="text-xs text-slate-400 mt-0.5">Generated: {{ formatDate(bill.generatedAt || bill.createdAt) }}</p>
            </div>
            
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button 
                @click="handlePrint(bill)"
                :disabled="fetchingInvoice"
                class="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>

              <button 
                v-if="bill.status !== 'PAID'"
                @click="handlePayClicked(bill)"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pay Now
              </button>
            </div>
          </div>
          
          <!-- Financial Totals Grid -->
          <div class="grid grid-cols-3 gap-4 pt-4 text-xs">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Net Billed Amount</span>
              <div class="font-mono font-black text-slate-900 text-base">₹{{ bill.netAmount?.toFixed(2) }}</div>
            </div>
            <div class="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
              <span class="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider block mb-0.5">Total Paid</span>
              <div class="font-mono font-black text-emerald-700 text-base">₹{{ bill.paidAmount?.toFixed(2) }}</div>
            </div>
            <div class="bg-rose-50/50 p-3 rounded-xl border border-rose-100/80">
              <span class="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider block mb-0.5">Balance Due</span>
              <div class="font-mono font-black text-rose-700 text-base">₹{{ bill.balanceAmount?.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Processing Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">Process IPD Bill Payment</h3>
            <p class="text-xs text-slate-400 mt-0.5">Bill No: <span class="font-mono font-bold text-slate-700">{{ activeBill?.billNo }}</span></p>
          </div>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4 text-xs">
          <!-- Deposit Deduction Option -->
          <div v-if="totalDeposit > 0" class="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-emerald-900 uppercase tracking-wide text-[10px]">Deduct from Advance Deposit</span>
              <span class="text-emerald-700 font-mono font-bold">Max: ₹{{ totalDeposit.toFixed(2) }}</span>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.deductDeposit"
                @input="handleDepositInput"
                class="w-full pl-8 pr-4 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono font-bold text-sm outline-none"
                placeholder="0.00"
              >
            </div>
          </div>
          
          <div class="pt-2">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Remaining Balance to Pay</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input 
                type="number" 
                v-model="paymentForm.amount" 
                readonly
                class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-lg text-slate-900 focus:outline-none"
              >
            </div>
          </div>

          <div v-if="paymentForm.amount > 0">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Payment Mode</label>
            <select v-model="paymentForm.paymentMode" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          
          <div v-if="paymentForm.amount > 0 && ['UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentForm.paymentMode)">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Transaction / Ref No.</label>
            <input type="text" v-model="paymentForm.transactionNo" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none" placeholder="Enter transaction reference number">
          </div>
          
          <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Remarks (Optional)</label>
            <input type="text" v-model="paymentForm.remarks" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none" placeholder="Add payment notes or comments...">
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="showPaymentModal = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancel</button>
          <button @click="submitPayment" :disabled="processingPayment" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <span v-if="processingPayment" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ processingPayment ? 'Processing...' : 'Confirm Payment' }}</span>
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
