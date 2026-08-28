<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useLabStore } from '../../../stores/labStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import { TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {TextAlign} from '@tiptap/extension-text-align'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const labStore = useLabStore()
const snackbarStore = useSnackbarStore()

const loading = ref(false)
const printingPDF = ref(false)
const orderData = ref(null)
const tests = ref([])

const viewMode = ref('edit')
const pdfPreviewUrl = ref(null)
const currentFilename = ref('')

const patientAge = computed(() => {
  const patient = props.order?.patientId
  if (patient && patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth)
    const today = new Date()
    
    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()
    
    if (months < 0 || (months === 0 && days < 0)) {
      years--
    }
    
    const lastBirthday = new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate())
    const diffTime = Math.abs(today.getTime() - lastBirthday.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))
    
    return years > 0 ? `${years}Y ${diffDays}D` : `${diffDays}D`
  }
  return props.order?.patientId?.age ? `${props.order.patientId.age}Y` : '-'
})

const fetchResults = async () => {
  if (!props.order?._id) return
  loading.value = true
  try {
    const res = await labStore.fetchOrderResults(props.order._id)
    orderData.value = res.order
    tests.value = res.tests
    
    if (editor.value) {
      editor.value.commands.setContent(generateEditorContent())
    }
  } catch (error) {
    console.error('Error fetching results:', error)
    snackbarStore.show({ message: 'Failed to load report data', type: 'error' })
  } finally {
    loading.value = false
  }
}

const generateEditorContent = () => {
  let html = '<table><thead><tr><th style="text-align: center; padding: 2px 4px;">Test</th><th style="text-align: center; padding: 2px 4px;">Result</th><th style="text-align: center; padding: 2px 4px;">Unit</th><th style="text-align: center; padding: 2px 4px;">Reference Ranges</th></tr></thead><tbody>'

  tests.value.forEach((test, testIdx) => {
    // Add separator between tests if there are multiple tests
    if (testIdx > 0) {
      html += `<tr><td colspan="4" class="test-separator-row" style="border-top: 1px dashed #cbd5e1; padding: 1px 0;"></td></tr>`
    }

    // Test Name header
    html += `<tr><td colspan="4" class="test-header-row" style="padding: 1px 0 0 0;"><strong><u>${test.testName.toUpperCase()}</u></strong></td></tr>`

    const groups = {}
    ;(test.parameters || []).forEach(param => {
      const sec = param.section && param.section !== 'General' ? param.section : ''
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(param)
    })
    
    const sortedSections = Object.keys(groups).sort((a,b) => a.localeCompare(b))
    
    sortedSections.forEach(section => {
      if (section) {
        html += `<tr><td colspan="4" class="section-title-row" style="padding: 2px 0 2px 0; font-weight: 700; font-size: 11px;">&nbsp;&nbsp;&nbsp;&nbsp;${section}</td></tr>`
      }
      
      groups[section].sort((a,b) => (a.displayOrder||0) - (b.displayOrder||0)).forEach(param => {
         let rangeStr = ''
         if (param.referenceIntervals && param.referenceIntervals.length > 0) {
            rangeStr = param.referenceIntervals.map(i => `${i.label ? i.label + ' : ' : ''}${i.range}`).join('<br>')
         } else {
            const arr = []
            if (param.normalRangeMale && param.normalRangeFemale && param.normalRangeMale === param.normalRangeFemale) {
              arr.push(param.normalRangeMale)
            } else {
              if (param.normalRangeMale) arr.push(`Male: ${param.normalRangeMale}`)
              if (param.normalRangeFemale) arr.push(`Female: ${param.normalRangeFemale}`)
            }
            if (param.normalRangeChild) arr.push(`Child: ${param.normalRangeChild}`)
            rangeStr = arr.join('<br>') || '-'
         }
         
         const valueStr = param.measuredValue || '-'
         const formattedValue = param.isOutOfRange 
           ? `<span style="color: #dc2626;"><strong>${valueStr}</strong></span>` 
           : valueStr
         
         html += `<tr>`
         html += `<td style="width: 36%; padding: 2px 4px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${param.name}</td>`
         html += `<td style="width: 18%; text-align: center; padding: 2px 4px;">${formattedValue}</td>`
         html += `<td style="width: 14%; text-align: center; padding: 2px 4px;">${param.unit || ''}</td>`
         html += `<td style="width: 32%; text-align: center; padding: 2px 4px;">${rangeStr}</td>`
         html += `</tr>`
      })
    })

    // Paragraph / Methodology / Notes under each test
    const notesArr = []
    if (test.paragraph || test.remarks) {
      notesArr.push(test.paragraph || test.remarks)
    }

    if (notesArr.length > 0) {
      html += `<tr><td colspan="4" style="font-size: 9.5px; color: #1e293b; padding: 2px 0 2px 0; line-height: 1.2;">${notesArr.join('<br>')}</td></tr>`
    }
  })
  
  html += '</tbody></table>'
  
  const methods = tests.value.filter(t => t.methodology).map(t => `<strong>${t.testName}</strong>: ${t.methodology}`)
  if (methods.length > 0) {
    html += '<p style="margin-top: 4px; margin-bottom: 2px;"><strong>Methods:</strong></p>'
    if (methods.length === 1 && tests.value.length === 1) {
      html += `<p>${tests.value[0].methodology}</p>`
    } else {
      html += `<ul>${methods.map(m => `<li>${m}</li>`).join('')}</ul>`
    }
  }

  html += '<p style="margin-top: 4px; margin-bottom: 2px;"><strong>Remarks:</strong> </p>'
  
  return html
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

const Color = Extension.create({
  name: 'color',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: element => element.style.color || element.getAttribute('color'),
            renderHTML: attributes => {
              if (!attributes.color) return {}
              return { style: `color: ${attributes.color}` }
            },
          },
        },
      },
    ]
  },
})

const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    FontSize,
    Color,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
    }),
  ],
  content: '',
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    viewMode.value = 'edit'
    if (pdfPreviewUrl.value) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = null
    }
    fetchResults()
  } else {
    editor.value?.commands.setContent('')
  }
})

const generateReportPDF = async (preview = false) => {
  if (printingPDF.value) return
  printingPDF.value = true
  
  try {
    const wasPreview = viewMode.value === 'preview'
    if (wasPreview) {
      viewMode.value = 'edit'
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Wait for Vue to update the DOM (hide toolbar etc)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const element = document.querySelector('.print-report-container')
    if (!element) throw new Error('Report container not found')
    
    const scaleFactor = 3
    const canvas = await html2canvas(element, {
      scale: scaleFactor,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Grab the sections to calculate pixel heights
    const tbody = element.querySelector('tbody')
    const tfoot = element.querySelector('tfoot')
    
    const contRect = element.getBoundingClientRect()
    const tbodyRect = tbody ? tbody.getBoundingClientRect() : contRect
    const tfootRect = tfoot ? tfoot.getBoundingClientRect() : { top: tbodyRect.bottom, bottom: tbodyRect.bottom }
    
    const headerY = 0
    const headerH = Math.max(0, Math.round(tbodyRect.top - contRect.top))
    
    const bodyY = headerH
    const bodyH = Math.max(0, tfoot ? Math.round(tfootRect.top - tbodyRect.top) : Math.round(tbodyRect.height || (tbodyRect.bottom - tbodyRect.top)))
    
    const footerY = bodyY + bodyH
    const footerH = Math.max(0, tfoot ? Math.round(tfootRect.bottom - tfootRect.top) : 0)
    
    const cropCanvas = (y, h) => {
      if (h <= 0) return null
      const c = document.createElement('canvas')
      c.width = canvas.width
      const sy = Math.max(0, y * scaleFactor)
      const sh = Math.max(0, Math.min(h * scaleFactor, canvas.height - sy))
      c.height = sh || 1 // prevent 0 height canvas
      const ctx = c.getContext('2d')
      if (sh > 0) {
        ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh)
      }
      return c.toDataURL('image/jpeg', 0.98)
    }
    
    const headerData = cropCanvas(headerY, headerH)
    const bodyData = cropCanvas(bodyY, bodyH)
    const footerData = footerH > 0 ? cropCanvas(footerY, footerH) : null
    
    const ratio = pdfWidth / canvas.width
    const mmPerDomPx = scaleFactor * ratio
    const headerPdfH = (headerH * scaleFactor) * ratio
    const bodyPdfH = (bodyH * scaleFactor) * ratio
    const footerPdfH = (footerH * scaleFactor) * ratio
    
    const subPageTopMargin = 12 // Top margin in mm on page 2+
    const marginSinglePage = 5 // 5mm bottom margin when everything fits on 1 page
    const marginMultiPage = 18 // 18mm bottom margin when multiple pages are required
    
    // Check if everything fits on a single page (with 2mm tolerance to avoid orphan signature pages)
    const singlePageLimit = Math.max(10, pageHeight - headerPdfH - footerPdfH - 2)
    const fitsOnSinglePage = bodyPdfH <= singlePageLimit
    
    const pageBottomMargin = fitsOnSinglePage ? marginSinglePage : marginMultiPage
    const page1MaxBodySpace = Math.max(10, pageHeight - headerPdfH - footerPdfH - pageBottomMargin)
    const pageNMaxBodySpace = Math.max(10, pageHeight - subPageTopMargin - footerPdfH - pageBottomMargin)
    
    // Collect atomic block elements inside tbody to find natural page break boundaries
    const candidateElements = [
      ...element.querySelectorAll('.tiptap-editor .tiptap table thead tr'),
      ...element.querySelectorAll('.tiptap-editor .tiptap table tbody tr'),
      ...element.querySelectorAll('.tiptap-editor .tiptap > *:not(table)'),
      ...element.querySelectorAll('.tiptap-editor .tiptap > ul > li, .tiptap-editor .tiptap > ol > li'),
      ...element.querySelectorAll('.signatures')
    ]
    
    const elements = []
    const seen = new Set()
    
    for (const el of candidateElements) {
      if (!el || seen.has(el)) continue
      seen.add(el)
      const rect = el.getBoundingClientRect()
      if (rect.height <= 0) continue
      const topPx = rect.top - tbodyRect.top
      const bottomPx = rect.bottom - tbodyRect.top
      const isHeader = el.classList?.contains('test-header-row') || 
                       el.classList?.contains('section-title-row') ||
                       el.querySelector?.('.test-header-row, .section-title-row') !== null ||
                       el.tagName === 'THEAD' ||
                       el.closest('thead') !== null
      
      elements.push({
        el,
        topPx,
        bottomPx,
        topMm: topPx * mmPerDomPx,
        bottomMm: bottomPx * mmPerDomPx,
        heightMm: rect.height * mmPerDomPx,
        isHeader
      })
    }
    
    elements.sort((a, b) => a.topPx - b.topPx)
    
    // Calculate page slices based on elements to avoid cutting rows in half
    const pages = []
    let currentStartMm = 0
    let pageIdx = 0
    
    while (currentStartMm < bodyPdfH - 0.5) {
      const availableSpaceMm = (pageIdx === 0) ? page1MaxBodySpace : pageNMaxBodySpace
      const idealEndMm = currentStartMm + availableSpaceMm
      
      if (idealEndMm >= bodyPdfH - 0.5) {
        pages.push({ startMm: currentStartMm, endMm: bodyPdfH })
        break
      }
      
      let splitMm = idealEndMm
      
      // Check for elements that overlap with idealEndMm (straddle the page break)
      const overlapping = elements.filter(item => item.topMm < idealEndMm && item.bottomMm > idealEndMm)
      
      if (overlapping.length > 0) {
        const candidates = overlapping.filter(item => item.topMm > currentStartMm + 2)
        if (candidates.length > 0) {
          candidates.sort((a, b) => a.topMm - b.topMm)
          splitMm = candidates[0].topMm
        }
      } else {
        const beforeEnd = elements.filter(item => item.bottomMm <= idealEndMm && item.bottomMm > currentStartMm + 2)
        if (beforeEnd.length > 0) {
          beforeEnd.sort((a, b) => b.bottomMm - a.bottomMm)
          splitMm = beforeEnd[0].bottomMm
        }
      }
      
      // Avoid orphan section headers (or headers with only 1 item) at the bottom of the page
      const itemsBeforeSplit = elements.filter(item => item.bottomMm <= splitMm + 0.1 && item.topMm >= currentStartMm)
      if (itemsBeforeSplit.length > 0) {
        const lastItem = itemsBeforeSplit[itemsBeforeSplit.length - 1]
        if (lastItem.isHeader && lastItem.topMm > currentStartMm + 5) {
          splitMm = lastItem.topMm
        } else if (itemsBeforeSplit.length >= 2) {
          const secondLastItem = itemsBeforeSplit[itemsBeforeSplit.length - 2]
          if (secondLastItem.isHeader && secondLastItem.topMm > currentStartMm + 5) {
            splitMm = secondLastItem.topMm
          }
        }
      }
      
      // Fallback in case no valid split point was found
      if (splitMm <= currentStartMm + 5) {
        splitMm = idealEndMm
      }
      
      pages.push({ startMm: currentStartMm, endMm: splitMm })
      currentStartMm = splitMm
      pageIdx++
    }
    
    // If only signatures/remarks overflow into page 2 and total body fits within single page height, merge to 1 page
    if (pages.length === 2 && bodyPdfH <= (pageHeight - headerPdfH - footerPdfH - 1)) {
      pages.splice(0, 2, { startMm: 0, endMm: bodyPdfH })
    }
    
    const totalPages = pages.length
    let prevEndPx = 0
    
    pages.forEach((pageDef, idx) => {
      const pageNum = idx + 1
      if (idx > 0) {
        pdf.addPage()
      }
      
      const isFirstPage = (pageNum === 1)
      const isLastPage = (idx === totalPages - 1)
      const currentTopSpace = isFirstPage ? headerPdfH : subPageTopMargin
      
      // Add slight offset on subsequent pages to avoid subpixel border bleeding from previous row
      const startPx = isFirstPage ? prevEndPx : Math.min(bodyH, prevEndPx + 1)
      const endPx = isLastPage ? bodyH : Math.round(pageDef.endMm / mmPerDomPx)
      prevEndPx = endPx
      const sliceH = Math.max(1, endPx - startPx)
      
      const sliceData = cropCanvas(bodyY + startPx, sliceH)
      const slicePdfH = (sliceH * scaleFactor) * ratio
      
      // Draw letterhead & patient demographics ONLY on the first page
      if (isFirstPage && headerData && headerPdfH > 0) {
        pdf.addImage(headerData, 'JPEG', 0, 0, pdfWidth, headerPdfH)
      }
      
      // Draw body slice
      if (sliceData && slicePdfH > 0) {
        pdf.addImage(sliceData, 'JPEG', 0, currentTopSpace, pdfWidth, slicePdfH)
      }
      
      // Draw footer if present
      if (footerData && footerPdfH > 0 && isLastPage) {
        pdf.addImage(footerData, 'JPEG', 0, pageHeight - footerPdfH, pdfWidth, footerPdfH)
      }
      
      // Draw page number at top right
      pdf.setFontSize(8)
      pdf.setTextColor(100, 116, 139) // slate-500
      const pageText = `Page ${pageNum} of ${totalPages}`
      pdf.text(pageText, pdfWidth - 12, 6, { align: 'right' })
    })
    
    const patientName = props.order?.patientId?.fullName?.replace(/\s+/g, '_') || 'Patient'
    const orderNo = props.order?.orderNo || 'Report'
    const filename = `${patientName}_${orderNo}.pdf`
    currentFilename.value = filename
    
    if (preview) {
      const blob = pdf.output('blob')
      if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = URL.createObjectURL(blob)
      viewMode.value = 'preview'
    } else {
      pdf.save(filename)
      if (wasPreview) viewMode.value = 'preview'
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    snackbarStore.show({ message: 'Failed to generate PDF', type: 'error' })
    if (viewMode.value === 'preview') viewMode.value = 'edit'
  } finally {
    printingPDF.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:items-start print:justify-start print:relative print:w-full print:block">
      <!-- Backdrop -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" @click="emit('close')"></div>

    <!-- Modal Wrapper -->
    <div :class="[
      'relative bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 flex flex-col print:max-h-none print:overflow-visible print:bg-white print:shadow-none print:rounded-none print:block',
      printingPDF ? 'max-h-none overflow-visible' : 'max-h-[90vh] overflow-hidden'
    ]">
      
      <!-- Preview Area (Edit Mode) -->
      <div v-show="viewMode === 'edit'" :class="[
        'p-6 flex justify-center bg-slate-100 flex-grow print:p-0 print:bg-white print:overflow-visible print:block',
        printingPDF ? 'overflow-visible' : 'overflow-y-auto'
      ]">
        <!-- A4 Page representation on screen -->
        <div class="print-report-container select-none">
          <table class="w-full report-table">
            <thead>
              <tr>
                <td>
                  <!-- Header Brand -->
                  <div class="report-header">
                    <div class="relative mb-2 flex items-center justify-center">
                      <img src="../../../assets/logo_final.png" alt="Logo" class="absolute left-0 h-16 w-auto object-contain" />
                      <div class="text-center">
                        <h1 style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 16px;"><span class="text-[#006400]">Emmanuel</span> <span class="text-[#8b0000]">Hospital</span></h1>
                        <p>Y-67,Luangmual,Aizawl, Mizoram - 796009</p>
                        <p>Phone: 0389-2913340 / 8974326872</p>
                        <p>Reg No: A-0766/26</p>
                      </div>
                    </div>
                    <hr class="report-divider" />
                    <h2>LABORATORY INVESTIGATION REPORT</h2>
                  </div>

                  <!-- Demographics Block -->
            <div class="demographics">
              <div>
                <p><strong>Patient Name:</strong> {{ order.patientId?.fullName }}</p>
                <p><strong>Patient ID / Code:</strong> <span class="font-mono">{{ order.patientId?.patientCode || 'N/A' }}</span></p>
                <p><strong>Age / Gender:</strong> {{ patientAge }} / {{ order.patientId?.gender }}</p>
                <p><strong>Contact No:</strong> {{ order.patientId?.mobileNo }}</p>
              </div>
              <div class="text-right">
                <p><strong>Order No:</strong> <span class="font-mono">{{ order.orderNo }}</span></p>
                <p><strong>Date Ordered:</strong> {{ formatDate(order.orderDate) }}</p>
                <p><strong>Report Date:</strong> {{ formatDate(new Date()) }}</p>
                <p><strong>Ref. Clinician:</strong> {{ order.doctorId?.fullName || 'Self/Referral' }}</p>
              </div>
            </div>
                </td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <div>
              <!-- Editor Toolbar (hidden on print) -->
              <div v-if="editor" v-show="!printingPDF" class="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 border-b-0 rounded-t-lg print:hidden">
                <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-slate-200 text-indigo-700 font-extrabold': editor.isActive('bold') }" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 font-bold transition-colors" title="Bold">
                  B
                </button>
                <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-slate-200 text-indigo-700 font-bold': editor.isActive('italic') }" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 italic font-serif transition-colors" title="Italic">
                  I
                </button>
                <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-slate-200 text-indigo-700': editor.isActive('strike') }" class="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 line-through transition-colors" title="Strikethrough">
                  S
                </button>
                
                <div class="w-px h-4 bg-slate-300 mx-1"></div>

                <button @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'bg-slate-200 text-indigo-700': editor.isActive({ textAlign: 'left' }) }" class="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors" title="Align Left">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'bg-slate-200 text-indigo-700': editor.isActive({ textAlign: 'center' }) }" class="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors" title="Align Center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'bg-slate-200 text-indigo-700': editor.isActive({ textAlign: 'right' }) }" class="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors" title="Align Right">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
                
                <div class="w-px h-4 bg-slate-300 mx-1"></div>
                
                <select 
                  class="bg-white border border-slate-200 rounded text-slate-700 text-xs px-1.5 py-1 focus:outline-none focus:border-indigo-400 font-semibold cursor-pointer"
                  :value="editor.getAttributes('textStyle').fontSize || ''"
                  @change="(e) => {
                    const size = e.target.value;
                    if (size) editor.chain().focus().setFontSize(size).run();
                    else editor.chain().focus().unsetFontSize().run();
                  }"
                  title="Font Size"
                >
                  <option value="">Default Size</option>
                  <option value="10px">10px</option>
                  <option value="11px">11px</option>
                  <option value="12px">12px</option>
                  <option value="14px">14px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                  <option value="20px">20px</option>
                  <option value="24px">24px</option>
                </select>
                
                <div class="w-px h-4 bg-slate-300 mx-1"></div>
                
                <button @click="editor.chain().focus().addRowAfter().run()" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-semibold" title="Add Row Below">
                  + Row
                </button>
                <button @click="editor.chain().focus().deleteRow().run()" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-semibold" title="Delete Row">
                  - Row
                </button>
                <button @click="editor.chain().focus().mergeCells().run()" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-semibold" title="Merge Cells">
                  Merge
                </button>
                <button @click="editor.chain().focus().splitCell().run()" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-semibold" title="Split Cell">
                  Split
                </button>
              </div>

              <!-- Lab Test Names -->
              <!-- <div class="bg-white border-x border-t border-slate-200 px-4 py-3 text-center print:border-none print:px-0">
                <h3 class="font-bold text-lg text-slate-800 uppercase tracking-widest">
                  {{ tests.map(t => t.testName).join(', ') }}
                </h3>
              </div> -->

              <!-- Editor Content -->
              <div class="results-table-container print:border-none print:rounded-none print:shadow-none bg-white border border-slate-200 rounded-b-lg p-2 print:p-0 border-t-0">
                <editor-content :editor="editor" class="tiptap-editor" />
              </div>

              <!-- Signatures Section directly below remarks -->
              <div class="signatures">
                <div>
                </div>
                <div class="text-center pt-6 pb-1">
                  <span class="sig-line">Authorized Signatory / Pathologist</span>
                </div>
              </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- PDF Real Preview Mode -->
      <div v-if="viewMode === 'preview'" class="flex-grow bg-slate-600 flex flex-col relative min-h-[60vh]">
        <div v-if="printingPDF" class="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm z-10">
          <div class="flex flex-col items-center">
            <span class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-3"></span>
            <span class="text-white font-medium shadow-sm">Generating Preview...</span>
          </div>
        </div>
        <iframe :src="pdfPreviewUrl" class="w-full h-full flex-grow border-0" title="PDF Preview"></iframe>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-white border-t border-slate-100 flex justify-between items-center gap-3 screen-only">
        <div>
          <button 
            v-if="viewMode === 'edit'"
            @click="generateReportPDF(true)"
            :disabled="printingPDF"
            class="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></span>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview PDF
          </button>
          
          <button 
            v-if="viewMode === 'preview'"
            @click="viewMode = 'edit'"
            :disabled="printingPDF"
            class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Editor
          </button>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          
          <a v-if="viewMode === 'preview' && pdfPreviewUrl" :href="pdfPreviewUrl" :download="currentFilename" class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </a>
          
          <button 
            v-else
            @click="generateReportPDF(false)"
            :disabled="printingPDF"
            class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span v-if="printingPDF" class="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print & Download
          </button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
/* Scoped custom styling using standard hex colors to bypass Tailwind v4 oklch() color issues in html2canvas-pro */
.print-report-container {
  width: 210mm;
  min-height: 297mm;
  height: max-content;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #ffffff;
  border: 1px dashed #cbd5e1;
  color: #0f172a;
  padding: 8mm 12mm 10mm 12mm;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  font-family: Arial, Helvetica, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.report-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-header {
  text-align: center;
  margin-bottom: 10px;
}

.report-header h1 {
  font-size: 17px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.025em;
  color: #1e3a8a;
  margin: 0 0 4px 0;
}

.report-header p {
  font-size: 8.5px;
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  line-height: 1.35;
}

.report-divider {
  border: 0;
  border-top: 2px solid #1e3a8a;
  margin: 6px 0;
}

.report-header h2 {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #0f172a;
  margin: 4px 0 0 0;
}

.demographics {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  column-gap: 20px;
  row-gap: 4px;
  font-size: 10.5px;
  font-weight: 500;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid #94a3b8;
  border-radius: 8px;
  background-color: #f8fafc;
  line-height: 1.4;
}

.demographics p {
  margin: 0;
  color: #0f172a;
}

.demographics strong {
  color: #000000;
  font-weight: 700;
}

.results-table-container {
  margin-bottom: 0;
}

.tiptap-editor {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.tiptap-editor :deep(.tiptap) {
  outline: none;
  flex-grow: 1;
  font-size: 11px;
  color: #0f172a;
  line-height: 1.5;
}

.tiptap-editor :deep(.tiptap table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}

.tiptap-editor :deep(.tiptap th) {
  border-top: 1.5px solid #0f172a;
  border-bottom: 1.5px solid #0f172a;
  font-weight: 700;
  padding: 2px 4px;
  color: #000000;
  font-size: 11px;
  text-align: center;
}

.tiptap-editor :deep(.tiptap th:nth-child(1)),
.tiptap-editor :deep(.tiptap th:nth-child(2)),
.tiptap-editor :deep(.tiptap th:nth-child(3)),
.tiptap-editor :deep(.tiptap th:nth-child(4)) {
  text-align: center;
}

.tiptap-editor :deep(.tiptap td) {
  border: none;
  padding: 2px 4px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 500;
  vertical-align: top;
  line-height: 1.35;
}

.tiptap-editor :deep(.tiptap td:nth-child(2)),
.tiptap-editor :deep(.tiptap td:nth-child(3)) {
  text-align: center;
}

.tiptap-editor :deep(.tiptap td:nth-child(4)) {
  text-align: center;
}

.tiptap-editor :deep(.tiptap td p) {
  margin: 0;
  padding: 0;
  line-height: 1.2;
}

.tiptap-editor :deep(.tiptap strong) {
  font-weight: 800;
}

.tiptap-editor :deep(.tiptap td.test-header-row) {
  font-weight: 800 !important;
  font-size: 11.5px !important;
  color: #000000 !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
}

.tiptap-editor :deep(.tiptap td.section-title-row) {
  font-weight: 700 !important;
  font-size: 11px !important;
  color: #000000 !important;
  padding: 2px 0 2px 0 !important;
}

.tiptap-editor :deep(.tiptap td.test-separator-row) {
  border: none !important;
  border-top: 1px dashed #cbd5e1 !important;
  padding: 1px 0 !important;
}

.signatures {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: #0f172a;
  page-break-inside: avoid;
}

.signatures .operator-name {
  font-weight: 700;
  color: #000000;
  margin: 4px 0 0 0;
}

.signatures .sig-line {
  border-top: 1.5px solid #334155;
  padding-top: 6px;
  display: inline-block;
  width: 200px;
}

.notice {
  text-align: center;
  margin-top: 20px;
  font-size: 9px;
  color: #334155;
  font-weight: 600;
  line-height: 1.4;
}

.notice p {
  margin: 0;
}

.notice .wish {
  font-style: italic;
  font-weight: 700;
  margin-top: 4px;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 15mm;
  }
  
  #app {
    display: none !important;
  }

  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
  }

  /* Reset flex to block to allow natural pagination */
  .print-report-container,
  .tiptap-editor,
  .results-table-container,
  .print-report-container :deep(.tiptap) {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Only print thead once at the beginning of document */
  thead { display: table-row-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }

  .print-report-container {
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background-color: white !important;
    overflow: visible !important;
  }
  
  .screen-only {
    display: none !important;
  }
}
</style>
