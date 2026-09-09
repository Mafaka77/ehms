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

const getNowDateString = (dateInput = null) => {
  const now = dateInput ? new Date(dateInput) : new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const defaultAdviceList = [
  'Vitamin D3 400 IU drop 1ml nikhatah vawi-1 (Kum 1- thleng)',
  'Thla 6 chhung hnute tui chauh pek tur. Tui/ORS pek loh tur.',
  'Vaccine a hun taka pek zel tur.',
  'Kum 2 tlin hma chu phone, TV, etc engmah entir loh tur.'
]

const form = ref({
  admissionId: props.admissionId,
  patientId: props.admission?.patientId?._id || props.admission?.patientId,
  consultantId: props.admission?.consultantDoctorId?._id || props.admission?.consultantDoctorId,
  dischargeDate: getNowDateTimeString(),
  
  // Birth & Delivery Details
  deliveryType: 'NVD',
  deliveryDateTime: getNowDateTimeString(props.admission?.admissionDate),
  babyStatusAtBirth: 'LIVE',
  sex: props.admission?.patientId?.gender === 'Female' ? 'FEMALE' : (props.admission?.patientId?.gender === 'Male' ? 'MALE' : ''),
  birthWeightKg: null,
  babyCried: 'CRIED_IMMEDIATELY',
  apgar1Min: 9,
  apgar5Min: 10,
  dcc: 'DONE',
  resuscitationRequired: false,
  resuscitationDetails: '',
  congenitalAnomalyPresent: false,
  congenitalAnomalyDetails: '',
  liquorStatus: 'CLEAR',
  
  // Vaccines
  birthDoseVaccines: {
    hepB: { given: true, date: getNowDateString() },
    bcg: { given: true, date: getNowDateString() },
    opv: { given: true, date: getNowDateString() }
  },

  // Fever & Sepsis
  developedFever: false,
  feverDate: '',
  sepsisScreen: 'NEGATIVE',
  antibiotics: {
    given: false,
    route: 'IV',
    days: null,
    details: ''
  },

  // Icterus
  developedIcterus: false,
  icterusTcbTsb: '',
  phototherapy: { given: false, date: '' },
  exchangeTransfusion: { given: false, date: '' },

  // Feeding & Hydration
  feedingProblem: false,
  feedingProblemDueTo: '',
  dehydration: false,
  dehydrationCorrectedWith: '',
  feedingType: 'EXCLUSIVE_BREASTFEEDING',

  // Other Events
  otherSignificantEvents: '',

  // Discharge Status & Condition
  dischargeType: 'WITH_MEDICAL_ADVICE',
  conditionAtDischarge: {
    isActive: true,
    feedsWell: true,
    noFever: true,
    icterus: '',
    tcbTsbValue: '',
    weightKg: null,
    lengthCm: null,
    headCircumferenceCm: null
  },

  // Advice & Follow Up
  advice: [...defaultAdviceList],
  followUp: {
    reviewDate: '',
    reviewTime: '11:00 AM',
    reviewLocation: 'Paediatric OPD or SOS'
  },

  remarks: '',
  status: 'DRAFT'
})

const newAdviceInput = ref('')
const addAdvice = () => {
  if (newAdviceInput.value.trim()) {
    form.value.advice.push(newAdviceInput.value.trim())
    newAdviceInput.value = ''
  }
}
const removeAdvice = (index) => {
  form.value.advice.splice(index, 1)
}
const resetDefaultAdvice = () => {
  form.value.advice = [...defaultAdviceList]
}

const loadSummary = async () => {
  loading.value = true
  try {
    const res = await admissionStore.fetchNewbornDischargeSummary(props.admissionId)
    if (res.success && res.data) {
      const d = res.data
      form.value.deliveryType = d.deliveryType || 'NVD'
      form.value.deliveryDateTime = d.deliveryDateTime ? getNowDateTimeString(d.deliveryDateTime) : getNowDateTimeString(props.admission?.admissionDate)
      form.value.babyStatusAtBirth = d.babyStatusAtBirth || 'LIVE'
      form.value.sex = d.sex || (props.admission?.patientId?.gender === 'Female' ? 'FEMALE' : (props.admission?.patientId?.gender === 'Male' ? 'MALE' : ''))
      form.value.birthWeightKg = d.birthWeightKg !== undefined ? d.birthWeightKg : null
      form.value.babyCried = d.babyCried || 'CRIED_IMMEDIATELY'
      form.value.apgar1Min = d.apgar1Min !== undefined ? d.apgar1Min : 9
      form.value.apgar5Min = d.apgar5Min !== undefined ? d.apgar5Min : 10
      form.value.dcc = d.dcc || 'DONE'
      form.value.resuscitationRequired = !!d.resuscitationRequired
      form.value.resuscitationDetails = d.resuscitationDetails || ''
      form.value.congenitalAnomalyPresent = !!d.congenitalAnomalyPresent
      form.value.congenitalAnomalyDetails = d.congenitalAnomalyDetails || ''
      form.value.liquorStatus = d.liquorStatus || 'CLEAR'

      form.value.birthDoseVaccines = {
        hepB: {
          given: d.birthDoseVaccines?.hepB?.given ?? true,
          date: d.birthDoseVaccines?.hepB?.date ? getNowDateString(d.birthDoseVaccines.hepB.date) : getNowDateString()
        },
        bcg: {
          given: d.birthDoseVaccines?.bcg?.given ?? true,
          date: d.birthDoseVaccines?.bcg?.date ? getNowDateString(d.birthDoseVaccines.bcg.date) : getNowDateString()
        },
        opv: {
          given: d.birthDoseVaccines?.opv?.given ?? true,
          date: d.birthDoseVaccines?.opv?.date ? getNowDateString(d.birthDoseVaccines.opv.date) : getNowDateString()
        }
      }

      form.value.developedFever = !!d.developedFever
      form.value.feverDate = d.feverDate ? getNowDateString(d.feverDate) : ''
      form.value.sepsisScreen = d.sepsisScreen || 'NEGATIVE'
      form.value.antibiotics = {
        given: !!d.antibiotics?.given,
        route: d.antibiotics?.route || 'IV',
        days: d.antibiotics?.days !== undefined ? d.antibiotics.days : null,
        details: d.antibiotics?.details || ''
      }

      form.value.developedIcterus = !!d.developedIcterus
      form.value.icterusTcbTsb = d.icterusTcbTsb || ''
      form.value.phototherapy = {
        given: !!d.phototherapy?.given,
        date: d.phototherapy?.date ? getNowDateString(d.phototherapy.date) : ''
      }
      form.value.exchangeTransfusion = {
        given: !!d.exchangeTransfusion?.given,
        date: d.exchangeTransfusion?.date ? getNowDateString(d.exchangeTransfusion.date) : ''
      }

      form.value.feedingProblem = !!d.feedingProblem
      form.value.feedingProblemDueTo = d.feedingProblemDueTo || ''
      form.value.dehydration = !!d.dehydration
      form.value.dehydrationCorrectedWith = d.dehydrationCorrectedWith || ''
      form.value.feedingType = d.feedingType || 'EXCLUSIVE_BREASTFEEDING'

      form.value.otherSignificantEvents = d.otherSignificantEvents || ''
      form.value.dischargeType = d.dischargeType || 'WITH_MEDICAL_ADVICE'
      form.value.dischargeDate = d.dischargeDate ? getNowDateTimeString(d.dischargeDate) : getNowDateTimeString()

      form.value.conditionAtDischarge = {
        isActive: d.conditionAtDischarge?.isActive ?? true,
        feedsWell: d.conditionAtDischarge?.feedsWell ?? true,
        noFever: d.conditionAtDischarge?.noFever ?? true,
        icterus: d.conditionAtDischarge?.icterus || '',
        tcbTsbValue: d.conditionAtDischarge?.tcbTsbValue || '',
        weightKg: d.conditionAtDischarge?.weightKg !== undefined ? d.conditionAtDischarge.weightKg : null,
        lengthCm: d.conditionAtDischarge?.lengthCm !== undefined ? d.conditionAtDischarge.lengthCm : null,
        headCircumferenceCm: d.conditionAtDischarge?.headCircumferenceCm !== undefined ? d.conditionAtDischarge.headCircumferenceCm : null
      }

      if (Array.isArray(d.advice) && d.advice.length > 0) {
        form.value.advice = [...d.advice]
      } else {
        form.value.advice = [...defaultAdviceList]
      }

      form.value.followUp = {
        reviewDate: d.followUp?.reviewDate ? getNowDateString(d.followUp.reviewDate) : '',
        reviewTime: d.followUp?.reviewTime || '11:00 AM',
        reviewLocation: d.followUp?.reviewLocation || 'Paediatric OPD or SOS'
      }

      form.value.remarks = d.remarks || ''
      form.value.status = d.status || 'DRAFT'
    }
  } catch (error) {
    console.error('Failed to load newborn discharge summary:', error)
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
    const res = await admissionStore.saveNewbornDischargeSummary(props.admissionId, form.value)
    if (res.success) {
      snackbarStore.show({ message: 'Newborn discharge summary saved successfully!', type: 'success' })
      if (res.data) {
        form.value.status = res.data.status
      }
    } else {
      snackbarStore.show({ message: res.message || 'Failed to save newborn discharge summary', type: 'error' })
    }
  } catch (error) {
    console.error(error)
    snackbarStore.show({ message: 'Failed to save newborn discharge summary', type: 'error' })
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

// PDF Export & Printing
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
  const iframe = document.querySelector('iframe[title="Newborn Discharge Summary PDF Preview"]')
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
    
    const patientName = props.admission?.patientId?.fullName?.replace(/\s+/g, '_') || 'Baby'
    const admNo = props.admission?.admissionNo || 'NewbornSummary'
    const filename = `${patientName}_${admNo}_Newborn_Discharge_Summary.pdf`
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

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Newborn Discharge Summary - ${patient.fullName || 'Baby'}</title>
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

          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; width: 100%; }
          .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
          .logo-container { text-align: left; }
          .logo-img { height: 54px; width: auto; object-fit: contain; }
          .address-container { text-align: right; font-size: 9px; color: #475569; line-height: 1.4; }
          .hospital-name { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px; }
          .hospital-addr, .hospital-contact { margin: 0; font-weight: 500; }
          .header-title { text-align: center; margin-top: 4px; }
          .title-badge { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; background-color: #f1f5f9; padding: 3.5px 18px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; margin: 0; }
          
          .patient-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 12px; page-break-inside: avoid; }
          .info-block { font-size: 10px; }
          .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 8.5px; margin-bottom: 2px; letter-spacing: 0.3px; }
          .info-value { font-size: 10.5px; font-weight: 700; color: #0f172a; }

          .section { margin-bottom: 11px; page-break-inside: avoid; }
          .section-title { font-size: 10px; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #94a3b8; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }

          .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; margin-bottom: 11px; page-break-inside: avoid; }
          .highlight-title { font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }

          .table-clean { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
          .table-clean td { padding: 3px 5px; border-bottom: 1px solid #f1f5f9; font-size: 10px; line-height: 1.38; vertical-align: top; }
          .td-lbl { width: 22%; font-weight: 700; color: #475569; }
          .td-val { width: 28%; color: #0f172a; font-weight: 600; }

          .advice-list { margin: 3px 0 5px 16px; padding: 0; }
          .advice-list li { margin-bottom: 2.5px; font-size: 10px; color: #1e293b; font-weight: 600; line-height: 1.38; }

          .footer-container { padding-top: 16px; page-break-inside: avoid; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; }
          .signature-box { text-align: center; width: 180px; }
          .signature-line { border-top: 1px solid #0f172a; padding-top: 4px; margin-top: 28px; font-weight: bold; font-size: 10px; }
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
                    <h1 class="title-badge">DISCHARGE SUMMARY FOR NEWBORN</h1>
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
                    <div class="info-label">Patient / Baby Name</div>
                    <div class="info-value">${patient.fullName || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">IPD Admission No</div>
                    <div class="info-value">${props.admission?.admissionNo || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Sex / Status</div>
                    <div class="info-value">${f.sex || patient.gender || '-'} (${f.babyStatusAtBirth || 'LIVE'})</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Address</div>
                    <div class="info-value">${patient.address || '-'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Admission Date</div>
                    <div class="info-value">${formatDate(props.admission?.admissionDate)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Delivery Date &amp; Time</div>
                    <div class="info-value">${formatDateTime(f.deliveryDateTime)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Discharge Date</div>
                    <div class="info-value">${formatDateTime(f.dischargeDate)}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Delivery Mode</div>
                    <div class="info-value">${f.deliveryType || 'NVD'}</div>
                  </div>
                  <div class="info-block">
                    <div class="info-label">Birth Weight</div>
                    <div class="info-value">${f.birthWeightKg ? f.birthWeightKg + ' kg' : '-'}</div>
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
                    <div class="info-label">Summary Status</div>
                    <div class="info-value">${f.status}</div>
                  </div>
                </div>

                <!-- 1. Birth & Neonatal Assessment -->
                <div class="section">
                  <div class="section-title">1. Birth &amp; Neonatal Assessment</div>
                  <table class="table-clean">
                    <tr>
                      <td class="td-lbl">Baby Cried at Birth:</td>
                      <td class="td-val">${f.babyCried === 'CRIED_IMMEDIATELY' ? 'Cried Immediately' : 'Did Not Cry'}</td>
                      <td class="td-lbl">Apgar Score:</td>
                      <td class="td-val">1 min: <strong>${f.apgar1Min ?? '-'}/10</strong> &nbsp;|&nbsp; 5 mins: <strong>${f.apgar5Min ?? '-'}/10</strong></td>
                    </tr>
                    <tr>
                      <td class="td-lbl">Delayed Cord Clamping:</td>
                      <td class="td-val">${f.dcc === 'DONE' ? 'Done' : 'Not Done'}</td>
                      <td class="td-lbl">Liquor Status:</td>
                      <td class="td-val">${f.liquorStatus === 'MECONIUM_STAINED' ? 'Meconium Stained' : 'Clear'}</td>
                    </tr>
                    <tr>
                      <td class="td-lbl">Resuscitation:</td>
                      <td class="td-val">${f.resuscitationRequired ? 'Given (' + (f.resuscitationDetails || 'Standard Protocol') + ')' : 'Not Required'}</td>
                      <td class="td-lbl">Congenital Anomaly:</td>
                      <td class="td-val">${f.congenitalAnomalyPresent ? 'Present (' + (f.congenitalAnomalyDetails || '-') + ')' : 'Absent'}</td>
                    </tr>
                    <tr>
                      <td class="td-lbl">Birth Dose Vaccines:</td>
                      <td class="td-val" colspan="3">
                        HepB: <strong>${f.birthDoseVaccines?.hepB?.given ? 'Given (' + formatDate(f.birthDoseVaccines.hepB.date) + ')' : 'Not Given'}</strong> &nbsp;|&nbsp;
                        BCG: <strong>${f.birthDoseVaccines?.bcg?.given ? 'Given (' + formatDate(f.birthDoseVaccines.bcg.date) + ')' : 'Not Given'}</strong> &nbsp;|&nbsp;
                        OPV: <strong>${f.birthDoseVaccines?.opv?.given ? 'Given (' + formatDate(f.birthDoseVaccines.opv.date) + ')' : 'Not Given'}</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- 2. Clinical Course & Neonatal Observations -->
                <div class="section">
                  <div class="section-title">2. Clinical Course &amp; Neonatal Observations</div>
                  <table class="table-clean">
                    <tr>
                      <td class="td-lbl">Developed Fever:</td>
                      <td class="td-val">${f.developedFever ? 'Yes (' + formatDate(f.feverDate) + ')' : 'No'}</td>
                      <td class="td-lbl">Sepsis Screen:</td>
                      <td class="td-val">${f.sepsisScreen || 'Not Done'}</td>
                    </tr>
                    ${f.antibiotics?.given ? `
                    <tr>
                      <td class="td-lbl">Antibiotics:</td>
                      <td class="td-val" colspan="3">${f.antibiotics.route || 'IV'} - ${f.antibiotics.days || 0} days ${f.antibiotics.details ? '(' + f.antibiotics.details + ')' : ''}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td class="td-lbl">Developed Icterus:</td>
                      <td class="td-val">${f.developedIcterus ? 'Yes (TCB/TSB: ' + (f.icterusTcbTsb || '-') + ')' : 'No'}</td>
                      <td class="td-lbl">Feeding Type:</td>
                      <td class="td-val">${f.feedingType === 'EXCLUSIVE_BREASTFEEDING' ? 'Exclusive Breastfeeding' : 'Mix Feeding'}</td>
                    </tr>
                    ${f.developedIcterus ? `
                    <tr>
                      <td class="td-lbl">Phototherapy / Exch.:</td>
                      <td class="td-val" colspan="3">Phototherapy: ${f.phototherapy?.given ? 'Yes (' + formatDate(f.phototherapy.date) + ')' : 'No'} &nbsp;|&nbsp; Exchange Transfusion: ${f.exchangeTransfusion?.given ? 'Yes (' + formatDate(f.exchangeTransfusion.date) + ')' : 'No'}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td class="td-lbl">Feeding Problem:</td>
                      <td class="td-val">${f.feedingProblem ? 'Yes (' + (f.feedingProblemDueTo || 'Reported') + ')' : 'No'}</td>
                      <td class="td-lbl">Dehydration:</td>
                      <td class="td-val">${f.dehydration ? 'Yes (Corrected with ' + (f.dehydrationCorrectedWith || 'Fluids') + ')' : 'No'}</td>
                    </tr>
                    ${f.otherSignificantEvents ? `
                    <tr>
                      <td class="td-lbl">Other Significant Events:</td>
                      <td class="td-val" colspan="3">${f.otherSignificantEvents}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                <!-- 3. Condition at Discharge -->
                <div class="highlight-box">
                  <div class="highlight-title">3. Condition on Discharge</div>
                  <table class="table-clean" style="margin-bottom: 0;">
                    <tr>
                      <td class="td-lbl" style="color: #14532d;">General Activity:</td>
                      <td class="td-val" style="color: #14532d;">${f.conditionAtDischarge?.isActive ? 'Active & alert' : 'Subdued'}</td>
                      <td class="td-lbl" style="color: #14532d;">Feeding &amp; Fever:</td>
                      <td class="td-val" style="color: #14532d;">${f.conditionAtDischarge?.feedsWell ? 'Feeds well' : 'Poor feed'}, ${f.conditionAtDischarge?.noFever ? 'No fever' : 'Feverish'}</td>
                    </tr>
                    <tr>
                      <td class="td-lbl" style="color: #14532d;">Icterus (TCB/TSB):</td>
                      <td class="td-val" style="color: #14532d;">${f.conditionAtDischarge?.tcbTsbValue ? f.conditionAtDischarge.tcbTsbValue : (f.conditionAtDischarge?.icterus || 'None')}</td>
                      <td class="td-lbl" style="color: #14532d;">Discharge Weight:</td>
                      <td class="td-val" style="color: #14532d;"><strong>${f.conditionAtDischarge?.weightKg ? f.conditionAtDischarge.weightKg + ' kg' : '-'}</strong></td>
                    </tr>
                    <tr>
                      <td class="td-lbl" style="color: #14532d;">Length / Head Circ.:</td>
                      <td class="td-val" style="color: #14532d;">${f.conditionAtDischarge?.lengthCm ? f.conditionAtDischarge.lengthCm + ' cm' : '-'} &nbsp;|&nbsp; ${f.conditionAtDischarge?.headCircumferenceCm ? f.conditionAtDischarge.headCircumferenceCm + ' cm' : '-'}</td>
                      <td class="td-lbl" style="color: #14532d;">Discharge Mode:</td>
                      <td class="td-val" style="color: #14532d;">${f.dischargeType === 'ON_REQUEST' ? 'Discharged on Request' : 'With Medical Advice'}</td>
                    </tr>
                  </table>
                </div>

                <!-- 4. Discharge Advice -->
                <div class="section">
                  <div class="section-title">4. Discharge Advice</div>
                  <ol class="advice-list">
                    ${f.advice.map(item => `<li>${item}</li>`).join('')}
                  </ol>
                </div>

                <!-- 5. Follow-up & Review -->
                <div class="section">
                  <div class="section-title">5. Follow-up &amp; Review</div>
                  <table class="table-clean">
                    <tr>
                      <td class="td-lbl">Review Date:</td>
                      <td class="td-val"><strong>${formatDate(f.followUp?.reviewDate)} @ ${f.followUp?.reviewTime || '11:00 AM'}</strong></td>
                      <td class="td-lbl">Location / Clinic:</td>
                      <td class="td-val"><strong>${f.followUp?.reviewLocation || 'Paediatric OPD or SOS'}</strong></td>
                    </tr>
                  </table>
                </div>

                <!-- Signature Section -->
                <div class="footer-container">
                  <div class="footer">
                    <div>
                      <p style="font-size: 8.5px; color: #64748b; margin: 0;">Report Generated: ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div class="signature-box">
                      <div class="signature-line">${doctor.fullName || 'Consultant Doctor'}<br><span style="font-weight: normal; font-size: 8.5px; color: #64748b;">(Attending / Authorized Consultant)</span></div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          }
        <\/script>
      </body>
    </html>
  `

  const printWin = window.open('', '_blank')
  printWin.document.write(printContent)
  printWin.document.close()
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Action Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-slate-900 text-base">Newborn Discharge Summary</h3>
          <span 
            class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
            :class="form.status === 'FINAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
          >
            {{ form.status }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Clinical birth register, neonatal assessment, vaccination, and paediatric discharge advice.</p>
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
          Finalize Summary
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <svg class="animate-spin h-10 w-10 text-teal-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <span class="text-sm font-semibold">Loading newborn record...</span>
    </div>

    <!-- Form Content -->
    <div v-else class="space-y-6">
      <!-- SECTION 1: Delivery & Birth Details -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
          1. Birth &amp; Delivery Details
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Delivered Through</label>
            <select v-model="form.deliveryType" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="NVD">Normal Vaginal Delivery (NVD)</option>
              <option value="LSCS">Lower Segment Caesarean Section (LSCS)</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Delivery Date &amp; Time</label>
            <input v-model="form.deliveryDateTime" type="datetime-local" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status at Birth</label>
            <select v-model="form.babyStatusAtBirth" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="LIVE">Live Baby</option>
              <option value="STILLBORN">Stillborn</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sex of Baby</label>
            <select v-model="form.sex" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Birth Weight (kg)</label>
            <input v-model.number="form.birthWeightKg" type="number" step="0.01" placeholder="e.g. 2.40" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Baby Cried at Birth</label>
            <select v-model="form.babyCried" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="CRIED_IMMEDIATELY">Cried Immediately</option>
              <option value="DID_NOT_CRY">Did Not Cry</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Apgar Score (1 min)</label>
            <input v-model.number="form.apgar1Min" type="number" min="0" max="10" placeholder="/10" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Apgar Score (5 mins)</label>
            <input v-model.number="form.apgar5Min" type="number" min="0" max="10" placeholder="/10" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Delayed Cord Clamping (DCC)</label>
            <select v-model="form.dcc" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="DONE">Done</option>
              <option value="NOT_DONE">Not Done</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Liquor Status</label>
            <select v-model="form.liquorStatus" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="CLEAR">Clear</option>
              <option value="MECONIUM_STAINED">Meconium Stained</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Resuscitation</label>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="form.resuscitationRequired" class="rounded text-teal-600 focus:ring-teal-500" />
                Required / Given
              </label>
              <input 
                v-if="form.resuscitationRequired" 
                v-model="form.resuscitationDetails" 
                type="text" 
                placeholder="Specify details (e.g. Bag & Mask, O2)" 
                class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" 
              />
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Congenital Anomaly</label>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="form.congenitalAnomalyPresent" class="rounded text-rose-600 focus:ring-rose-500" />
                Present
              </label>
              <input 
                v-if="form.congenitalAnomalyPresent" 
                v-model="form.congenitalAnomalyDetails" 
                type="text" 
                placeholder="Specify anomalies found..." 
                class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" 
              />
            </div>
          </div>
        </div>

        <!-- Birth Dose Vaccines -->
        <div class="mt-4 p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
          <span class="text-xs font-black text-teal-900 uppercase tracking-wider block">Birth Dose Vaccines (HepB, BCG, OPV)</span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- HepB -->
            <div class="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-100">
              <input type="checkbox" v-model="form.birthDoseVaccines.hepB.given" id="hepBCheck" class="rounded text-teal-600" />
              <label for="hepBCheck" class="text-xs font-bold text-slate-700 cursor-pointer">HepB</label>
              <input v-if="form.birthDoseVaccines.hepB.given" v-model="form.birthDoseVaccines.hepB.date" type="date" class="ml-auto px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]" />
            </div>

            <!-- BCG -->
            <div class="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-100">
              <input type="checkbox" v-model="form.birthDoseVaccines.bcg.given" id="bcgCheck" class="rounded text-teal-600" />
              <label for="bcgCheck" class="text-xs font-bold text-slate-700 cursor-pointer">BCG</label>
              <input v-if="form.birthDoseVaccines.bcg.given" v-model="form.birthDoseVaccines.bcg.date" type="date" class="ml-auto px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]" />
            </div>

            <!-- OPV -->
            <div class="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-teal-100">
              <input type="checkbox" v-model="form.birthDoseVaccines.opv.given" id="opvCheck" class="rounded text-teal-600" />
              <label for="opvCheck" class="text-xs font-bold text-slate-700 cursor-pointer">OPV</label>
              <input v-if="form.birthDoseVaccines.opv.given" v-model="form.birthDoseVaccines.opv.date" type="date" class="ml-auto px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]" />
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Neonatal Complications & Clinical Course -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          2. Clinical Course &amp; Neonatal Complications
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Fever & Sepsis Box -->
          <div class="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <span class="text-xs font-black text-slate-800 uppercase tracking-wider block">Fever &amp; Sepsis Screen</span>
            
            <div class="flex items-center justify-between gap-4">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="form.developedFever" class="rounded text-rose-600" />
                Developed Fever
              </label>
              <div v-if="form.developedFever" class="flex items-center gap-2">
                <span class="text-[11px] text-slate-500 font-bold">On:</span>
                <input v-model="form.feverDate" type="date" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sepsis Screen</label>
                <select v-model="form.sepsisScreen" class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  <option value="NEGATIVE">Negative</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NOT_DONE">Not Done</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Antibiotics Administered</label>
                <div class="flex items-center gap-2 pt-1">
                  <input type="checkbox" v-model="form.antibiotics.given" id="abCheck" class="rounded text-teal-600" />
                  <label for="abCheck" class="text-xs font-bold text-slate-700 cursor-pointer">Yes</label>
                </div>
              </div>
            </div>

            <div v-if="form.antibiotics.given" class="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Route</label>
                <select v-model="form.antibiotics.route" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs">
                  <option value="IV">IV</option>
                  <option value="ORAL">Oral</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Days</label>
                <input v-model.number="form.antibiotics.days" type="number" placeholder="Days" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Details</label>
                <input v-model="form.antibiotics.details" type="text" placeholder="Drug name" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs" />
              </div>
            </div>
          </div>

          <!-- Icterus / Jaundice Box -->
          <div class="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <span class="text-xs font-black text-slate-800 uppercase tracking-wider block">Icterus (Neonatal Jaundice)</span>

            <div class="flex items-center justify-between gap-4">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="form.developedIcterus" class="rounded text-amber-500" />
                Developed Icterus
              </label>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-500 font-bold">TCB/TSB:</span>
                <input v-model="form.icterusTcbTsb" type="text" placeholder="e.g. 10.4 mg/dl" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-28" />
              </div>
            </div>

            <div v-if="form.developedIcterus" class="grid grid-cols-2 gap-3 pt-2">
              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <div class="flex items-center gap-2 mb-1">
                  <input type="checkbox" v-model="form.phototherapy.given" id="photoCheck" class="rounded text-amber-500" />
                  <label for="photoCheck" class="text-xs font-bold text-slate-700 cursor-pointer">Phototherapy</label>
                </div>
                <input v-if="form.phototherapy.given" v-model="form.phototherapy.date" type="date" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]" />
              </div>

              <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                <div class="flex items-center gap-2 mb-1">
                  <input type="checkbox" v-model="form.exchangeTransfusion.given" id="exchangeCheck" class="rounded text-rose-500" />
                  <label for="exchangeCheck" class="text-xs font-bold text-slate-700 cursor-pointer">Exchange Transfusion</label>
                </div>
                <input v-if="form.exchangeTransfusion.given" v-model="form.exchangeTransfusion.date" type="date" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]" />
              </div>
            </div>
          </div>

          <!-- Feeding & Hydration Box -->
          <div class="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3 md:col-span-2">
            <span class="text-xs font-black text-slate-800 uppercase tracking-wider block">Feeding &amp; Hydration Status</span>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Feeding Pattern</label>
                <select v-model="form.feedingType" class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  <option value="EXCLUSIVE_BREASTFEEDING">Exclusive Breastfeeding</option>
                  <option value="MIX_FEEDING">Mix Feeding Given</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Feeding Problem</label>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" v-model="form.feedingProblem" class="rounded text-rose-600" />
                    Yes
                  </label>
                  <input v-if="form.feedingProblem" v-model="form.feedingProblemDueTo" type="text" placeholder="Due to..." class="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dehydration</label>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" v-model="form.dehydration" class="rounded text-rose-600" />
                    Yes
                  </label>
                  <input v-if="form.dehydration" v-model="form.dehydrationCorrectedWith" type="text" placeholder="Corrected with..." class="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
            </div>

            <div class="pt-2">
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Other Significant Events</label>
              <textarea v-model="form.otherSignificantEvents" rows="2" placeholder="Record any other events, vitals fluctuation or clinical notes during stay..." class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3: Condition at Discharge -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          3. Condition at Discharge
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Discharge Category</label>
            <select v-model="form.dischargeType" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500">
              <option value="WITH_MEDICAL_ADVICE">With Medical Advice</option>
              <option value="ON_REQUEST">On Request</option>
              <option value="NORMAL">Normal / Routine</option>
              <option value="LAMA">LAMA</option>
              <option value="DAMA">DAMA</option>
              <option value="REFERRED">Referred</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Discharge Date &amp; Time</label>
            <input v-model="form.dischargeDate" type="datetime-local" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Discharge Weight (kg)</label>
            <input v-model.number="form.conditionAtDischarge.weightKg" type="number" step="0.01" placeholder="e.g. 2.45" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Length (cms)</label>
            <input v-model.number="form.conditionAtDischarge.lengthCm" type="number" step="0.1" placeholder="e.g. 43" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Head Circumference (cms)</label>
            <input v-model.number="form.conditionAtDischarge.headCircumferenceCm" type="number" step="0.1" placeholder="e.g. 31" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Discharge Icterus (TCB/TSB)</label>
            <input v-model="form.conditionAtDischarge.tcbTsbValue" type="text" placeholder="e.g. 10.4 mg/dl" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div class="sm:col-span-2 flex items-center gap-6 pt-5">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" v-model="form.conditionAtDischarge.isActive" class="rounded text-teal-600" />
              Active &amp; Alert
            </label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" v-model="form.conditionAtDischarge.feedsWell" class="rounded text-teal-600" />
              Feeds Well
            </label>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" v-model="form.conditionAtDischarge.noFever" class="rounded text-teal-600" />
              No Fever
            </label>
          </div>
        </div>
      </div>

      <!-- SECTION 4: Discharge Advice & Follow-up -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            4. Discharge Advice &amp; Review Instructions
          </h3>
          <button @click="resetDefaultAdvice" class="text-[11px] font-bold text-teal-600 hover:text-teal-800 cursor-pointer">
            Reset to Standard Advice
          </button>
        </div>

        <!-- Advice List -->
        <div class="space-y-2">
          <div v-for="(item, idx) in form.advice" :key="idx" class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
            <span class="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-black shrink-0">{{ idx + 1 }}</span>
            <input v-model="form.advice[idx]" type="text" class="flex-1 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none" />
            <button @click="removeAdvice(idx)" class="text-slate-400 hover:text-rose-500 p-1 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Add new advice item -->
          <div class="flex items-center gap-2 pt-2">
            <input 
              v-model="newAdviceInput" 
              @keyup.enter="addAdvice"
              type="text" 
              placeholder="Add custom advice instruction..." 
              class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" 
            />
            <button @click="addAdvice" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer">
              Add Advice
            </button>
          </div>
        </div>

        <!-- Follow-up Section -->
        <div class="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Review / Checkup Date</label>
            <input v-model="form.followUp.reviewDate" type="date" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Review Time</label>
            <input v-model="form.followUp.reviewTime" type="text" placeholder="e.g. 11:00 AM" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Review Location / Clinic</label>
            <input v-model="form.followUp.reviewLocation" type="text" placeholder="Paediatric OPD or SOS" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500" />
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <button 
          @click="saveSummary('DRAFT')"
          :disabled="saving"
          class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          Save Draft
        </button>

        <button 
          @click="saveSummary('FINAL')"
          :disabled="saving"
          class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Finalize &amp; Save
        </button>
      </div>
    </div>

    <!-- Hidden Printable Report Container for html2canvas & jsPDF -->
    <div class="fixed -left-[9999px] top-0 overflow-hidden pointer-events-none z-[-1] opacity-0">
      <div ref="printReportContainer" class="pdf-report-card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <td>
                <div class="pdf-header">
                  <div class="pdf-header-top">
                    <div>
                      <img :src="logoUrl" alt="Hospital Logo" style="height: 54px; width: auto; object-fit: contain;" />
                    </div>
                    <div style="text-align: right;">
                      <p class="pdf-hospital-name">EMMANUEL HOSPITAL</p>
                      <p class="pdf-hospital-info">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                      <p class="pdf-hospital-info">Phone: 0389-2913340 / 8974326872</p>
                    </div>
                  </div>
                  <div style="text-align: center; margin-top: 4px;">
                    <h1 class="pdf-title-badge">DISCHARGE SUMMARY FOR NEWBORN</h1>
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
                    <div class="pdf-info-lbl">Patient / Baby Name</div>
                    <div class="pdf-info-val">{{ admission?.patientId?.fullName || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">IPD Admission No</div>
                    <div class="pdf-info-val">{{ admission?.admissionNo || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Sex / Status</div>
                    <div class="pdf-info-val">{{ form.sex || admission?.patientId?.gender || '-' }} ({{ form.babyStatusAtBirth || 'LIVE' }})</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Address</div>
                    <div class="pdf-info-val">{{ admission?.patientId?.address || '-' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Admission Date</div>
                    <div class="pdf-info-val">{{ formatDate(admission?.admissionDate) }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Delivery Date & Time</div>
                    <div class="pdf-info-val">{{ formatDateTime(form.deliveryDateTime) }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Discharge Date</div>
                    <div class="pdf-info-val">{{ formatDateTime(form.dischargeDate) }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Delivery Mode</div>
                    <div class="pdf-info-val">{{ form.deliveryType || 'NVD' }}</div>
                  </div>
                  <div>
                    <div class="pdf-info-lbl">Birth Weight</div>
                    <div class="pdf-info-val">{{ form.birthWeightKg ? form.birthWeightKg + ' kg' : '-' }}</div>
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
                    <div class="pdf-info-lbl">Summary Status</div>
                    <div class="pdf-info-val">{{ form.status }}</div>
                  </div>
                </div>

                <!-- 1. Birth & Neonatal Assessment -->
                <div class="pdf-section">
                  <div class="pdf-section-title">1. Birth &amp; Neonatal Assessment</div>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
                    <tr>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Baby Cried at Birth:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.babyCried === 'CRIED_IMMEDIATELY' ? 'Cried Immediately' : 'Did Not Cry' }}</td>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Apgar Score:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">1 min: <strong>{{ form.apgar1Min ?? '-' }}/10</strong> &nbsp;|&nbsp; 5 mins: <strong>{{ form.apgar5Min ?? '-' }}/10</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Delayed Cord Clamping:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.dcc === 'DONE' ? 'Done' : 'Not Done' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Liquor Status:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.liquorStatus === 'MECONIUM_STAINED' ? 'Meconium Stained' : 'Clear' }}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Resuscitation:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.resuscitationRequired ? 'Given (' + (form.resuscitationDetails || 'Standard Protocol') + ')' : 'Not Required' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Congenital Anomaly:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.congenitalAnomalyPresent ? 'Present (' + (form.congenitalAnomalyDetails || '-') + ')' : 'Absent' }}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Birth Dose Vaccines:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;" colspan="3">
                        HepB: <strong>{{ form.birthDoseVaccines?.hepB?.given ? 'Given (' + formatDate(form.birthDoseVaccines.hepB.date) + ')' : 'Not Given' }}</strong> &nbsp;|&nbsp;
                        BCG: <strong>{{ form.birthDoseVaccines?.bcg?.given ? 'Given (' + formatDate(form.birthDoseVaccines.bcg.date) + ')' : 'Not Given' }}</strong> &nbsp;|&nbsp;
                        OPV: <strong>{{ form.birthDoseVaccines?.opv?.given ? 'Given (' + formatDate(form.birthDoseVaccines.opv.date) + ')' : 'Not Given' }}</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- 2. Clinical Course & Neonatal Observations -->
                <div class="pdf-section">
                  <div class="pdf-section-title">2. Clinical Course &amp; Neonatal Observations</div>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
                    <tr>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Developed Fever:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.developedFever ? 'Yes (' + formatDate(form.feverDate) + ')' : 'No' }}</td>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Sepsis Screen:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.sepsisScreen || 'Not Done' }}</td>
                    </tr>
                    <tr v-if="form.antibiotics?.given">
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Antibiotics:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;" colspan="3">{{ form.antibiotics.route || 'IV' }} - {{ form.antibiotics.days || 0 }} days {{ form.antibiotics.details ? '(' + form.antibiotics.details + ')' : '' }}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Developed Icterus:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.developedIcterus ? 'Yes (TCB/TSB: ' + (form.icterusTcbTsb || '-') + ')' : 'No' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Feeding Type:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.feedingType === 'EXCLUSIVE_BREASTFEEDING' ? 'Exclusive Breastfeeding' : 'Mix Feeding' }}</td>
                    </tr>
                    <tr v-if="form.developedIcterus">
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Phototherapy / Exch.:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;" colspan="3">Phototherapy: {{ form.phototherapy?.given ? 'Yes (' + formatDate(form.phototherapy.date) + ')' : 'No' }} &nbsp;|&nbsp; Exchange Transfusion: {{ form.exchangeTransfusion?.given ? 'Yes (' + formatDate(form.exchangeTransfusion.date) + ')' : 'No' }}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Feeding Problem:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.feedingProblem ? 'Yes (' + (form.feedingProblemDueTo || 'Reported') + ')' : 'No' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Dehydration:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;">{{ form.dehydration ? 'Yes (Corrected with ' + (form.dehydrationCorrectedWith || 'Fluids') + ')' : 'No' }}</td>
                    </tr>
                    <tr v-if="form.otherSignificantEvents">
                      <td style="padding: 3px 5px; font-weight: 700; color: #475569; font-size: 10px; border-bottom: 1px solid #f1f5f9;">Other Events:</td>
                      <td style="padding: 3px 5px; font-weight: 600; color: #0f172a; font-size: 10px; border-bottom: 1px solid #f1f5f9;" colspan="3">{{ form.otherSignificantEvents }}</td>
                    </tr>
                  </table>
                </div>

                <!-- 3. Condition at Discharge -->
                <div class="pdf-diagnosis-box">
                  <div class="pdf-diagnosis-lbl">3. Condition on Discharge</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #14532d; font-size: 10px;">General Activity:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 700; color: #14532d; font-size: 10.5px;">{{ form.conditionAtDischarge?.isActive ? 'Active & alert' : 'Subdued' }}</td>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #14532d; font-size: 10px;">Feeding &amp; Fever:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 700; color: #14532d; font-size: 10.5px;">{{ form.conditionAtDischarge?.feedsWell ? 'Feeds well' : 'Poor feed' }}, {{ form.conditionAtDischarge?.noFever ? 'No fever' : 'Feverish' }}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10px;">Icterus (TCB/TSB):</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10.5px;">{{ form.conditionAtDischarge?.tcbTsbValue || form.conditionAtDischarge?.icterus || 'None' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10px;">Discharge Weight:</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10.5px;"><strong>{{ form.conditionAtDischarge?.weightKg ? form.conditionAtDischarge.weightKg + ' kg' : '-' }}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10px;">Length / Head Circ.:</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10.5px;">{{ form.conditionAtDischarge?.lengthCm ? form.conditionAtDischarge.lengthCm + ' cm' : '-' }} &nbsp;|&nbsp; {{ form.conditionAtDischarge?.headCircumferenceCm ? form.conditionAtDischarge.headCircumferenceCm + ' cm' : '-' }}</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10px;">Discharge Mode:</td>
                      <td style="padding: 3px 5px; font-weight: 700; color: #14532d; font-size: 10.5px;">{{ form.dischargeType === 'ON_REQUEST' ? 'Discharged on Request' : 'With Medical Advice' }}</td>
                    </tr>
                  </table>
                </div>

                <!-- 4. Discharge Advice -->
                <div class="pdf-section">
                  <div class="pdf-section-title">4. Discharge Advice</div>
                  <ol style="margin: 3px 0 5px 16px; padding: 0;">
                    <li v-for="(item, idx) in form.advice" :key="idx" style="margin-bottom: 2.5px; font-size: 10px; color: #1e293b; font-weight: 600; line-height: 1.38;">{{ item }}</li>
                  </ol>
                </div>

                <!-- 5. Follow-up & Review -->
                <div class="pdf-section">
                  <div class="pdf-section-title">5. Follow-up &amp; Review</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px;">Review Date:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 700; color: #0f172a; font-size: 10.5px;">{{ formatDate(form.followUp?.reviewDate) }} @ {{ form.followUp?.reviewTime || '11:00 AM' }}</td>
                      <td style="padding: 3px 5px; width: 22%; font-weight: 700; color: #475569; font-size: 10px;">Location / Clinic:</td>
                      <td style="padding: 3px 5px; width: 28%; font-weight: 700; color: #0f172a; font-size: 10.5px;">{{ form.followUp?.reviewLocation || 'Paediatric OPD or SOS' }}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 16px; padding-bottom: 4px;">
                <!-- Signature Block -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                  <p style="font-size: 9px; color: #64748b; margin: 0;">Report Generated: {{ new Date().toLocaleString('en-IN') }}</p>
                  <div style="text-align: center; width: 180px;">
                    <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-size: 10px;">
                      {{ admission?.consultantDoctorId?.fullName || 'Consultant Doctor' }}<br>
                      <span style="font-weight: normal; font-size: 9px; color: #64748b;">(Attending / Authorized Consultant)</span>
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
                <h3 class="font-bold text-sm text-white">Newborn Discharge Summary PDF Preview</h3>
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
            <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="w-full h-full border-0" title="Newborn Discharge Summary PDF Preview"></iframe>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
  padding: 30px 40px 28px 40px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
  line-height: 1.42;
  font-size: 10.5px;
}

.pdf-header {
  border-bottom: 2px solid #0f172a;
  padding-bottom: 8px;
  margin-bottom: 12px;
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
  margin-bottom: 12px;
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
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 11px;
}

.pdf-diagnosis-lbl {
  font-size: 10px;
  font-weight: 800;
  color: #166534;
  text-transform: uppercase;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.pdf-section {
  margin-bottom: 11px;
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
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.38;
  padding: 1px 0;
}
</style>
