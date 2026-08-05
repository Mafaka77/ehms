<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
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

const summaryText = ref(props.admission?.dischargeSummary || '')
const saving = ref(false)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] }
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({
      placeholder: 'Type the IPD clinical discharge summary, diagnosis, course in hospital, advice on discharge, and follow-up instructions here...'
    })
  ],
  content: props.admission?.dischargeSummary || '',
  onCreate({ editor: e }) {
    if (props.admission?.dischargeSummary) {
      e.commands.setContent(props.admission.dischargeSummary)
    }
  },
  onUpdate({ editor: e }) {
    summaryText.value = e.getHTML()
  }
})

watch(() => props.admission?.dischargeSummary, (newVal) => {
  const content = newVal || ''
  summaryText.value = content
  if (editor.value && editor.value.getHTML() !== content) {
    editor.value.commands.setContent(content)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const saveSummary = async () => {
  saving.value = true
  try {
    const res = await admissionStore.updateAdmission(props.admissionId, {
      dischargeSummary: summaryText.value
    })
    if (res.success) {
      if (props.admission) {
        props.admission.dischargeSummary = summaryText.value
      }
      snackbarStore.show({ message: 'Discharge summary saved successfully', type: 'success' })
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
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const printSummary = () => {
  const patient = props.admission?.patientId || {}
  const doctor = props.admission?.consultantDoctorId || {}
  const bed = props.admission?.bedId || {}
  const ward = bed?.wardId || {}

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Discharge Summary - ${patient.fullName || 'Patient'}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 3px double #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0 0 5px 0; color: #0f172a; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 0; font-size: 13px; color: #64748b; }
          .patient-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
          .info-block { font-size: 12px; }
          .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; margin-bottom: 2px; }
          .info-value { font-size: 13px; font-weight: 600; color: #0f172a; }
          .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 20px 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-content { font-size: 13px; background: #fff; padding: 15px 0; min-height: 350px; }
          .summary-content table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .summary-content th, .summary-content td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          .summary-content th { background-color: #f1f5f9; font-weight: bold; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
          .signature-box { text-align: center; width: 220px; }
          .signature-line { border-top: 1px solid #0f172a; padding-top: 8px; margin-top: 70px; font-weight: bold; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>IPD Patient Discharge Summary</h1>
          <p>Hospital Inpatient Clinical Discharge Record</p>
        </div>
        
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
            <div class="info-label">IPD Admission No</div>
            <div class="info-value">${props.admission.admissionNo || '-'}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Admission Date</div>
            <div class="info-value">${formatDate(props.admission.admissionDate)}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Ward / Bed No</div>
            <div class="info-value">Bed ${bed.bedNo || '-'} (${ward.name || '-'})</div>
          </div>
          <div class="info-block">
            <div class="info-label">Attending Doctor</div>
            <div class="info-value">Dr. ${doctor.fullName || 'Consultant'}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Status</div>
            <div class="info-value">${props.admission.status || 'ADMITTED'}</div>
          </div>
        </div>

        <div class="section-title">Clinical Course & Discharge Summary</div>
        <div class="summary-content">${summaryText.value || '<p>No discharge summary details entered.</p>'}</div>
        
        <div class="footer">
          <div>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Report Generated: ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <div class="signature-box">
            <div class="signature-line">Dr. ${doctor.fullName || 'Consultant Doctor'}<br><span style="font-weight: normal; font-size: 11px; color: #64748b;">(Authorized Signatory)</span></div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
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
  <div class="space-y-4">
    <!-- Action Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
      <div>
        <h3 class="font-bold text-slate-800 text-base">Inpatient Discharge Summary</h3>
        <p class="text-xs text-slate-500">Draft, format, save, and print out clinical discharge records for the patient.</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          type="button"
          @click="printSummary"
          class="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Summary
        </button>

        <button 
          type="button"
          @click="saveSummary"
          :disabled="saving"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Save Summary
        </button>
      </div>
    </div>

    <!-- Rich Tiptap Text Editor -->
    <div class="relative">
      <div v-if="editor" class="tiptap-wrapper border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
        <!-- Word-like Rich Formatting Toolbar -->
        <div class="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 select-none">
          <!-- Headings -->
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 1 }) }]" title="Heading 1">H1</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 2 }) }]" title="Heading 2">H2</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 3 }) }]" title="Heading 3">H3</button>

          <div class="w-px h-5 bg-slate-300 mx-1"></div>

          <!-- Basic Formatting: Bold, Italic, Underline, Strike -->
          <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="['tiptap-btn', { active: editor.isActive('bold') }]" title="Bold (Ctrl+B)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="['tiptap-btn', { active: editor.isActive('italic') }]" title="Italic (Ctrl+I)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4-8m-8 4l-4 8"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="['tiptap-btn', { active: editor.isActive('underline') }]" title="Underline (Ctrl+U)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8v8a5 5 0 0010 0V8M5 20h14"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="['tiptap-btn', { active: editor.isActive('strike') }]" title="Strikethrough">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M9 6h6M9 18h6"/></svg>
          </button>

          <div class="w-px h-5 bg-slate-300 mx-1"></div>

          <!-- Alignment -->
          <button type="button" @click="editor.chain().focus().setTextAlign('left').run()" :class="['tiptap-btn', { active: editor.isActive({ textAlign: 'left' }) }]" title="Align Left">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().setTextAlign('center').run()" :class="['tiptap-btn', { active: editor.isActive({ textAlign: 'center' }) }]" title="Align Center">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M5 18h14"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().setTextAlign('right').run()" :class="['tiptap-btn', { active: editor.isActive({ textAlign: 'right' }) }]" title="Align Right">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M10 12h10M6 18h14"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().setTextAlign('justify').run()" :class="['tiptap-btn', { active: editor.isActive({ textAlign: 'justify' }) }]" title="Justify">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          <div class="w-px h-5 bg-slate-300 mx-1"></div>

          <!-- Lists -->
          <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="['tiptap-btn', { active: editor.isActive('bulletList') }]" title="Bullet List">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16M8 6h.01M8 12h.01M8 18h.01"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="['tiptap-btn', { active: editor.isActive('orderedList') }]" title="Numbered List">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h14M7 12h14M7 16h14M3 8h.01M3 12h.01M3 16h.01"/></svg>
          </button>

          <div class="w-px h-5 bg-slate-300 mx-1"></div>

          <!-- Blockquote & Table -->
          <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="['tiptap-btn', { active: editor.isActive('blockquote') }]" title="Blockquote">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" class="tiptap-btn" title="Insert Table">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3z M3 9h18 M9 3v18 M15 3v18"/></svg>
          </button>

          <div class="flex-grow"></div>

          <!-- Undo & Redo -->
          <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" class="tiptap-btn" title="Undo (Ctrl+Z)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" class="tiptap-btn" title="Redo (Ctrl+Y)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
          </button>
        </div>

        <!-- Tiptap Editor Canvas -->
        <editor-content :editor="editor" class="min-h-[380px] p-6 text-sm bg-white font-sans text-slate-800 leading-relaxed" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tiptap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
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
  background: #e2e8f0;
  color: #1e293b;
}

.tiptap-btn.active {
  background: #e0e7ff;
  color: #4338ca;
}

.tiptap-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tiptap-wrapper :deep(.tiptap) {
  outline: none;
}
.tiptap-wrapper :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}
.tiptap-wrapper :deep(.tiptap h1) { font-size: 1.5em; font-weight: 800; margin: 0.6em 0 0.3em; color: #0f172a; }
.tiptap-wrapper :deep(.tiptap h2) { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; color: #1e293b; }
.tiptap-wrapper :deep(.tiptap h3) { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; color: #334155; }
.tiptap-wrapper :deep(.tiptap ul),
.tiptap-wrapper :deep(.tiptap ol) { padding-left: 1.5em; margin: 0.3em 0; }
.tiptap-wrapper :deep(.tiptap li) { margin: 0.15em 0; }
.tiptap-wrapper :deep(.tiptap blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #475569;
  font-style: italic;
  background: #f8fafc;
  padding-top: 0.4em;
  padding-bottom: 0.4em;
}
.tiptap-wrapper :deep(.tiptap table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}
.tiptap-wrapper :deep(.tiptap th),
.tiptap-wrapper :deep(.tiptap td) {
  border: 1px solid #cbd5e1;
  padding: 0.5em 0.8em;
  min-width: 3em;
}
.tiptap-wrapper :deep(.tiptap th) {
  background-color: #f1f5f9;
  font-weight: bold;
  text-align: left;
}
</style>
