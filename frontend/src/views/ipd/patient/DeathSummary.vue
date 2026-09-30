<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import logoUrl from '../../../assets/logo_final.png'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// TipTap Imports
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
  admissionId: {
    type: String,
    required: true
  },
  admission: {
    type: Object,
    required: true
  }
})

const snackbarStore = useSnackbarStore()
const admissionStore = useIpdAdmissionStore()

const loading = ref(false)
const saving = ref(false)

const getNowDateTimeString = (dateInput = null) => {
  const now = dateInput ? new Date(dateInput) : new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const setDeathDateToNow = () => {
  form.value.deathDateTime = getNowDateTimeString()
}

const form = ref({
  admissionId: props.admissionId,
  patientId: props.admission?.patientId?._id || props.admission?.patientId,
  deathDateTime: '',
  details: ''
})

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] }
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({
      placeholder: 'Enter death summary details, clinical course, cause of death, resuscitation notes, and remarks...'
    })
  ],
  content: '',
  onUpdate({ editor: e }) {
    form.value.details = e.getHTML()
  }
})

const loadSummary = async () => {
  loading.value = true
  try {
    const res = await admissionStore.fetchDeathSummary(props.admissionId)
    if (res.success && res.data) {
      const d = res.data
      form.value.deathDateTime = d.deathDateTime ? getNowDateTimeString(d.deathDateTime) : ''
      form.value.details = d.details || ''
      if (editor.value) {
        editor.value.commands.setContent(form.value.details)
      }
    }
  } catch (error) {
    console.error('Failed to load death summary record:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSummary()
})

watch(() => props.admissionId, () => {
  loadSummary()
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const saveSummary = async () => {
  if (!form.value.deathDateTime) {
    snackbarStore.show({ message: 'Please provide the Date and Time of Death.', type: 'warning' })
    return
  }

  saving.value = true
  try {
    const res = await admissionStore.saveDeathSummary(props.admissionId, {
      ...form.value,
      details: editor.value ? editor.value.getHTML() : form.value.details,
      admissionId: props.admissionId,
      patientId: props.admission?.patientId?._id || props.admission?.patientId,
      isDeceased: true
    })
    if (res.success) {
      snackbarStore.show({ message: 'Death summary saved successfully!', type: 'success' })
      if (props.admission) {
        props.admission.isDeceased = true
      }
    } else {
      snackbarStore.show({ message: res.message || 'Failed to save death summary', type: 'error' })
    }
  } catch (error) {
    console.error(error)
    snackbarStore.show({ message: 'Failed to save death summary', type: 'error' })
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// PDF Export & Printing Logic matching NewBornDischargeSummary
const showPdfModal = ref(false)
const pdfPreviewUrl = ref(null)
const printingPDF = ref(false)
const currentFilename = ref('')
const printReportContainer = ref(null)

const closePdfModal = () => {
  showPdfModal.value = false
  if (pdfPreviewUrl.value) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = null
  }
}

const printPdfFromIframe = () => {
  const iframe = document.querySelector('iframe[title="Death Summary PDF Preview"]')
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.print()
  } else {
    printSummary()
  }
}

const generateReportPDF = async () => {
  if (printingPDF.value) return
  printingPDF.value = true
  showPdfModal.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 150))
    const element = printReportContainer.value
    if (!element) throw new Error('Report container not found')
    
    const scaleFactor = 3
    const canvas = await html2canvas(element, {
      scale: scaleFactor,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    const tbody = element.querySelector('tbody')
    const tfoot = element.querySelector('tfoot')
    
    const contRect = element.getBoundingClientRect()
    const tbodyRect = tbody.getBoundingClientRect()
    const tfootRect = tfoot ? tfoot.getBoundingClientRect() : { top: contRect.bottom, bottom: contRect.bottom }
    
    const headerCanvasH = Math.round((tbodyRect.top - contRect.top) * scaleFactor)
    const bodyCanvasH = Math.round((tfootRect.top - tbodyRect.top) * scaleFactor)
    const signatureCanvasH = Math.round((tfootRect.bottom - tfootRect.top) * scaleFactor)
    
    const cropCanvas = (sy, sh) => {
      const c = document.createElement('canvas')
      c.width = canvas.width
      const validSy = Math.max(0, sy)
      const validSh = Math.max(0, Math.min(sh, canvas.height - validSy))
      c.height = validSh || 1
      const ctx = c.getContext('2d')
      if (validSh > 0) {
        ctx.drawImage(canvas, 0, validSy, canvas.width, validSh, 0, 0, canvas.width, validSh)
      }
      return c.toDataURL('image/jpeg', 0.98)
    }
    
    const headerData = cropCanvas(0, headerCanvasH)
    const signatureData = signatureCanvasH > 0 ? cropCanvas(headerCanvasH + bodyCanvasH, signatureCanvasH) : null
    
    const ratio = pdfWidth / canvas.width
    const headerPdfH = headerCanvasH * ratio
    const bodyPdfH = bodyCanvasH * ratio
    const signaturePdfH = signatureCanvasH * ratio
    
    const footerMarginH = 12
    const bodyAvailableSpace = pageHeight - headerPdfH - footerMarginH - (signaturePdfH > 0 ? signaturePdfH : 0)
    
    const sections = Array.from(tbody.querySelectorAll('.pdf-section, .pdf-diagnosis-box, .pdf-patient-card'))
    const tbodyTop = tbody.getBoundingClientRect().top
    
    const sectionBounds = sections.map(sec => {
      const rect = sec.getBoundingClientRect()
      return {
        top: Math.round((rect.top - tbodyTop) * scaleFactor),
        bottom: Math.round((rect.bottom - tbodyTop) * scaleFactor),
        height: Math.round(rect.height * scaleFactor)
      }
    })
    
    const availableSpacePx = Math.floor(bodyAvailableSpace / ratio)
    
    const pageBreaks = [0]
    let currentY = 0
    
    while (currentY + availableSpacePx < bodyCanvasH) {
      let idealBreak = currentY + availableSpacePx
      
      const intersectingSection = sectionBounds.find(sec => sec.top < idealBreak && idealBreak < sec.bottom)
      
      if (intersectingSection) {
        if (intersectingSection.height <= availableSpacePx && intersectingSection.top > currentY) {
          idealBreak = intersectingSection.top
        }
      }
      
      pageBreaks.push(idealBreak)
      currentY = idealBreak
    }
    
    const totalPages = pageBreaks.length
    
    const drawPageFrame = (pageNum) => {
      const startY = pageBreaks[pageNum - 1]
      const endY = pageNum < totalPages ? pageBreaks[pageNum] : bodyCanvasH
      const sliceCanvasH = endY - startY
      const slicePdfH = sliceCanvasH * ratio
      
      if (sliceCanvasH > 0) {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceCanvasH
        const ctx = sliceCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, startY + headerCanvasH, canvas.width, sliceCanvasH, 0, 0, canvas.width, sliceCanvasH)
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.98)
        
        pdf.addImage(sliceData, 'JPEG', 0, headerPdfH, pdfWidth, slicePdfH)
      }
      
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, headerPdfH, 'F')
      
      const totalBottomClearH = footerMarginH + (signaturePdfH > 0 ? signaturePdfH : 0)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, pageHeight - totalBottomClearH, pdfWidth, totalBottomClearH + 2, 'F')
      
      pdf.addImage(headerData, 'JPEG', 0, 0, pdfWidth, headerPdfH)
      
      if (pageNum === totalPages && signatureData) {
        const sigY = pageHeight - footerMarginH - signaturePdfH
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, sigY - 1, pdfWidth, signaturePdfH + 2, 'F')
        pdf.addImage(signatureData, 'JPEG', 0, sigY, pdfWidth, signaturePdfH)
      }
      
      if (totalPages > 1) {
        pdf.setFontSize(8.5)
        pdf.setTextColor(100, 116, 139)
        const pageText = `Page ${pageNum} of ${totalPages}`
        const textWidth = pdf.getTextWidth(pageText)
        pdf.text(pageText, (pdfWidth - textWidth) / 2, pageHeight - 5.5)
      }
    }
    
    for (let p = 1; p <= totalPages; p++) {
      if (p > 1) pdf.addPage()
      drawPageFrame(p)
    }
    
    const patientName = props.admission?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const admNo = props.admission?.admissionNo || 'DeathSummary'
    const filename = `${patientName}_${admNo}_Death_Summary.pdf`
    currentFilename.value = filename
    
    const blob = pdf.output('blob')
    if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
    pdfPreviewUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error generating PDF preview:', error)
    snackbarStore.show({ message: 'Failed to generate PDF preview', type: 'error' })
  } finally {
    printingPDF.value = false
  }
}

const printSummary = () => {
  const patient = props.admission?.patientId || {}
  const doctor = props.admission?.consultantDoctorId || {}
  const bed = props.admission?.bedId || {}
  const ward = bed?.wardId || {}
  const f = form.value
  const detailsHtml = editor.value ? editor.value.getHTML() : (f.details || '')

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Death Summary - ${patient.fullName || 'Patient'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          @media print {
            html, body {
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 0;
            margin: 0;
            color: #0f172a;
            line-height: 1.42;
            font-size: 10.5px;
          }
          
          .print-wrapper { width: 100%; border-collapse: collapse; }
          .print-header { display: table-header-group; }
          .print-footer { display: table-footer-group; }
          .print-body { display: table-row-group; }

          .header { border-bottom: 2px solid #0f172a; padding: 16px 24px 8px 24px; margin-bottom: 12px; width: 100%; }
          .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
          .logo-container { text-align: left; }
          .logo-img { height: 54px; width: auto; object-fit: contain; }
          .address-container { text-align: right; font-size: 9px; color: #475569; line-height: 1.4; }
          .hospital-name { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px; }
          .hospital-addr, .hospital-contact { margin: 0; font-weight: 500; }
          .header-title { text-align: center; margin-top: 4px; }
          .title-badge { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; background-color: #f1f5f9; padding: 3.5px 18px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; margin: 0; }
          
          .patient-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 0 24px 12px 24px; page-break-inside: avoid; }
          .info-block { font-size: 10px; }
          .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 8.5px; margin-bottom: 2px; letter-spacing: 0.3px; }
          .info-value { font-size: 10.5px; font-weight: 700; color: #0f172a; }

          .death-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 8px 12px; border-radius: 6px; margin: 0 24px 11px 24px; page-break-inside: avoid; }
          .death-title { font-size: 10px; font-weight: 800; color: #be123c; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; }
          .death-value { font-size: 12px; font-weight: 800; color: #881337; }

          .section { margin: 0 24px 11px 24px; page-break-inside: avoid; }
          .section-title { font-size: 10px; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #94a3b8; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .section-content { font-size: 10.5px; color: #1e293b; line-height: 1.5; padding: 2px 2px; }
          .section-content table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          .section-content th, .section-content td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
          .section-content th { background-color: #f1f5f9; font-weight: bold; }
          .section-content ul, .section-content ol { padding-left: 18px; margin: 4px 0; }
          .section-content blockquote { border-left: 3px solid #cbd5e1; padding-left: 10px; color: #475569; font-style: italic; }

          .footer-container { padding: 24px 24px 0 24px; page-break-inside: avoid; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; }
          .signature-box { text-align: center; width: 180px; }
          .signature-line { border-top: 1px solid #0f172a; padding-top: 4px; margin-top: 36px; font-weight: bold; font-size: 10px; }
        </style>
      </head>
      <body>
        <table class="print-wrapper">
          <thead class="print-header">
            <tr>
              <td>
                <div class="header">
                  <div class="header-top">
                    <div class="logo-container">
                      <img src="${logoUrl}" alt="Hospital Logo" class="logo-img" />
                    </div>
                    <div class="address-container">
                      <p class="hospital-name">EMMANUEL HOSPITAL</p>
                      <p class="hospital-addr">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                      <p class="hospital-contact">Phone: 0389-2913340 / 8974326872</p>
                    </div>
                  </div>
                  <div class="header-title">
                    <h1 class="title-badge">DEATH SUMMARY</h1>
                  </div>
                </div>
              </td>
            </tr>
          </thead>

          <tbody class="print-body">
            <tr>
              <td>
                <div class="patient-card">
                  <div class="info-block">
                    <div class="info-label">Patient Name</div>
                    <div class="info-value">${patient.fullName || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">IPD Admission No</div>
                    <div class="info-value">${props.admission?.admissionNo || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Age / Gender</div>
                    <div class="info-value">${patient.age ? `${patient.age} yrs` : '-'} / ${patient.gender || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Patient Code</div>
                    <div class="info-value">${patient.patientCode || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Admission Date</div>
                    <div class="info-value">${formatDateTime(props.admission?.admissionDate)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Ward / Bed</div>
                    <div class="info-value">Bed ${bed.bedNo || '-'} (${ward.name || '-'})</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Consultant Doctor</div>
                    <div class="info-value">${doctor.fullName || 'Consultant'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Address</div>
                    <div class="info-value">${patient.address || '-'}</div>
                  </div>
                </div>

                <div class="death-box">
                  <div class="death-title">Date &amp; Time of Death</div>
                  <div class="death-value">${formatDateTime(f.deathDateTime)}</div>
                </div>

                <div class="section">
                  <div class="section-title">Clinical Details / Death Summary</div>
                  <div class="section-content">${detailsHtml || '<p>No details recorded.</p>'}</div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot class="print-footer">
            <tr>
              <td>
                <div class="footer-container">
                  <div class="footer">
                    <div class="signature-box">
                      <div class="signature-line">Medical Officer / Prepared By</div>
                    </div>
                    <div class="signature-box">
                      <div class="signature-line">${doctor.fullName || 'Consultant Doctor'}</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-800">Death Summary</h2>
          <p class="text-xs text-slate-500">Record and manage official patient death summary details</p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <button
          type="button"
          @click="generateReportPDF"
          :disabled="printingPDF"
          class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg v-if="printingPDF" class="animate-spin h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>PDF / Print</span>
        </button>

        <button
          type="button"
          @click="saveSummary"
          :disabled="saving"
          class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Save Death Summary</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-28 bg-slate-100 rounded-xl"></div>
      <div class="h-48 bg-slate-100 rounded-xl"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Patient Information Summary Card -->
      <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
        <div class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Patient & Admission Details
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Patient Name</span>
            <span class="font-bold text-slate-800">{{ admission?.patientId?.fullName || '-' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Age / Gender</span>
            <span class="font-bold text-slate-800">
              {{ admission?.patientId?.age ? `${admission?.patientId?.age} yrs` : '-' }} / {{ admission?.patientId?.gender || '-' }}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Patient Code</span>
            <span class="font-bold text-slate-800">{{ admission?.patientId?.patientCode || '-' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Admission No</span>
            <span class="font-bold text-slate-800">{{ admission?.admissionNo || '-' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Admission Date</span>
            <span class="font-bold text-slate-800">{{ formatDate(admission?.admissionDate) }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] font-medium">Consultant</span>
            <span class="font-bold text-slate-800">{{ admission?.consultantDoctorId?.fullName || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
        <!-- Death Date Time -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Date & Time of Death <span class="text-rose-500">*</span>
          </label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="datetime-local"
              v-model="form.deathDateTime"
              class="w-full sm:max-w-md px-3.5 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              required
            />
            <button
              type="button"
              @click="setDeathDateToNow"
              class="px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              Set Current Time
            </button>
          </div>
        </div>

        <!-- Details (TipTap Editor) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Death Details / Clinical Summary
          </label>
          <p class="text-xs text-slate-500 mb-3">
            Record cause of death, clinical course, resuscitation details, and notes using rich formatting.
          </p>
          
          <div class="tiptap-wrapper border border-slate-200 rounded-xl overflow-hidden focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all bg-white shadow-sm">
            <!-- Toolbar -->
            <div class="flex flex-wrap items-center gap-1 p-2 bg-slate-50/90 border-b border-slate-200">
              <!-- Headings -->
              <button
                type="button"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="['tiptap-btn', { active: editor?.isActive('heading', { level: 2 }) }]"
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
                :class="['tiptap-btn', { active: editor?.isActive('heading', { level: 3 }) }]"
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().setParagraph().run()"
                :class="['tiptap-btn', { active: editor?.isActive('paragraph') }]"
                title="Paragraph"
              >
                P
              </button>

              <div class="w-px h-5 bg-slate-300 mx-1"></div>

              <!-- Inline Styles -->
              <button
                type="button"
                @click="editor?.chain().focus().toggleBold().run()"
                :class="['tiptap-btn', { active: editor?.isActive('bold') }]"
                title="Bold (Ctrl+B)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().toggleItalic().run()"
                :class="['tiptap-btn', { active: editor?.isActive('italic') }]"
                title="Italic (Ctrl+I)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4-8m-8 4l-4 8"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().toggleUnderline().run()"
                :class="['tiptap-btn', { active: editor?.isActive('underline') }]"
                title="Underline (Ctrl+U)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 8v8a5 5 0 0010 0V8M5 20h14"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().toggleStrike().run()"
                :class="['tiptap-btn', { active: editor?.isActive('strike') }]"
                title="Strikethrough"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M9 6h6M9 18h6"/>
                </svg>
              </button>

              <div class="w-px h-5 bg-slate-300 mx-1"></div>

              <!-- Alignment -->
              <button
                type="button"
                @click="editor?.chain().focus().setTextAlign('left').run()"
                :class="['tiptap-btn', { active: editor?.isActive({ textAlign: 'left' }) }]"
                title="Align Left"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().setTextAlign('center').run()"
                :class="['tiptap-btn', { active: editor?.isActive({ textAlign: 'center' }) }]"
                title="Align Center"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M5 18h14"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().setTextAlign('right').run()"
                :class="['tiptap-btn', { active: editor?.isActive({ textAlign: 'right' }) }]"
                title="Align Right"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M10 12h10M6 18h14"/>
                </svg>
              </button>

              <div class="w-px h-5 bg-slate-300 mx-1"></div>

              <!-- Lists -->
              <button
                type="button"
                @click="editor?.chain().focus().toggleBulletList().run()"
                :class="['tiptap-btn', { active: editor?.isActive('bulletList') }]"
                title="Bullet List"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16M8 6h.01M8 12h.01M8 18h.01"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().toggleOrderedList().run()"
                :class="['tiptap-btn', { active: editor?.isActive('orderedList') }]"
                title="Numbered List"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h14M7 12h14M7 16h14M3 8h.01M3 12h.01M3 16h.01"/>
                </svg>
              </button>

              <div class="w-px h-5 bg-slate-300 mx-1"></div>

              <!-- Blockquote & Table -->
              <button
                type="button"
                @click="editor?.chain().focus().toggleBlockquote().run()"
                :class="['tiptap-btn', { active: editor?.isActive('blockquote') }]"
                title="Blockquote"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
                class="tiptap-btn"
                title="Insert Table"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3z M3 9h18 M9 3v18 M15 3v18"/>
                </svg>
              </button>

              <div class="flex-grow"></div>

              <!-- History -->
              <button
                type="button"
                @click="editor?.chain().focus().undo().run()"
                :disabled="!editor?.can().undo()"
                class="tiptap-btn"
                title="Undo (Ctrl+Z)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
              </button>
              <button
                type="button"
                @click="editor?.chain().focus().redo().run()"
                :disabled="!editor?.can().redo()"
                class="tiptap-btn"
                title="Redo (Ctrl+Y)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
                </svg>
              </button>
            </div>

            <!-- Editor Content Area -->
            <editor-content :editor="editor" class="min-h-[260px] p-4 text-sm bg-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Printable Element for PDF Generation (Matching NewBornDischargeSummary Structure) -->
    <div style="position: absolute; left: -9999px; top: -9999px;">
      <table ref="printReportContainer" class="pdf-print-wrapper">
        <thead class="pdf-print-header">
          <tr>
            <td>
              <div class="pdf-header">
                <div class="pdf-header-top">
                  <div class="pdf-logo-container">
                    <img :src="logoUrl" alt="Hospital Logo" class="pdf-logo-img" />
                  </div>
                  <div class="pdf-address-container">
                    <p class="pdf-hospital-name">EMMANUEL HOSPITAL</p>
                    <p class="pdf-hospital-info">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                    <p class="pdf-hospital-info">Phone: 0389-2913340 / 8974326872</p>
                  </div>
                </div>
                <div style="text-align: center; margin-top: 4px;">
                  <h1 class="pdf-title-badge">DEATH SUMMARY</h1>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <!-- Patient Card -->
              <div class="pdf-patient-card">
                <div>
                  <div class="pdf-info-lbl">Patient Name</div>
                  <div class="pdf-info-val">{{ admission?.patientId?.fullName || '-' }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">IPD Admission No</div>
                  <div class="pdf-info-val">{{ admission?.admissionNo || '-' }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Age / Gender</div>
                  <div class="pdf-info-val">{{ admission?.patientId?.age ? `${admission?.patientId?.age} yrs` : '-' }} / {{ admission?.patientId?.gender || '-' }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Patient Code</div>
                  <div class="pdf-info-val">{{ admission?.patientId?.patientCode || '-' }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Admission Date</div>
                  <div class="pdf-info-val">{{ formatDateTime(admission?.admissionDate) }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Ward / Bed</div>
                  <div class="pdf-info-val">Bed {{ admission?.bedId?.bedNo || '-' }} ({{ admission?.bedId?.wardId?.name || '-' }})</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Consultant Doctor</div>
                  <div class="pdf-info-val">{{ admission?.consultantDoctorId?.fullName || 'Consultant' }}</div>
                </div>
                <div>
                  <div class="pdf-info-lbl">Address</div>
                  <div class="pdf-info-val">{{ admission?.patientId?.address || '-' }}</div>
                </div>
              </div>

              <!-- Date & Time of Death -->
              <div class="pdf-diagnosis-box">
                <div class="pdf-diagnosis-lbl">Date &amp; Time of Death</div>
                <div style="font-size: 11.5px; font-weight: 800; color: #881337;">{{ formatDateTime(form.deathDateTime) }}</div>
              </div>

              <!-- Clinical Details Section -->
              <div class="pdf-section">
                <div class="pdf-section-title">Clinical Details / Death Summary</div>
                <div class="pdf-section-content" v-html="form.details || '<p>No specific clinical details recorded.</p>'"></div>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <div class="pdf-footer-container">
                <div class="pdf-footer">
                  <div class="pdf-signature-box">
                    <div class="pdf-signature-line">Medical Officer / Prepared By</div>
                  </div>
                  <div class="pdf-signature-box">
                    <div class="pdf-signature-line">{{ admission?.consultantDoctorId?.fullName || 'Consultant Doctor' }}</div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- PDF Preview Modal -->
    <div
      v-if="showPdfModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">Death Summary Preview</h3>
              <p class="text-xs text-slate-500">{{ currentFilename }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="printPdfFromIframe"
              class="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              @click="closePdfModal"
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Preview Body -->
        <div class="flex-1 bg-slate-100 p-4 overflow-hidden relative">
          <div v-if="!pdfPreviewUrl" class="h-full flex flex-col items-center justify-center gap-3">
            <svg class="animate-spin h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs text-slate-500 font-medium">Generating PDF Preview...</span>
          </div>
          <iframe
            v-else
            :src="pdfPreviewUrl"
            title="Death Summary PDF Preview"
            class="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* TipTap Toolbar Buttons */
.tiptap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.tiptap-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.tiptap-btn.active {
  background: #ffe4e6;
  color: #be123c;
}

.tiptap-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* TipTap Prose and Content Styles */
.tiptap-wrapper :deep(.tiptap) {
  outline: none;
  min-height: 240px;
  line-height: 1.65;
  color: #1e293b;
}

.tiptap-wrapper :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

.tiptap-wrapper :deep(.tiptap h2) {
  font-size: 1.25em;
  font-weight: 700;
  margin: 0.6em 0 0.3em;
  color: #0f172a;
}

.tiptap-wrapper :deep(.tiptap h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.5em 0 0.25em;
  color: #1e293b;
}

.tiptap-wrapper :deep(.tiptap ul),
.tiptap-wrapper :deep(.tiptap ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.tiptap-wrapper :deep(.tiptap ul) {
  list-style-type: disc;
}

.tiptap-wrapper :deep(.tiptap ol) {
  list-style-type: decimal;
}

.tiptap-wrapper :deep(.tiptap li) {
  margin: 0.2em 0;
}

.tiptap-wrapper :deep(.tiptap blockquote) {
  border-left: 3px solid #cbd5e1;
  padding-left: 1em;
  margin: 0.6em 0;
  color: #64748b;
  font-style: italic;
}

.tiptap-wrapper :deep(.tiptap table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.tiptap-wrapper :deep(.tiptap th),
.tiptap-wrapper :deep(.tiptap td) {
  border: 1px solid #cbd5e1;
  padding: 0.4em 0.8em;
  min-width: 3em;
}

.tiptap-wrapper :deep(.tiptap th) {
  background-color: #f8fafc;
  font-weight: bold;
  text-align: left;
}

/* ─────────────────────────────────────────────────────────────
   PDF Layout & Print CSS (Strictly matching NewBornDischargeSummary)
   ───────────────────────────────────────────────────────────── */
.pdf-print-wrapper {
  width: 794px;
  background-color: #ffffff;
  color: #0f172a;
  border-collapse: collapse;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.pdf-print-wrapper td {
  padding: 0;
}

.pdf-header {
  border-bottom: 2px solid #0f172a;
  padding: 16px 24px 8px 24px;
  margin-bottom: 12px;
}

.pdf-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pdf-logo-img {
  height: 54px;
  width: auto;
  object-fit: contain;
}

.pdf-address-container {
  text-align: right;
}

.pdf-hospital-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  margin: 0 0 2px 0;
  letter-spacing: 0.5px;
}

.pdf-hospital-info {
  font-size: 9px;
  color: #475569;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.pdf-title-badge {
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #0f172a;
  background-color: #f1f5f9;
  padding: 3.5px 18px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  display: inline-block;
  margin: 0;
}

.pdf-patient-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px 12px;
  background-color: #f8fafc;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  margin: 0 24px 12px 24px;
}

.pdf-info-lbl {
  font-size: 8.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
}

.pdf-info-val {
  font-size: 10.5px;
  font-weight: 700;
  color: #0f172a;
}

.pdf-diagnosis-box {
  background-color: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0 24px 11px 24px;
}

.pdf-diagnosis-lbl {
  font-size: 10px;
  font-weight: 800;
  color: #be123c;
  text-transform: uppercase;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.pdf-section {
  margin: 0 24px 11px 24px;
}

.pdf-section-title {
  font-size: 10px;
  font-weight: 800;
  color: #0f172a;
  border-bottom: 1.5px solid #94a3b8;
  padding-bottom: 3px;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pdf-section-content {
  font-size: 10px;
  color: #1e293b;
  line-height: 1.42;
  padding: 2px 2px;
}

.pdf-section-content :deep(h2) { font-size: 1.15em; font-weight: 700; margin: 0.3em 0 0.15em; }
.pdf-section-content :deep(h3) { font-size: 1.05em; font-weight: 600; margin: 0.3em 0 0.15em; }
.pdf-section-content :deep(ul) { list-style-type: disc; padding-left: 1.4em; margin: 0.3em 0; }
.pdf-section-content :deep(ol) { list-style-type: decimal; padding-left: 1.4em; margin: 0.3em 0; }
.pdf-section-content :deep(li) { margin: 0.1em 0; }
.pdf-section-content :deep(table) { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
.pdf-section-content :deep(th),
.pdf-section-content :deep(td) { border: 1px solid #cbd5e1; padding: 3px 6px; font-size: 9.5px; }
.pdf-section-content :deep(th) { background-color: #f8fafc; font-weight: bold; }
.pdf-section-content :deep(blockquote) { border-left: 3px solid #cbd5e1; padding-left: 0.8em; font-style: italic; margin: 0.3em 0; color: #475569; }

.pdf-footer-container {
  padding: 18px 24px 0 24px;
}

.pdf-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
}

.pdf-signature-box {
  text-align: center;
  width: 180px;
}

.pdf-signature-line {
  border-top: 1px solid #0f172a;
  padding-top: 4px;
  margin-top: 30px;
  font-weight: bold;
  font-size: 10px;
}
</style>
