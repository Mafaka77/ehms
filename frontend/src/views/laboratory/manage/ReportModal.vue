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
  let html = '<table><tbody><tr><th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Ranges</th></tr>'

  tests.value.forEach(test => {
    html += `<tr><td colspan="4" class="test-title-header"><u><strong style="font-weight: 900; font-size: 13px;">${test.testName.toUpperCase()}</strong></u></td></tr>`

    const groups = {}
    test.parameters.forEach(param => {
      const sec = param.section || 'General'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(param)
    })
    
    const sortedSections = Object.keys(groups).sort((a,b) => a.localeCompare(b))
    
    sortedSections.forEach(section => {
      html += `<tr><td colspan="4" class="section-header"><strong>${section.toUpperCase()}</strong></td></tr>`
      
      groups[section].sort((a,b) => (a.displayOrder||0) - (b.displayOrder||0)).forEach(param => {
         let rangeStr = ''
         if (param.referenceIntervals && param.referenceIntervals.length > 0) {
            rangeStr = param.referenceIntervals.map(i => `${i.label}: ${i.range}`).join(' | ')
         } else {
            const arr = []
            if (param.normalRangeMale) arr.push(`M: ${param.normalRangeMale}`)
            if (param.normalRangeFemale) arr.push(`F: ${param.normalRangeFemale}`)
            if (param.normalRangeChild) arr.push(`C: ${param.normalRangeChild}`)
            rangeStr = arr.join(' | ') || '-'
         }
         
         const valueStr = param.measuredValue || '-'
         const outOfRangeStar = param.isOutOfRange ? ' <span style="color:red">*</span>' : ''
         
         html += `<tr>`
         html += `<td><strong>${param.name}</strong></td>`
         html += `<td><strong>${valueStr}</strong>${outOfRangeStar}</td>`
         html += `<td>${param.unit || '-'}</td>`
         html += `<td>${rangeStr}</td>`
         html += `</tr>`
      })
    })
  })
  
  html += '</tbody></table>'
  
  const methods = tests.value.filter(t => t.methodology).map(t => `<strong>${t.testName}</strong>: ${t.methodology}`)
  if (methods.length > 0) {
    html += '<p></p><p><strong>Methods:</strong></p>'
    if (methods.length === 1 && tests.value.length === 1) {
      html += `<p>${tests.value[0].methodology}</p>`
    } else {
      html += `<ul>${methods.map(m => `<li>${m}</li>`).join('')}</ul>`
    }
  }

  html += '<p></p><p><strong>Remarks:</strong> </p>'
  
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

const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    FontSize,
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
    const tbodyRect = tbody.getBoundingClientRect()
    const tfootRect = tfoot.getBoundingClientRect()
    
    const headerY = 0
    const headerH = Math.round(tbodyRect.top - contRect.top)
    
    const bodyY = headerH
    const bodyH = Math.round(tfootRect.top - tbodyRect.top)
    
    const footerY = bodyY + bodyH
    const footerH = Math.round(tfootRect.bottom - tfootRect.top)
    
    const cropCanvas = (y, h) => {
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
    const footerData = cropCanvas(footerY, footerH)
    
    const ratio = pdfWidth / canvas.width
    const headerPdfH = (headerH * scaleFactor) * ratio
    const bodyPdfH = (bodyH * scaleFactor) * ratio
    const footerPdfH = (footerH * scaleFactor) * ratio
    
    const bodyAvailableSpace = pageHeight - headerPdfH - footerPdfH
    let bodyHeightLeft = bodyPdfH
    let bodyOffset = 0
    
    const totalPages = Math.max(1, Math.ceil(bodyPdfH / bodyAvailableSpace))
    let currentPage = 1
    
    const drawPageFrame = (offset, pageNum, total) => {
      // Draw body in the middle
      pdf.addImage(bodyData, 'JPEG', 0, headerPdfH - offset, pdfWidth, bodyPdfH)
      
      // Cover overflow with solid white rectangles
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pdfWidth, headerPdfH, 'F')
      pdf.rect(0, pageHeight - footerPdfH, pdfWidth, footerPdfH + 2, 'F')
      
      // Draw header at the top
      pdf.addImage(headerData, 'JPEG', 0, 0, pdfWidth, headerPdfH)
      // Draw footer at the absolute bottom
      pdf.addImage(footerData, 'JPEG', 0, pageHeight - footerPdfH, pdfWidth, footerPdfH)
      
      // Draw page number at the bottom left (within the bottom margin)
      pdf.setFontSize(8)
      pdf.setTextColor(51, 65, 85) // slate-700 for high contrast
      const pageText = `Page ${pageNum} of ${total}`
      pdf.text(pageText, 15, pageHeight - 8)
    }
    
    drawPageFrame(bodyOffset, currentPage, totalPages)
    bodyHeightLeft -= bodyAvailableSpace
    
    while (bodyHeightLeft > 0) {
      bodyOffset += bodyAvailableSpace
      currentPage++
      pdf.addPage()
      drawPageFrame(bodyOffset, currentPage, totalPages)
      bodyHeightLeft -= bodyAvailableSpace
    }
    
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
                <p><strong>Ref. Clinician:</strong> Dr. {{ order.doctorId?.fullName || 'Self/Referral' }}</p>
              </div>
            </div>
                </td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <!-- Parameters results list rendered in Editor -->
                  <div class="mb-6">
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
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td>
                  <!-- Signatures Section -->
            <div class="signatures">
              <div>
               
              </div>
              <div class="text-right">
                <span class="sig-line">Authorized Signatory / Pathologist</span>
              </div>
            </div>

            <div class="notice">
              <p>*** End of Report ***</p>
              <p class="wish">This is a computer-verified diagnostic report and does not require a physical signature.</p>
              
              <!-- For browsers that support CSS page counters -->
              <div v-show="!printingPDF" class="page-number-placeholder screen-only print:hidden">Page numbers will be generated by the browser during print</div>
            </div>
                </td>
              </tr>
            </tfoot>
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
  padding: 10mm 15mm 15mm 15mm;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  font-family: Arial, Helvetica, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.report-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-header {
  text-align: center;
  margin-bottom: 20px;
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
  font-size: 10.5px;
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.report-divider {
  border: 0;
  border-top: 2px solid #1e3a8a;
  margin: 10px 0;
}

.report-header h2 {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #0f172a;
  margin: 6px 0 0 0;
}

.demographics {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  column-gap: 24px;
  row-gap: 6px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px solid #94a3b8;
  border-radius: 8px;
  background-color: #f8fafc;
  line-height: 1.6;
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
  flex-grow: 1;
  margin-bottom: 30px;
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
  margin-bottom: 20px;
}

.tiptap-editor :deep(.tiptap th) {
  border-top: 2px solid #0f172a;
  border-bottom: 2px solid #0f172a;
  font-weight: 700;
  padding: 8px 6px;
  color: #000000;
  font-size: 11px;
  text-align: left;
}

.tiptap-editor :deep(.tiptap th:nth-child(2)),
.tiptap-editor :deep(.tiptap th:nth-child(3)),
.tiptap-editor :deep(.tiptap th:nth-child(4)) {
  text-align: center;
}

.tiptap-editor :deep(.tiptap td) {
  border-bottom: 1px solid #cbd5e1;
  padding: 8px 6px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 500;
  vertical-align: top;
}

.tiptap-editor :deep(.tiptap td:nth-child(2)),
.tiptap-editor :deep(.tiptap td:nth-child(3)),
.tiptap-editor :deep(.tiptap td:nth-child(4)) {
  text-align: center;
}

.tiptap-editor :deep(.tiptap td p) {
  margin: 0;
}

.tiptap-editor :deep(.tiptap strong) {
  color: #000000;
  font-weight: 700;
}

.tiptap-editor :deep(.tiptap td:first-child) {
  font-weight: 700;
  color: #000000;
}

.tiptap-editor :deep(.tiptap td.test-title-header) {
  background-color: #000000 !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  font-size: 13px !important;
  padding: 10px 14px !important;
  text-align: center !important;
  letter-spacing: 0.06em !important;
  border: 1px solid #000000 !important;
  text-decoration: underline !important;
}

.tiptap-editor :deep(.tiptap td.test-title-header strong),
.tiptap-editor :deep(.tiptap td.test-title-header b),
.tiptap-editor :deep(.tiptap td.test-title-header u),
.tiptap-editor :deep(.tiptap td.test-title-header p) {
  color: #ffffff !important;
  font-weight: 900 !important;
  font-size: 13px !important;
  text-align: center !important;
  text-decoration: underline !important;
}

.tiptap-editor :deep(.tiptap td.section-header) {
  background-color: #f1f5f9;
  font-weight: 700;
  color: #000000;
}

.signatures {
  margin-top: auto;
  padding-top: 40px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: #0f172a;
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

  /* Ensures that table sections repeat correctly across pages */
  thead { display: table-header-group; }
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
