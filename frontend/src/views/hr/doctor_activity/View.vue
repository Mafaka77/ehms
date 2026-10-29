<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorActivityStore } from '../../../stores/doctorActivityStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'

import ActiveIpdTab from './tabs/ActiveIpdTab.vue'
import OpdConsultationTab from './tabs/OpdConsultationTab.vue'
import DentalChargesTab from './tabs/DentalChargesTab.vue'
import ActivityTab from './tabs/ActivityTab.vue'

const route = useRoute()
const router = useRouter()
const doctorActivityStore = useDoctorActivityStore()
const snackbarStore = useSnackbarStore()

const activeTab = ref('activity') // 'activity', 'ipd', 'opd', 'dental'

const doctorId = computed(() => route.params.id)

const data = computed(() => doctorActivityStore.activityDetails)
const doctor = computed(() => data.value?.doctor)
const metrics = computed(() => data.value?.metrics)
const activeAdmissions = computed(() => data.value?.activeAdmissions || [])
const recentAppointments = computed(() => data.value?.recentAppointments || [])
const dentalCharges = computed(() => data.value?.dentalCharges || [])

// ── Export Report Modal State & Logic ──────────────────────────────────────
const showReportModal = ref(false)
const isExportingExcel = ref(false)
const isExportingPdf = ref(false)

const reportFilters = ref({
  range: 'this_month', // 'today', 'this_month', 'last_month', 'all', 'custom'
  startDate: '',
  endDate: '',
  type: 'ALL' // 'ALL', 'OPD', 'IPD_CHARGE', 'DENTAL', 'BILL'
})

const openReportModal = (initialFilters = null) => {
  if (initialFilters && typeof initialFilters === 'object') {
    reportFilters.value = {
      range: initialFilters.range || 'this_month',
      startDate: initialFilters.startDate || '',
      endDate: initialFilters.endDate || '',
      type: initialFilters.type || 'ALL'
    }
  } else {
    reportFilters.value = {
      range: 'this_month',
      startDate: '',
      endDate: '',
      type: 'ALL'
    }
  }
  showReportModal.value = true
}

const closeReportModal = () => {
  if (isExportingExcel.value || isExportingPdf.value) return
  showReportModal.value = false
}

const onReportRangeChange = () => {
  if (reportFilters.value.range !== 'custom') {
    reportFilters.value.startDate = ''
    reportFilters.value.endDate = ''
  }
}

const formatDateTime = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  if ((hours === 0 && minutes === 0 && seconds === 0) || (hours === 5 && minutes === 30 && seconds === 0)) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getPeriodDescription = (range, start, end) => {
  const now = new Date()
  switch (range) {
    case 'today':
      return `Today (${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`
    case 'this_month':
      return `Current Month (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `Last Month (${lastMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
    }
    case 'all':
      return 'All Recorded Time'
    case 'custom':
      if (start && end) {
        return `${start} to ${end}`
      }
      return 'Custom Date Range'
    default:
      return 'Selected Period'
  }
}

const getActivityTypeLabel = (type) => {
  switch (type) {
    case 'OPD': return 'OPD Bill Invoices Only'
    case 'IPD_CHARGE': return 'IPD Charges & Addons Only'
    case 'DENTAL': return 'Dental Treatments & Charges Only'
    case 'BILL': return 'General Bills & Invoices Only'
    default: return 'All Activities'
  }
}

const allowedSources = ['OPD', 'IPD', 'EMERGENCY', 'RADIOLOGY', 'DENTAL', 'DENTAL_CONSULTATION', 'ENDOSCOPY']
const excludedKeywords = ['PHARMACY', 'LABORATORY', 'LAB', 'TEST', 'ROOM', 'BED', 'WARD', 'NURSING', 'ACCOMMODATION']

const prepareReportData = async () => {
  if (!doctorId.value) {
    snackbarStore.show({ message: 'Doctor ID is missing', type: 'error' })
    return null
  }

  if (reportFilters.value.range === 'custom') {
    if (!reportFilters.value.startDate || !reportFilters.value.endDate) {
      snackbarStore.show({ message: 'Please select both start date and end date for custom range', type: 'warning' })
      return null
    }
    if (new Date(reportFilters.value.startDate) > new Date(reportFilters.value.endDate)) {
      snackbarStore.show({ message: 'Start date cannot be after end date', type: 'warning' })
      return null
    }
  }

  const res = await doctorActivityStore.fetchDoctorActivityReport(doctorId.value, {
    range: reportFilters.value.range,
    startDate: reportFilters.value.startDate,
    endDate: reportFilters.value.endDate,
    type: reportFilters.value.type
  })

  if (!res.success || !res.data) {
    snackbarStore.show({ message: res.message || 'Failed to fetch doctor activity data for export', type: 'error' })
    return null
  }

  const rawItems = res.data.items || []
  const filteredItems = rawItems.filter(item => {
    const src = (item.source || '').toUpperCase().trim()
    const desc = (item.description || '').toUpperCase()

    for (const kw of excludedKeywords) {
      if (src.includes(kw) || desc.includes(kw)) return false
    }

    if (allowedSources.includes(src) || src === 'BILL' || src === 'ADDON') return true
    return allowedSources.some(s => src.includes(s))
  })

  if (filteredItems.length === 0) {
    snackbarStore.show({ message: 'No activity records found for the selected period.', type: 'warning' })
    return null
  }

  return {
    items: filteredItems,
    summary: res.data.summary || {}
  }
}

const exportToExcel = async () => {
  isExportingExcel.value = true
  try {
    const reportData = await prepareReportData()
    if (!reportData) return

    const { items, summary } = reportData
    const periodText = getPeriodDescription(reportFilters.value.range, reportFilters.value.startDate, reportFilters.value.endDate)
    const typeLabel = getActivityTypeLabel(reportFilters.value.type)
    const docName = doctor.value?.fullName || 'Doctor'
    const docCode = doctor.value?.doctorCode || '—'
    const specialization = doctor.value?.specializationId?.name || 'General Physician'

    const rows = []

    // Report Header Metadata
    rows.push(['DOCTOR CLINICAL & OPERATIONAL ACTIVITY REPORT'])
    rows.push(['Doctor Name:', docName])
    rows.push(['Doctor Code:', docCode])
    rows.push(['Specialization / Department:', specialization])
    rows.push(['Contact Number:', doctor.value?.mobileNo || '—'])
    rows.push(['Email:', doctor.value?.email || '—'])
    rows.push(['Report Period:', periodText])
    rows.push(['Activity Filter:', typeLabel])
    rows.push(['Generated At:', new Date().toLocaleString('en-IN')])
    rows.push([])

    // Summary Metrics
    rows.push(['SUMMARY OVERVIEW'])
    rows.push(['Total Activities Logged:', items.length])
    rows.push(['OPD Consultations Count:', summary.opdCount || 0, 'OPD Revenue (₹):', (summary.opdTotalAmount || 0).toFixed(2)])
    rows.push(['IPD Charges & Addons Count:', summary.ipdChargeCount || 0, 'IPD Revenue (₹):', (summary.ipdChargeTotalAmount || 0).toFixed(2)])
    rows.push(['Dental Charges Count:', summary.dentalCount || 0, 'Dental Revenue (₹):', (summary.dentalTotalAmount || 0).toFixed(2)])
    rows.push(['Other Invoices Count:', summary.billCount || 0, 'Other Revenue (₹):', (summary.billTotalAmount || 0).toFixed(2)])
    const grandTotal = items.reduce((sum, i) => sum + (Number(i.netAmount || i.amount) || 0), 0)
    rows.push(['Total Net Revenue Generated (₹):', grandTotal.toFixed(2)])
    rows.push([])

    // Table Header
    rows.push([
      '#',
      'Date & Time',
      'Activity Type',
      'Department / Source',
      'Patient Code',
      'Patient Name',
      'Patient Contact',
      'Bill / Ref No',
      'Description / Procedure',
      'Status',
      'Gross Amount (₹)',
      'Discount (₹)',
      'Net Amount (₹)'
    ])

    // Table Data
    let totalGross = 0
    let totalDiscount = 0
    let totalNet = 0

    items.forEach((item, index) => {
      const gross = Number(item.grossAmount ?? item.amount ?? 0)
      const discount = Number(item.discountAmount ?? 0)
      const net = Number(item.netAmount ?? item.amount ?? 0)

      totalGross += gross
      totalDiscount += discount
      totalNet += net

      rows.push([
        index + 1,
        formatDateTime(item.date),
        item.activityType || '—',
        item.source || item.code || '—',
        item.patientCode || '—',
        item.patientName || '—',
        item.patientMobile || '—',
        item.billNo || item.code || '—',
        item.description || '—',
        item.status || 'Active',
        gross.toFixed(2),
        discount.toFixed(2),
        net.toFixed(2)
      ])
    })

    // Summary row
    rows.push([
      'Totals',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalGross.toFixed(2),
      totalDiscount.toFixed(2),
      totalNet.toFixed(2)
    ])

    // Convert rows to CSV with UTF-8 BOM
    const csvContent = '\uFEFF' + rows.map(r => r.map(val => {
      if (val === null || val === undefined) return ''
      if (typeof val === 'string') {
        let clean = val.replace(/"/g, '""')
        if (clean.includes(',') || clean.includes('\n') || clean.includes(';') || clean.includes('\r')) {
          clean = `"${clean}"`
        }
        return clean
      }
      return val
    }).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const cleanDoc = docName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const rangeSlug = reportFilters.value.range === 'custom' 
      ? `${reportFilters.value.startDate}_to_${reportFilters.value.endDate}`
      : reportFilters.value.range

    link.setAttribute('href', blobUrl)
    link.setAttribute('download', `Doctor_Activity_${cleanDoc}_${rangeSlug}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)

    snackbarStore.show({ message: 'Doctor activity report exported to Excel successfully', type: 'success' })
    showReportModal.value = false
  } catch (err) {
    console.error('Error exporting activity to Excel:', err)
    snackbarStore.show({ message: 'Failed to export doctor activity report', type: 'error' })
  } finally {
    isExportingExcel.value = false
  }
}

const exportToPdf = async () => {
  isExportingPdf.value = true
  try {
    const reportData = await prepareReportData()
    if (!reportData) return

    const { items, summary } = reportData
    const periodText = getPeriodDescription(reportFilters.value.range, reportFilters.value.startDate, reportFilters.value.endDate)
    const typeLabel = getActivityTypeLabel(reportFilters.value.type)
    const docName = doctor.value?.fullName || 'Doctor'
    const docCode = doctor.value?.doctorCode || '—'
    const specialization = doctor.value?.specializationId?.name || 'General Physician'
    const grandTotal = items.reduce((sum, i) => sum + (Number(i.netAmount || i.amount) || 0), 0)

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Doctor Activity Report - ${docName} (${periodText})</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 10px;
              line-height: 1.4;
              font-size: 10.5px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              color: #3730a3;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .header p {
              margin: 3px 0 0 0;
              font-size: 10.5px;
              color: #64748b;
            }
            .meta-box {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 12px;
              font-size: 10.5px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              font-weight: 700;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-val {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            .stat-card {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-title {
              font-size: 8.5px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
            }
            .stat-value {
              font-size: 14px;
              font-weight: 800;
              color: #3730a3;
              margin-top: 2px;
            }
            .stat-sub {
              font-size: 9.5px;
              font-weight: 700;
              color: #059669;
              margin-top: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              margin-bottom: 12px;
            }
            th {
              background: #3730a3;
              color: #ffffff;
              text-align: left;
              padding: 6px 8px;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 8.5px;
              letter-spacing: 0.4px;
            }
            td {
              border-bottom: 1px solid #e2e8f0;
              padding: 6px 8px;
              color: #334155;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .amount-col {
              text-align: right;
              font-weight: 700;
              font-family: monospace;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8.5px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-source {
              background: #e0e7ff;
              color: #3730a3;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 10.5px;
            }
            .summary-table td {
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
            }
            .summary-table .label {
              font-weight: 700;
              background: #f1f5f9;
              text-align: right;
              width: 80%;
            }
            .summary-table .value {
              font-weight: 800;
              color: #3730a3;
              text-align: right;
              font-size: 13px;
              font-family: monospace;
            }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 9.5px;
              color: #64748b;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 180px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-top: 36px;
              padding-top: 4px;
              font-weight: 700;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Doctor Activity &amp; Clinical Revenue Report</h1>
            <p>Hospital Clinical Activity, Consultations &amp; Treatment Register</p>
          </div>

          <div class="meta-box">
            <div class="meta-item">
              <span class="meta-label">Doctor</span>
              <span class="meta-val">${docName} (${docCode})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Specialization / Dept</span>
              <span class="meta-val">${specialization}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Report Period</span>
              <span class="meta-val">${periodText}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Activity Filter / Generated</span>
              <span class="meta-val">${typeLabel} • ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Activities</div>
              <div class="stat-value">${items.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">OPD Consultations</div>
              <div class="stat-value">${summary.opdCount || 0}</div>
              <div class="stat-sub">₹${Number(summary.opdTotalAmount || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">IPD Charges</div>
              <div class="stat-value">${summary.ipdChargeCount || 0}</div>
              <div class="stat-sub">₹${Number(summary.ipdChargeTotalAmount || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Dental Charges</div>
              <div class="stat-value">${summary.dentalCount || 0}</div>
              <div class="stat-sub">₹${Number(summary.dentalTotalAmount || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-card" style="background: #ecfdf5; border-color: #a7f3d0;">
              <div class="stat-title" style="color: #047857;">Total Net Value</div>
              <div class="stat-value" style="color: #047857;">₹${Number(grandTotal).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 13%;">Date &amp; Time</th>
                <th style="width: 15%;">Activity Type</th>
                <th style="width: 9%;">Dept</th>
                <th style="width: 17%;">Patient Details</th>
                <th style="width: 25%;">Description / Procedure</th>
                <th style="width: 8%; text-align: center;">Status</th>
                <th style="width: 9%; text-align: right;">Net Amt (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => {
                const net = Number(item.netAmount ?? item.amount ?? 0)
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="white-space: nowrap;">${formatDateTime(item.date)}</td>
                    <td style="font-weight: 700; color: #1e293b;">${item.activityType || '—'}</td>
                    <td><span class="badge badge-source">${item.source || item.code || '—'}</span></td>
                    <td>
                      <strong>${item.patientName || '—'}</strong><br/>
                      <span style="color: #64748b; font-size: 8.5px;">Code: ${item.patientCode || '—'}</span>
                    </td>
                    <td>${item.description || '—'}</td>
                    <td style="text-align: center; font-weight: 600; font-size: 9px;">${item.status || 'Active'}</td>
                    <td class="amount-col">₹${net.toFixed(2)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td class="label">Total Activities Recorded:</td>
              <td class="value">${items.length} Activities</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td class="label" style="font-size: 12px; color: #1e293b;">Grand Total Net Revenue Generated:</td>
              <td class="value" style="font-size: 14px; color: #047857;">₹${grandTotal.toFixed(2)}</td>
            </tr>
          </table>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line">Prepared By</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Doctor Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>
        </body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(printContent)
    doc.close()

    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 250)

    snackbarStore.show({ message: 'Doctor activity report prepared for printing/PDF', type: 'success' })
    showReportModal.value = false
  } catch (err) {
    console.error('Error generating PDF report:', err)
    snackbarStore.show({ message: 'Failed to generate PDF report', type: 'error' })
  } finally {
    isExportingPdf.value = false
  }
}

onMounted(() => {
  if (doctorId.value) {
    doctorActivityStore.fetchDoctorActivityById(doctorId.value)
  }
})
</script>

<template>
  <div class="space-y-6 pb-12">

    <!-- Header Navigation -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/doctor-activity')"
          class="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-slate-600 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-900">Doctor Activity Profile</h1>
          <p class="text-xs text-slate-400">Detailed breakdown of clinical &amp; operational activity</p>
        </div>
      </div>

      <!-- Export Report Action Button -->
      <div class="flex items-center gap-2">
        <button
          @click="openReportModal()"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>Export Report</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="doctorActivityStore.loading" class="p-8 space-y-4 animate-pulse">
      <div class="h-32 bg-slate-100 rounded-2xl"></div>
      <div class="h-64 bg-slate-100 rounded-2xl"></div>
    </div>

    <div v-else-if="doctor" class="space-y-6">

      <!-- Doctor Profile Header Card -->
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200 shrink-0">
            {{ (doctor.fullName || 'D')[0] }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-black text-slate-900"> {{ doctor.fullName }}</h2>
              <span class="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {{ doctor.doctorCode }}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              {{ doctor.specializationId?.name || 'General Physician' }}
              <span v-if="doctor.qualification">• {{ doctor.qualification }}</span>
            </p>
            <p class="text-[11px] text-slate-400 mt-1">
              Mobile: <span class="font-semibold text-slate-700">{{ doctor.mobileNo || '—' }}</span>
              <span v-if="doctor.email" class="ml-3">Email: <span class="font-semibold text-slate-700">{{ doctor.email }}</span></span>
            </p>
          </div>
        </div>

        <!-- Metrics pill badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto text-center">
          <div class="bg-sky-50 border border-sky-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-sky-600 uppercase tracking-wider">OPD Today</p>
            <p class="text-xl font-black text-sky-700 mt-0.5">{{ metrics?.opdTodayCount || 0 }}</p>
          </div>
          <div class="bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Active IPD</p>
            <p class="text-xl font-black text-violet-700 mt-0.5">{{ metrics?.activeIpdCount || 0 }}</p>
          </div>
          <div class="bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Dental Charges</p>
            <p class="text-xl font-black text-teal-700 mt-0.5">{{ metrics?.dentalChargesCount || dentalCharges.length || 0 }}</p>
          </div>
          <div class="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
            <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total OPD</p>
            <p class="text-xl font-black text-indigo-700 mt-0.5">{{ metrics?.opdTotalCount || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Activity Tab Switcher & Container -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div class="flex items-center border-b border-slate-100 bg-slate-50/50 px-4 overflow-x-auto">
          
          <!-- Tab 1: Activity Breakdown (Default) -->
          <button
            @click="activeTab = 'activity'"
            :class="activeTab === 'activity' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Activity Breakdown</span>
          </button>

          <!-- Tab 2: Active IPD Admissions -->
          <button
            @click="activeTab = 'ipd'"
            :class="activeTab === 'ipd' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>Active IPD Admissions</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-violet-100 text-violet-700 font-bold">
              {{ activeAdmissions.length }}
            </span>
          </button>

          <!-- Tab 3: Recent OPD Consultations -->
          <button
            @click="activeTab = 'opd'"
            :class="activeTab === 'opd' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>OPD Consultations</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700 font-bold">
              {{ recentAppointments.length }}
            </span>
          </button>

          <!-- Tab 4: Dental Treatment Charges -->
          <button
            @click="activeTab = 'dental'"
            :class="activeTab === 'dental' ? 'border-teal-600 text-teal-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
            class="px-4 py-3 text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>Dental Charges</span>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-700 font-bold">
              {{ dentalCharges.length }}
            </span>
          </button>

        </div>

        <!-- Render active tab component -->
        <ActivityTab
          v-if="activeTab === 'activity'"
          :doctorId="doctorId"
          @open-export="openReportModal"
        />

        <ActiveIpdTab
          v-else-if="activeTab === 'ipd'"
          :activeAdmissions="activeAdmissions"
          :doctorName="doctor.fullName"
        />

        <OpdConsultationTab
          v-else-if="activeTab === 'opd'"
          :appointments="recentAppointments"
        />

        <DentalChargesTab
          v-else-if="activeTab === 'dental'"
          :dentalCharges="dentalCharges"
          :doctorName="doctor.fullName"
        />

      </div>

    </div>

    <div v-else class="p-12 text-center text-slate-400 text-sm">
      Doctor activity profile not found
    </div>

    <!-- Export Report Modal -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeReportModal"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in duration-200">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-800">Export Activity Report</h2>
              <p class="text-xs text-slate-500 mt-0.5">Filter by time period and export clinical activity data</p>
            </div>
          </div>
          <button
            @click="closeReportModal"
            class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- Doctor Card Preview -->
          <div v-if="doctor" class="bg-indigo-50/60 border border-indigo-100/80 rounded-xl p-3.5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {{ (doctor.fullName || 'D')[0] }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-900 truncate">{{ doctor.fullName }} <span class="text-indigo-600 font-extrabold ml-1">({{ doctor.doctorCode }})</span></p>
              <p class="text-[11px] text-slate-500 truncate">{{ doctor.specializationId?.name || 'General Physician' }}</p>
            </div>
          </div>

          <!-- Time Period Presets -->
          <div class="space-y-2">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Select Time Period</label>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                @click="reportFilters.range = 'this_month'; onReportRangeChange()"
                :class="reportFilters.range === 'this_month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                class="px-2.5 py-2 rounded-xl text-xs text-center transition-all cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                @click="reportFilters.range = 'last_month'; onReportRangeChange()"
                :class="reportFilters.range === 'last_month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                class="px-2.5 py-2 rounded-xl text-xs text-center transition-all cursor-pointer"
              >
                Last Month
              </button>
              <button
                type="button"
                @click="reportFilters.range = 'today'; onReportRangeChange()"
                :class="reportFilters.range === 'today' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                class="px-2.5 py-2 rounded-xl text-xs text-center transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                @click="reportFilters.range = 'all'; onReportRangeChange()"
                :class="reportFilters.range === 'all' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                class="px-2.5 py-2 rounded-xl text-xs text-center transition-all cursor-pointer"
              >
                All Time
              </button>
              <button
                type="button"
                @click="reportFilters.range = 'custom'"
                :class="reportFilters.range === 'custom' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 font-medium'"
                class="px-2.5 py-2 rounded-xl text-xs text-center transition-all cursor-pointer col-span-2 sm:col-span-1"
              >
                Custom
              </button>
            </div>
          </div>

          <!-- Custom Date Range Inputs -->
          <div v-if="reportFilters.range === 'custom'" class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  v-model="reportFilters.startDate"
                  class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  v-model="reportFilters.endDate"
                  class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Activity Category Filter -->
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Activity Filter</label>
            <select
              v-model="reportFilters.type"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-700 transition-all cursor-pointer"
            >
              <option value="ALL">Full / All Activities</option>
              <option value="OPD">OPD Consultation Invoices Only</option>
              <option value="IPD_CHARGE">IPD Charges &amp; Addons Only</option>
              <option value="DENTAL">Dental Treatments &amp; Charges Only</option>
              <option value="BILL">General Bills &amp; Invoices Only</option>
            </select>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            @click="closeReportModal"
            class="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <div class="w-full sm:w-auto flex items-center gap-2">
            <!-- Export PDF -->
            <button
              type="button"
              @click="exportToPdf"
              :disabled="isExportingPdf || isExportingExcel"
              class="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50/50 text-indigo-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span v-if="isExportingPdf" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent"></span>
              <svg v-else class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Export PDF</span>
            </button>

            <!-- Export Excel -->
            <button
              type="button"
              @click="exportToExcel"
              :disabled="isExportingPdf || isExportingExcel"
              class="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span v-if="isExportingExcel" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Export to Excel</span>
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
