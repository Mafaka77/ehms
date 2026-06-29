<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useEmergencyStore } from '../../../stores/emergencyStore'
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
  visit: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])
const snackbarStore = useSnackbarStore()
const emergencyStore = useEmergencyStore()

const summaryText = ref('')
const saving = ref(false)

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
      placeholder: 'Type the clinical discharge summary here...'
    })
  ],
  content: '',
  onUpdate({ editor: e }) {
    summaryText.value = e.getHTML()
  }
})

watch(() => props.visit, (newVal) => {
  if (newVal) {
    summaryText.value = newVal.dischargeSummary || ''
    if (editor.value) {
      editor.value.commands.setContent(summaryText.value)
    }
  }
}, { immediate: true })

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const saveSummary = async () => {
  saving.value = true
  try {
    await emergencyStore.updateDischargeSummary(props.visit._id, summaryText.value)
    snackbarStore.show({ message: 'Discharge summary saved successfully', type: 'success' })
    emit('refresh')
  } catch (error) {
    snackbarStore.show({ message: 'Failed to save discharge summary', type: 'error' })
  } finally {
    saving.value = false
  }
}

const printSummary = () => {
  const printContent = `
    <html>
      <head>
        <title>Discharge Summary - ${props.visit.patientId?.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0 0 10px 0; color: #1e293b; }
          .patient-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-block { flex: 1; }
          .info-label { font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 500; }
          .summary-content { white-space: pre-wrap; font-size: 14px; background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 300px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Emergency Discharge Summary</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="patient-info">
          <div class="info-block">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${props.visit.patientId?.fullName}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Patient Code</div>
            <div class="info-value">${props.visit.patientId?.patientCode}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Visit No</div>
            <div class="info-value">${props.visit.visitNo}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Attending Doctor</div>
            <div class="info-value">Dr. ${props.visit.doctorId?.fullName || 'On Duty'}</div>
          </div>
        </div>
        <h3 style="margin-bottom: 15px; color: #1e293b;">Clinical Summary & Instructions</h3>
        <div class="summary-content">${summaryText.value || 'No summary provided.'}</div>
        
        <div class="footer">
          <div></div>
          <div class="signature-box">
            <div class="signature-line">Doctor's Signature</div>
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
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-bold text-slate-800">Clinical Discharge Summary</h2>
      <button 
        @click="printSummary"
        class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Print Summary
      </button>
    </div>
    
    <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-4">
      <p class="font-medium flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Record final diagnosis, treatments administered, and home care instructions for the patient here.
      </p>
    </div>

    <div class="relative">
      <div v-if="editor" class="tiptap-wrapper border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 2 }) }]" title="Heading 2">H2</button>
          <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 3 }) }]" title="Heading 3">H3</button>
          
          <div class="w-px h-5 bg-slate-300 mx-1"></div>
          <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="['tiptap-btn', { active: editor.isActive('bold') }]" title="Bold">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="['tiptap-btn', { active: editor.isActive('italic') }]" title="Italic">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4-8m-8 4l-4 8"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="['tiptap-btn', { active: editor.isActive('underline') }]" title="Underline">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8v8a5 5 0 0010 0V8M5 20h14"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="['tiptap-btn', { active: editor.isActive('strike') }]" title="Strikethrough">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M9 6h6M9 18h6"/></svg>
          </button>
          
          <div class="w-px h-5 bg-slate-300 mx-1"></div>
          <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="['tiptap-btn', { active: editor.isActive('bulletList') }]" title="Bullet List">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16M8 6h.01M8 12h.01M8 18h.01"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="['tiptap-btn', { active: editor.isActive('orderedList') }]" title="Numbered List">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h14M7 12h14M7 16h14M3 8h.01M3 12h.01M3 16h.01"/></svg>
          </button>
          
          <div class="w-px h-5 bg-slate-300 mx-1"></div>
          <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="['tiptap-btn', { active: editor.isActive('blockquote') }]" title="Blockquote">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" class="tiptap-btn" title="Insert Table">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3z M3 9h18 M9 3v18 M15 3v18"/></svg>
          </button>

          <div class="flex-grow"></div>
          <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" class="tiptap-btn" title="Undo">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
          </button>
          <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" class="tiptap-btn" title="Redo">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
          </button>
        </div>
        <!-- Editor Content -->
        <editor-content :editor="editor" class="min-h-[250px] p-4 text-sm bg-white" />
      </div>
    </div>

    <div class="flex justify-end pt-2">
      <button
        @click="saveSummary"
        :disabled="saving"
        class="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 rounded-xl font-semibold text-sm shadow-md shadow-emerald-100 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
      >
        <span v-if="saving" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Save Discharge Summary
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Tiptap styles */
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
  background: #e2e8f0;
  color: #334155;
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
.tiptap-wrapper :deep(.tiptap h2) { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; }
.tiptap-wrapper :deep(.tiptap h3) { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.25em; }
.tiptap-wrapper :deep(.tiptap ul),
.tiptap-wrapper :deep(.tiptap ol) { padding-left: 1.5em; margin: 0.3em 0; }
.tiptap-wrapper :deep(.tiptap li) { margin: 0.15em 0; }
.tiptap-wrapper :deep(.tiptap blockquote) {
  border-left: 3px solid #e2e8f0;
  padding-left: 1em;
  margin-left: 0;
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
</style>
