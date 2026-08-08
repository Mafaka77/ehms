<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import logoUrl from '../../../assets/logo_final.png'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

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

const setDischargeDateToNow = () => {
  form.value.dischargeDate = getNowDateTimeString()
}

const form = ref({
  admissionId: props.admissionId,
  patientId: props.admission?.patientId?._id || props.admission?.patientId,
  consultantId: props.admission?.consultantDoctorId?._id || props.admission?.consultantDoctorId,
  dischargeDate: getNowDateTimeString(),
  dischargeType: 'NORMAL',
  finalDiagnosis: '',
  chiefComplaints: '',
  vitalsOnAdmission: {
    temperature: '',
    pulse: '',
    respiration: '',
    bp: '',
    oxygenSaturation: ''
  },
  clinicalFindings: '',
  clinicalCourse: '',
  medications: '',
  conditionAtDischarge: '',
  dischargeAdvice: '',
  followUpAdvice: '',
  remarks: '',
  status: 'DRAFT'
})

const loadSummary = async () => {
  loading.value = true
  try {
    const res = await admissionStore.fetchDischargeSummary(props.admissionId)
    if (res.success && res.data) {
      const d = res.data
      form.value.dischargeType = d.dischargeType || 'NORMAL'
      form.value.finalDiagnosis = d.finalDiagnosis || ''
      form.value.chiefComplaints = d.chiefComplaints || ''
      form.value.vitalsOnAdmission = {
        temperature: d.vitalsOnAdmission?.temperature || '',
        pulse: d.vitalsOnAdmission?.pulse || '',
        respiration: d.vitalsOnAdmission?.respiration || '',
        bp: d.vitalsOnAdmission?.bp || '',
        oxygenSaturation: d.vitalsOnAdmission?.oxygenSaturation || ''
      }
      form.value.clinicalFindings = d.clinicalFindings || ''
      form.value.clinicalCourse = d.clinicalCourse || ''
      form.value.medications = d.medications || ''
      form.value.conditionAtDischarge = d.conditionAtDischarge || ''
      form.value.dischargeAdvice = d.dischargeAdvice || ''
      form.value.followUpAdvice = d.followUpAdvice || ''
      form.value.remarks = d.remarks || ''
      form.value.status = d.status || 'DRAFT'

      if (d.dischargeDate) {
        form.value.dischargeDate = getNowDateTimeString(d.dischargeDate)
      } else {
        form.value.dischargeDate = getNowDateTimeString()
      }
    }
  } catch (error) {
    console.error('Failed to load discharge summary record:', error)
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

const saveSummary = async (targetStatus = null) => {
  saving.value = true
  if (targetStatus) {
    form.value.status = targetStatus
  }
  try {
    const res = await admissionStore.saveDischargeSummary(props.admissionId, form.value)
    if (res.success) {
      snackbarStore.show({ message: 'Discharge summary saved successfully!', type: 'success' })
      if (res.data) {
        form.value.status = res.data.status
      }
    } else {
      snackbarStore.show({ message: res.message || 'Failed to save discharge summary', type: 'error' })
    }
  } catch (error) {
    console.error(error)
    snackbarStore.show({ message: 'Failed to save discharge summary', type: 'error' })
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString) => {
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
  const iframe = document.querySelector('iframe[title="Discharge Summary PDF Preview"]')
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
    
    // Measure section boundaries relative to tbody for smart section breaks
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
    
    // Scale bodyAvailableSpace to canvas pixel height
    const availableSpacePx = Math.floor(bodyAvailableSpace / ratio)
    
    // Dynamically calculate page break Y offsets in canvas pixels
    const pageBreaks = [0]
    let currentY = 0
    
    while (currentY + availableSpacePx < bodyCanvasH) {
      let idealBreak = currentY + availableSpacePx
      
      // Check if idealBreak cuts through any section container
      const intersectingSection = sectionBounds.find(sec => sec.top < idealBreak && idealBreak < sec.bottom)
      
      if (intersectingSection) {
        // If the section can fit within an available page height, move break to section.top
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
      
      // Crop slice of body canvas for current page
      if (sliceCanvasH > 0) {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceCanvasH
        const ctx = sliceCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, startY + headerCanvasH, canvas.width, sliceCanvasH, 0, 0, canvas.width, sliceCanvasH)
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.98)
        
        pdf.addImage(sliceData, 'JPEG', 0, headerPdfH, pdfWidth, slicePdfH)
      }
      
      // Cover top overflow with solid white rectangle
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, headerPdfH, 'F')
      
      // Cover bottom overflow with solid white rectangle for footer signature area
      const totalBottomClearH = footerMarginH + (signaturePdfH > 0 ? signaturePdfH : 0)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, pageHeight - totalBottomClearH, pdfWidth, totalBottomClearH + 2, 'F')
      
      // Draw repeating header at the absolute top of every page
      pdf.addImage(headerData, 'JPEG', 0, 0, pdfWidth, headerPdfH)
      
      // Draw signature block fixed at the bottom of the LAST page only
      if (pageNum === totalPages && signatureData) {
        const sigY = pageHeight - footerMarginH - signaturePdfH
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, sigY - 1, pdfWidth, signaturePdfH + 2, 'F')
        pdf.addImage(signatureData, 'JPEG', 0, sigY, pdfWidth, signaturePdfH)
      }
      
      // Draw footer page number centered at the bottom (only when total pages > 1)
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
    const admNo = props.admission?.admissionNo || 'DischargeSummary'
    const filename = `${patientName}_${admNo}_DischargeSummary.pdf`
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
  const v = f.vitalsOnAdmission || {}

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Discharge Summary - ${patient.fullName || 'Patient'}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm 15mm 15mm 15mm;
            @bottom-center {
              content: "Page " counter(page);
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
            }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 0;
            margin: 0;
            color: #0f172a;
            line-height: 1.5;
            font-size: 12px;
            counter-reset: page;
          }
          
          .print-wrapper { width: 100%; border-collapse: collapse; }
          .print-header { display: table-header-group; }
          .print-footer { display: table-footer-group; }
          .print-body { display: table-row-group; }

          .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; width: 100%; }
          .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
          .logo-container { text-align: left; }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          .address-container { text-align: right; font-size: 10px; color: #475569; line-height: 1.4; }
          .hospital-name { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 2px 0; }
          .hospital-addr, .hospital-contact { margin: 0; font-weight: 500; }
          .header-title { text-align: center; margin-top: 4px; }
          .title-badge { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; background-color: #f1f5f9; padding: 4px 20px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; margin: 0; }
          
          .patient-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; }
          .info-block { font-size: 11px; }
          .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 9px; margin-bottom: 3px; letter-spacing: 0.3px; }
          .info-value { font-size: 11.5px; font-weight: 700; color: #0f172a; }

          .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; background: #fff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 18px; text-align: center; page-break-inside: avoid; break-inside: avoid; }
          .vital-item { background: #f1f5f9; padding: 8px; border-radius: 6px; }
          .vital-lbl { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .vital-val { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 3px; }

          .section { margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; }
          .section-title { font-size: 11.5px; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #94a3b8; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .section-content { font-size: 11px; color: #1e293b; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6; padding: 2px 0; }

          .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: 8px; margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; }
          .highlight-title { font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
          .highlight-content { font-size: 12px; font-weight: 700; color: #14532d; white-space: pre-wrap; line-height: 1.5; }

          .footer-container { padding-top: 20px; page-break-inside: avoid; break-inside: avoid; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #0f172a; padding-top: 4px; margin-top: 40px; font-weight: bold; font-size: 11px; }

          .page-number-box {
            display: none;
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-align: center;
          }
          body.has-multiple-pages .page-number-box {
            display: block;
          }
          .page-number::after {
            content: counter(page);
          }
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
                    <h1 class="title-badge">DISCHARGE SUMMARY</h1>
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
                    <div class="info-label">Patient Code</div>
                    <div class="info-value">${patient.patientCode || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Gender / Age</div>
                    <div class="info-value">${patient.gender || '-'}, ${patient.age || '-'} Yrs</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Address</div>
                    <div class="info-value">${patient.address || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">IPD Admission No</div>
                    <div class="info-value">${props.admission.admissionNo || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Admission Date</div>
                    <div class="info-value">${formatDate(props.admission.admissionDate)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Discharge Date</div>
                    <div class="info-value">${formatDate(f.dischargeDate)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Discharge Type</div>
                    <div class="info-value">${f.dischargeType}</div>
                  </div>
                  <div class="info-block" style="grid-column: span 2;">
                    <div class="info-label">Ward / Bed</div>
                    <div class="info-value">Bed ${bed.bedNo || '-'} (${ward.name || '-'})</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Consultant Doctor</div>
                    <div class="info-value">${doctor.fullName || 'Consultant'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Summary Status</div>
                    <div class="info-value">${f.status}</div>
                  </div>
                </div>

                <!-- Final Diagnosis -->
                <div class="highlight-box">
                  <div class="highlight-title">Final Diagnosis</div>
                  <div class="highlight-content">${f.finalDiagnosis || 'Not specified'}</div>
                </div>

                <!-- Chief Complaints -->
                <div class="section" v-if="f.chiefComplaints">
                  <div class="section-title">Chief Complaints</div>
                  <div class="section-content">${f.chiefComplaints || '—'}</div>
                </div>

                <!-- Admission Vitals -->
                <div class="section">
                  <div class="section-title">Vitals on Admission</div>
                  <div class="vitals-grid">
                    <div class="vital-item">
                      <div class="vital-lbl">Temperature</div>
                      <div class="vital-val">${v.temperature || '—'}</div>
                    </div>
                    <div class="vital-item">
                      <div class="vital-lbl">Pulse Rate</div>
                      <div class="vital-val">${v.pulse || '—'}</div>
                    </div>
                    <div class="vital-item">
                      <div class="vital-lbl">Respiration</div>
                      <div class="vital-val">${v.respiration || '—'}</div>
                    </div>
                    <div class="vital-item">
                      <div class="vital-lbl">Blood Pressure</div>
                      <div class="vital-val">${v.bp || '—'}</div>
                    </div>
                    <div class="vital-item">
                      <div class="vital-lbl">SpO2</div>
                      <div class="vital-val">${v.oxygenSaturation || '—'}</div>
                    </div>
                  </div>
                </div>

                <!-- Clinical Findings -->
                <div class="section" v-if="f.clinicalFindings">
                  <div class="section-title">Clinical Findings on Examination</div>
                  <div class="section-content">${f.clinicalFindings || '—'}</div>
                </div>

                <!-- Clinical Course -->
                <div class="section" v-if="f.clinicalCourse">
                  <div class="section-title">Clinical Course</div>
                  <div class="section-content">${f.clinicalCourse || '—'}</div>
                </div>

                <!-- Medications -->
                <div class="section" v-if="f.medications">
                  <div class="section-title">Medications</div>
                  <div class="section-content">${f.medications || '—'}</div>
                </div>

                <!-- Condition at Discharge -->
                <div class="section" v-if="f.conditionAtDischarge">
                  <div class="section-title">Condition at Discharge</div>
                  <div class="section-content">${f.conditionAtDischarge || '—'}</div>
                </div>

                <!-- Discharge Advice -->
                <div class="section">
                  <div class="section-title">Discharge Advice & Prescribed Treatment</div>
                  <div class="section-content">${f.dischargeAdvice || '—'}</div>
                </div>

                <!-- Follow-up Advice & Remarks -->
                <div class="section">
                  <div class="section-title">Follow-up Advice & Remarks</div>
                  <div class="section-content">${f.followUpAdvice || '—'} ${f.remarks ? '\n\nRemarks: ' + f.remarks : ''}</div>
                </div>

                <!-- Signature Section (Appears only on the final page at the end of document) -->
                <div class="footer-container">
                  <div class="footer">
                    <div>
                      <p style="font-size: 10px; color: #64748b; margin: 0;">Report Generated: ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div class="signature-box">
                      <div class="signature-line">${doctor.fullName || 'Consultant Doctor'}<br><span style="font-weight: normal; font-size: 10px; color: #64748b;">(Attending / Authorized Consultant)</span></div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot class="print-footer">
            <tr>
              <td style="padding-top: 10px;">
                <div class="page-number-box">
                  Page <span class="page-number"></span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
        <script>
          window.onload = function() {
            if (document.body.scrollHeight > 960) {
              document.body.classList.add('has-multiple-pages');
            }
            setTimeout(function() {
              window.print();
            }, 100);
          }
        <\/script>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
}
</script>

<template>
  <div class="space-y-6 pb-8">
    
    <!-- Action Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-slate-900 text-base">Inpatient Discharge Summary</h3>
          <span 
            class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
            :class="form.status === 'FINAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
          >
            {{ form.status }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Comprehensive clinical discharge record filled by the attending doctor.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button 
          type="button"
          @click="generateReportPDF"
          :disabled="printingPDF"
          class="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span v-if="printingPDF" class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent"></span>
          <svg v-else class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview PDF
        </button>

        <button 
          type="button"
          @click="saveSummary('DRAFT')"
          :disabled="saving"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Save Draft
        </button>

        <button 
          type="button"
          @click="saveSummary('FINAL')"
          :disabled="saving"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Finalize Summary
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400 space-y-2">
      <svg class="animate-spin h-6 w-6 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-xs font-semibold text-slate-600">Loading Discharge Summary...</p>
    </div>

    <!-- Main Doctor Form Container -->
    <div v-else class="space-y-6">

      <!-- Section 1: Discharge Meta & Type -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          1. Discharge Details &amp; Status
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <!-- Discharge Date -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-700">Discharge Date &amp; Time <span class="text-rose-500">*</span></label>
              <button 
                type="button"
                @click="setDischargeDateToNow"
                class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                title="Set to current date and time"
              >
                Set to Now
              </button>
            </div>
            <input 
              type="datetime-local" 
              v-model="form.dischargeDate"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <!-- Discharge Type -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Discharge Type <span class="text-rose-500">*</span></label>
            <select 
              v-model="form.dischargeType"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50 cursor-pointer"
            >
              <option value="NORMAL">Normal Discharge</option>
              <option value="LAMA">LAMA (Left Against Medical Advice)</option>
              <option value="DAMA">DAMA (Discharge Against Medical Advice)</option>
              <option value="REFERRED">Referred to Higher Center</option>
              <option value="EXPIRED">Expired / Deceased</option>
            </select>
          </div>

          <!-- Document Status -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Document Status</label>
            <select 
              v-model="form.status"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 bg-slate-50/50 cursor-pointer"
            >
              <option value="DRAFT">Draft Mode</option>
              <option value="FINAL">Finalized &amp; Locked</option>
            </select>
          </div>
        </div>
      </div>
      <!-- Section 3: Clinical Diagnosis & Complaints -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          3. Diagnosis &amp; Clinical Presentation
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Final Diagnosis -->
          <div class="space-y-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <label class="font-extrabold text-emerald-900 uppercase tracking-wider text-[11px] block">Final Diagnosis <span class="text-rose-500">*</span></label>
            <textarea 
              v-model="form.finalDiagnosis"
              rows="2"
              placeholder="Enter definitive final diagnosis..."
              class="w-full p-3 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-900 bg-white"
            ></textarea>
          </div>

          <!-- Chief Complaints -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Chief Complaints on Admission</label>
            <textarea 
              v-model="form.chiefComplaints"
              rows="2"
              placeholder="Enter chief complaints leading to admission..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

      
        </div>
      </div>
      <!-- Section 2: Vitals on Admission -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          2. Vitals Recorded on Admission
        </h4>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Temperature</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.temperature"
              placeholder="e.g. 98.6 °F"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Pulse Rate</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.pulse"
              placeholder="e.g. 78 bpm"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Respiration</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.respiration"
              placeholder="e.g. 18 /min"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1">
            <label class="font-semibold text-slate-600">Blood Pressure</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.bp"
              placeholder="e.g. 120/80 mmHg"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div class="space-y-1 col-span-2 sm:col-span-1">
            <label class="font-semibold text-slate-600">SpO2 (Oxygen)</label>
            <input 
              type="text"
              v-model="form.vitalsOnAdmission.oxygenSaturation"
              placeholder="e.g. 98%"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>
        </div>
      </div>



      <!-- Section 4: Clinical Findings & Hospital Course -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          4. Examination, Investigations &amp; Condition
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Clinical Findings -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Clinical Findings on Examination</label>
            <textarea 
              v-model="form.clinicalFindings"
              rows="3"
              placeholder="Physical examination findings, systemic evaluation..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Clinical Course -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Clinical Course</label>
            <textarea 
              v-model="form.clinicalCourse"
              rows="3"
              placeholder="..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
            <!-- Medications -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Medications</label>
            <textarea 
              v-model="form.medications"
              rows="3"
              placeholder="..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
          <!-- Condition at Discharge -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Condition of Patient at Discharge</label>
            <textarea 
              v-model="form.conditionAtDischarge"
              rows="2"
              placeholder="e.g. Patient is afebrile, clinically stable, wound clean and intact..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Section 5: Discharge Advice & Follow-up -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-2 border-b border-slate-100 pb-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          5. Discharge Advice, Medications &amp; Follow-up
        </h4>

        <div class="space-y-4 text-xs">
          <!-- Discharge Advice -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Discharge Advice &amp; Prescribed Treatment / Medications <span class="text-rose-500">*</span></label>
            <textarea 
              v-model="form.dischargeAdvice"
              rows="4"
              placeholder="List discharge medications with dosage, frequency, dietary advice, and activity restrictions..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Follow-up Advice -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Follow-up Advice &amp; Instructions</label>
            <textarea 
              v-model="form.followUpAdvice"
              rows="2"
              placeholder="When to return for OPD follow-up or suture removal..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Remarks -->
          <div class="space-y-1">
            <label class="font-bold text-slate-700">Special Remarks / Emergency Warning Instructions</label>
            <textarea 
              v-model="form.remarks"
              rows="2"
              placeholder="Emergency contact instructions or special precautions..."
              class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50"
            ></textarea>
          </div>
        </div>
      </div>

    </div>

    <!-- Offscreen Printable Container for html2canvas PDF generation -->
    <div class="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
      <div ref="printReportContainer" class="pdf-report-card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <td>
                <div class="pdf-header">
                  <div class="pdf-header-top">
                    <div>
                      <img :src="logoUrl" alt="Logo" style="height: 56px; width: auto; object-fit: contain;" />
                    </div>
                    <div style="text-align: right;">
                      <p class="pdf-hospital-name">EMMANUEL HOSPITAL</p>
                      <p class="pdf-hospital-info">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                      <p class="pdf-hospital-info">Phone: 0389-2913340 / 8974326872</p>
                    </div>
                  </div>
                  <div style="text-align: center; margin-top: 4px;">
                    <h1 class="pdf-title-badge">DISCHARGE SUMMARY</h1>
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
                    <div class="pdf-info-lbl">Patient Code</div>
                    <div class="pdf-info-val">{{ admission?.patientId?.patientCode || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Gender / Age</div>
                    <div class="pdf-info-val">{{ admission?.patientId?.gender || '-' }}, {{ admission?.patientId?.age || '-' }} Yrs</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Address</div>
                    <div class="pdf-info-val">{{ admission?.patientId?.address || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">IPD Admission No</div>
                    <div class="pdf-info-val">{{ admission?.admissionNo || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Admission Date</div>
                    <div class="pdf-info-val">{{ formatDate(admission?.admissionDate) }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Discharge Date</div>
                    <div class="pdf-info-val">{{ formatDate(form.dischargeDate) }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Discharge Type</div>
                    <div class="pdf-info-val">{{ form.dischargeType }}</div>
                  </div>
                  <div style="grid-column: span 2;">
                    <div class="pdf-info-lbl">Ward / Bed</div>
                    <div class="pdf-info-val">Bed {{ admission?.bedId?.bedNo || '-' }} ({{ admission?.bedId?.wardId?.name || '-' }})</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Consultant Doctor</div>
                    <div class="pdf-info-val">{{ admission?.consultantDoctorId?.fullName || 'Consultant' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Summary Status</div>
                    <div class="pdf-info-val">{{ form.status }}</div>
                  </div>
                </div>

                <!-- Final Diagnosis -->
                <div class="pdf-diagnosis-box">
                  <div class="pdf-diagnosis-lbl">Final Diagnosis</div>
                  <div class="pdf-diagnosis-val">{{ form.finalDiagnosis || 'Not specified' }}</div>
                </div>

                <!-- Chief Complaints -->
                <div v-if="form.chiefComplaints" class="pdf-section">
                  <div class="pdf-section-title">Chief Complaints</div>
                  <div class="pdf-section-content">{{ form.chiefComplaints }}</div>
                </div>

                <!-- Admission Vitals -->
                <div class="pdf-section">
                  <div class="pdf-section-title">Vitals on Admission</div>
                  <div class="pdf-vitals-grid">
                    <div class="pdf-vital-item">
                      <div class="pdf-vital-lbl">Temperature</div>
                      <div class="pdf-vital-val">{{ form.vitalsOnAdmission?.temperature || '—' }}</div>
                    </div>
                    <div class="pdf-vital-item">
                      <div class="pdf-vital-lbl">Pulse Rate</div>
                      <div class="pdf-vital-val">{{ form.vitalsOnAdmission?.pulse || '—' }}</div>
                    </div>
                    <div class="pdf-vital-item">
                      <div class="pdf-vital-lbl">Respiration</div>
                      <div class="pdf-vital-val">{{ form.vitalsOnAdmission?.respiration || '—' }}</div>
                    </div>
                    <div class="pdf-vital-item">
                      <div class="pdf-vital-lbl">Blood Pressure</div>
                      <div class="pdf-vital-val">{{ form.vitalsOnAdmission?.bp || '—' }}</div>
                    </div>
                    <div class="pdf-vital-item">
                      <div class="pdf-vital-lbl">SpO2</div>
                      <div class="pdf-vital-val">{{ form.vitalsOnAdmission?.oxygenSaturation || '—' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Clinical Findings -->
                <div v-if="form.clinicalFindings" class="pdf-section">
                  <div class="pdf-section-title">Clinical Findings on Examination</div>
                  <div class="pdf-section-content">{{ form.clinicalFindings }}</div>
                </div>

                <!-- Clinical Course -->
                <div v-if="form.clinicalCourse" class="pdf-section">
                  <div class="pdf-section-title">Clinical Course</div>
                  <div class="pdf-section-content">{{ form.clinicalCourse }}</div>
                </div>

                <!-- Medications -->
                <div v-if="form.medications" class="pdf-section">
                  <div class="pdf-section-title">Medications</div>
                  <div class="pdf-section-content">{{ form.medications }}</div>
                </div>

                <!-- Condition at Discharge -->
                <div v-if="form.conditionAtDischarge" class="pdf-section">
                  <div class="pdf-section-title">Condition at Discharge</div>
                  <div class="pdf-section-content">{{ form.conditionAtDischarge }}</div>
                </div>

                <!-- Discharge Advice -->
                <div class="pdf-section">
                  <div class="pdf-section-title">Discharge Advice & Prescribed Treatment</div>
                  <div class="pdf-section-content">{{ form.dischargeAdvice || '—' }}</div>
                </div>

                <!-- Follow-up Advice & Remarks -->
                <div class="pdf-section">
                  <div class="pdf-section-title">Follow-up Advice & Remarks</div>
                  <div class="pdf-section-content">{{ form.followUpAdvice || '—' }} {{ form.remarks ? '\n\nRemarks: ' + form.remarks : '' }}</div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 24px; padding-bottom: 8px;">
                <!-- Signature Block -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                  <p style="font-size: 10px; color: #64748b; margin: 0;">Report Generated: {{ new Date().toLocaleString('en-IN') }}</p>
                  <div style="text-align: center; width: 220px;">
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-size: 11px;">
                      {{ admission?.consultantDoctorId?.fullName || 'Consultant Doctor' }}<br>
                      <span style="font-weight: normal; font-size: 10px; color: #64748b;">(Attending / Authorized Consultant)</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- PDF Real Preview Modal (Viewable like ReportModal.vue) -->
    <Teleport to="body">
      <div v-if="showPdfModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closePdfModal"></div>

        <!-- Modal Box -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden z-10">
          
          <!-- Header -->
          <div class="p-4 bg-slate-900 text-white flex justify-between items-center px-6">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-sm text-white">Discharge Summary PDF Preview</h3>
                <p class="text-xs text-slate-400 font-mono">{{ currentFilename }}</p>
              </div>
            </div>
            <button @click="closePdfModal" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- PDF Viewable Iframe -->
          <div class="flex-grow bg-slate-700 relative min-h-0">
            <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs z-10">
              <div class="flex flex-col items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-700">
                <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></span>
                <span class="text-white font-medium text-xs">Generating PDF Preview...</span>
              </div>
            </div>
            <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="w-full h-full border-0" title="Discharge Summary PDF Preview"></iframe>
          </div>

          <!-- Action Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-6">
            <button 
              @click="closePdfModal"
              class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close Preview
            </button>
            
            <div class="flex gap-3">
              <a 
                v-if="pdfPreviewUrl" 
                :href="pdfPreviewUrl" 
                :download="currentFilename" 
                class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
              
              <button 
                @click="printPdfFromIframe"
                class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* Scoped custom styling using standard hex colors to bypass Tailwind v4 oklch() space collapsing issue in html2canvas-pro */
.pdf-report-card {
  width: 794px;
  background-color: #ffffff;
  color: #0f172a;
  padding: 32px 48px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
  line-height: 1.5;
  font-size: 12px;
}

.pdf-header {
  border-bottom: 2px solid #0f172a;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.pdf-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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
  font-size: 10px;
  color: #475569;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.pdf-title-badge {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #0f172a;
  background-color: #f1f5f9;
  padding: 4px 20px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  display: inline-block;
  margin: 0;
}

.pdf-patient-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  background-color: #f8fafc;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  margin-bottom: 18px;
}

.pdf-info-lbl {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 3px;
  letter-spacing: 0.3px;
}

.pdf-info-val {
  font-size: 11.5px;
  font-weight: 700;
  color: #0f172a;
}

.pdf-diagnosis-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 18px;
}

.pdf-diagnosis-lbl {
  font-size: 11px;
  font-weight: 800;
  color: #166534;
  text-transform: uppercase;
  margin-bottom: 5px;
  letter-spacing: 0.5px;
}

.pdf-diagnosis-val {
  font-size: 12px;
  font-weight: 700;
  color: #14532d;
  white-space: pre-wrap;
  line-height: 1.5;
}

.pdf-vitals-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background-color: #ffffff;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 18px;
  text-align: center;
}

.pdf-vital-item {
  background-color: #f1f5f9;
  padding: 8px;
  border-radius: 6px;
}

.pdf-vital-lbl {
  font-size: 9px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.pdf-vital-val {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 3px;
}

.pdf-section {
  margin-bottom: 18px;
}

.pdf-section-title {
  font-size: 11.5px;
  font-weight: 800;
  color: #0f172a;
  border-bottom: 1.5px solid #94a3b8;
  padding-bottom: 4px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pdf-section-content {
  font-size: 11px;
  color: #1e293b;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  padding: 2px 0;
}
</style>
