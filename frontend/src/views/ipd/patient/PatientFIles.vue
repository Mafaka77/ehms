<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useIpdAdmissionStore } from '../../../stores/ipdAdmissionStore'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import api from '../../../axios/api'
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

const admissionStore = useIpdAdmissionStore()
const snackbarStore = useSnackbarStore()

// Tabs
const activeSubTab = ref('files') // files, notes

// State
const files = ref([])
const notes = ref([])
const filesLoading = ref(false)
const notesLoading = ref(false)

// Upload Modal State
const showUploadModal = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadDescription = ref('')
const fileInputRef = ref(null)

// Note Modal State
const showNoteModal = ref(false)
const noteSubmitting = ref(false)
const noteForm = ref({
  noteType: 'CLINICAL_NOTE',
  note: ''
})

// Tiptap Editor
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
      placeholder: 'Type clinical assessments, nurse shift changes, or test outcomes...'
    })
  ],
  content: '',
  onUpdate({ editor: e }) {
    noteForm.value.note = e.getHTML()
  }
})

// Sync editor when modal opens/closes
watch(showNoteModal, (open) => {
  if (open && editor.value) {
    editor.value.commands.setContent(noteForm.value.note || '')
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Fetch Files
const fetchFiles = async () => {
  filesLoading.value = true
  const res = await admissionStore.fetchAdmissionFiles(props.admissionId)
  if (res.success) {
    files.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  filesLoading.value = false
}

// Fetch Notes
const fetchNotes = async () => {
  notesLoading.value = true
  const res = await admissionStore.fetchAdmissionNotes(props.admissionId)
  if (res.success) {
    notes.value = res.data
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  notesLoading.value = false
}

// File Select Handler
const onFileChange = (e) => {
  const selected = e.target.files[0]
  if (selected) {
    if (selected.size > 10 * 1024 * 1024) {
      snackbarStore.show({ message: 'File size exceeds 10MB limit.', type: 'warning' })
      fileInputRef.value.value = ''
      uploadFile.value = null
      return
    }
    uploadFile.value = selected
  }
}

// Trigger file input click
const triggerFileInput = () => {
  fileInputRef.value.click()
}

// Upload File Submit
const submitUpload = async () => {
  if (!uploadFile.value) {
    snackbarStore.show({ message: 'Please select a file to upload.', type: 'warning' })
    return
  }

  uploading.value = true
  const formData = new FormData()
  formData.append('file', uploadFile.value)
  formData.append('description', uploadDescription.value)

  const res = await admissionStore.uploadAdmissionFile(props.admissionId, formData)
  if (res.success) {
    snackbarStore.show({ message: 'Document uploaded successfully.', type: 'success' })
    showUploadModal.value = false
    uploadFile.value = null
    uploadDescription.value = ''
    if (fileInputRef.value) fileInputRef.value.value = ''
    await fetchFiles()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  uploading.value = false
}

// Delete File
const deleteFile = async (fileId) => {
  if (!confirm('Are you sure you want to delete this document permanently?')) return

  const res = await admissionStore.deleteAdmissionFile(fileId)
  if (res.success) {
    snackbarStore.show({ message: 'Document deleted successfully.', type: 'success' })
    await fetchFiles()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
}

// Download File Securely
const downloadFile = async (file) => {
  try {
    const response = await api.get(`/ipd/admission/files/${file._id}/download`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file.fileName)
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    snackbarStore.show({ message: 'Failed to download document.', type: 'error' })
  }
}

const submitNote = async () => {
  // Strip HTML tags to check if there's actual content
  const strippedNote = noteForm.value.note.replace(/<[^>]*>/g, '').trim()
  if (!strippedNote) {
    snackbarStore.show({ message: 'Note content cannot be empty.', type: 'warning' })
    return
  }

  noteSubmitting.value = true
  const res = await admissionStore.createAdmissionNote(props.admissionId, noteForm.value)
  if (res.success) {
    snackbarStore.show({ message: 'Clinical note added successfully.', type: 'success' })
    showNoteModal.value = false
    noteForm.value = { noteType: 'CLINICAL_NOTE', note: '' }
    await fetchNotes()
  } else {
    snackbarStore.show({ message: res.message, type: 'error' })
  }
  noteSubmitting.value = false
}

// Helpers
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Curated Styling mapping based on note type
const getNoteBadgeClass = (type) => {
  switch (type) {
    case 'CLINICAL_NOTE':
      return 'bg-indigo-50 border-indigo-100 text-indigo-700'
    case 'PROGRESS_NOTE':
      return 'bg-sky-50 border-sky-100 text-sky-700'
    case 'DISCHARGE_SUMMARY':
      return 'bg-emerald-50 border-emerald-100 text-emerald-700'
    default:
      return 'bg-slate-50 border-slate-100 text-slate-700'
  }
}

// Curated file icon SVG matching
const getFileIcon = (fileType) => {
  const lowerType = fileType.toLowerCase()
  if (lowerType.includes('pdf')) {
    return {
      color: 'bg-rose-50 text-rose-500 border border-rose-100',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />`
    }
  } else if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('gif')) {
    return {
      color: 'bg-teal-50 text-teal-500 border border-teal-100',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 3.75 0 11-.75 0 .375 3.75 0 01.75 0z" />`
    }
  } else if (lowerType.includes('word') || lowerType.includes('document') || lowerType.includes('msword') || lowerType.includes('officedocument')) {
    return {
      color: 'bg-sky-50 text-sky-500 border border-sky-100',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 10.5h4.75m-4.75 3h4.75m-6.75-6h.008v.008H10.5v-.008zM5.625 21h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125z" />`
    }
  } else {
    return {
      color: 'bg-slate-50 text-slate-500 border border-slate-100',
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M5.625 21h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125z" />`
    }
  }
}

onMounted(async () => {
  await Promise.all([fetchFiles(), fetchNotes()])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Sub-tab Bar -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
      <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
        <button
          @click="activeSubTab = 'files'"
          class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeSubTab === 'files' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        >
          Uploaded Documents ({{ files.length }})
        </button>
        <button
          @click="activeSubTab = 'notes'"
          class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeSubTab === 'notes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
        >
          Clinical Notes Timeline ({{ notes.length }})
        </button>
      </div>

      <!-- Actions based on tab -->
      <div>
        <button
          v-if="activeSubTab === 'files'"
          @click="showUploadModal = true"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </button>
        <button
          v-if="activeSubTab === 'notes'"
          @click="showNoteModal = true"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Clinical Note
        </button>
      </div>
    </div>

    <!-- Tab 1: Uploaded Documents -->
    <div v-if="activeSubTab === 'files'" class="space-y-4">
      <div v-if="filesLoading" class="p-8 text-center text-slate-400">
        <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Fetching documents...
      </div>

      <div v-else-if="files.length === 0" class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
        <p class="font-bold text-slate-600">No Patient Documents Saved</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Upload test reports, scans, patient IDs, or signed consent agreements to keep everything under one file.</p>
        <button
          @click="showUploadModal = true"
          class="mt-4 px-4 py-2 border border-slate-200 text-indigo-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Upload First File
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="file in files"
          :key="file._id"
          class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
        >
          <!-- Document Icon matching type -->
          <div class="p-2.5 rounded-xl flex-shrink-0" :class="getFileIcon(file.fileType).color">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" v-html="getFileIcon(file.fileType).svg"></svg>
          </div>

          <!-- Document details -->
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-slate-800 text-xs truncate" :title="file.fileName">{{ file.fileName }}</h4>
            <p v-if="file.description" class="text-[11px] text-slate-500 mt-1 leading-relaxed">{{ file.description }}</p>
            <div class="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
              <span class="font-semibold">{{ formatBytes(file.fileSize) }}</span>
              <span>•</span>
              <span class="truncate">By {{ file.uploadedBy?.fullName || 'N/A' }}</span>
              <span>•</span>
              <span>{{ formatDate(file.createdAt) }}</span>
            </div>
          </div>

          <!-- Document action icons -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              @click="downloadFile(file)"
              title="Download file"
              class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100/30 transition-all cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
            <button
              @click="deleteFile(file._id)"
              title="Delete document"
              class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100/30 transition-all cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Clinical Notes Timeline -->
    <div v-if="activeSubTab === 'notes'" class="space-y-4">
      <div v-if="notesLoading" class="p-8 text-center text-slate-400">
        <svg class="animate-spin h-6 w-6 mx-auto text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Retrieving clinical timeline...
      </div>

      <div v-else-if="notes.length === 0" class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
        <p class="font-bold text-slate-600">Timeline is Empty</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No clinical progress notes or ward entries recorded. Document vitals checkups or clinical observations to construct the progression timeline.</p>
        <button
          @click="showNoteModal = true"
          class="mt-4 px-4 py-2 border border-slate-200 text-indigo-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Add First Note
        </button>
      </div>

      <div v-else class="relative border-l border-slate-200 pl-6 ml-4 space-y-6 py-2">
        <div
          v-for="note in notes"
          :key="note._id"
          class="relative space-y-2 group"
        >
          <!-- Timeline dot -->
          <div class="absolute w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white -left-[31.5px] top-1 group-hover:bg-indigo-600 group-hover:scale-125 transition-all"></div>
          
          <div class="flex justify-between items-center text-[10px]">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold border font-mono uppercase tracking-wider" :class="getNoteBadgeClass(note.noteType)">
                {{ note.noteType?.replace('_', ' ') }}
              </span>
              <span class="text-slate-700 font-bold text-xs">{{ note.createdBy?.fullName || 'N/A' }}</span>
            </div>
            <span class="text-slate-400 font-mono font-semibold">{{ formatDate(note.createdAt) }}</span>
          </div>
          <div class="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-4xl prose prose-sm prose-slate" v-html="note.note"></div>
        </div>
      </div>
    </div>

    <!-- Upload File Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Upload Clinical Document</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Attach medical files under this admission dossier.</p>
          </div>
          <button
            @click="showUploadModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <!-- File selection container -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Document File</label>
            <input
              type="file"
              ref="fileInputRef"
              @change="onFileChange"
              class="hidden"
            />
            
            <div
              @click="triggerFileInput"
              class="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50"
            >
              <svg class="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-xs font-semibold text-slate-600">
                {{ uploadFile ? uploadFile.name : 'Select clinical document file' }}
              </p>
              <p class="text-[10px] text-slate-400 mt-1">
                {{ uploadFile ? formatBytes(uploadFile.size) : 'PDF, PNG, JPG, or DOCX (Max 10MB)' }}
              </p>
            </div>
          </div>

          <!-- Description field -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description / Remarks</label>
            <textarea
              v-model="uploadDescription"
              rows="3"
              placeholder="Provide brief contents details (e.g., Blood test report, Consent waiver, ID copy...)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all"
            ></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            @click="showUploadModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitUpload"
            :disabled="uploading || !uploadFile"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="uploading" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Upload File
          </button>
        </div>
      </div>
    </div>

    <!-- Create Note Modal -->
    <div
      v-if="showNoteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
    >
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Add Clinical Note</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Record progress summaries or diagnosis entries.</p>
          </div>
          <button
            @click="showNoteModal = false"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <!-- Note Type -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Note Type</label>
            <select
              v-model="noteForm.noteType"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white font-medium text-xs transition-all animate-none"
            >
              <option value="CLINICAL_NOTE">Clinical Note</option>
              <option value="PROGRESS_NOTE">Progress Note</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="OTHER">Other Observations</option>
            </select>
          </div>

          <!-- Note Content (Tiptap WYSIWYG) -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Note Details</label>
            <div class="tiptap-wrapper border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <!-- Toolbar -->
              <div v-if="editor" class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                <!-- Heading -->
                <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 2 }) }]" title="Heading 2">H2</button>
                <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="['tiptap-btn', { active: editor.isActive('heading', { level: 3 }) }]" title="Heading 3">H3</button>
                <span class="w-px h-5 bg-slate-200 mx-1"></span>
                <!-- Formatting -->
                <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="['tiptap-btn', { active: editor.isActive('bold') }]" title="Bold">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="['tiptap-btn', { active: editor.isActive('italic') }]" title="Italic">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="['tiptap-btn', { active: editor.isActive('underline') }]" title="Underline">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="['tiptap-btn', { active: editor.isActive('strike') }]" title="Strikethrough">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
                </button>
                <span class="w-px h-5 bg-slate-200 mx-1"></span>
                <!-- Lists -->
                <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="['tiptap-btn', { active: editor.isActive('bulletList') }]" title="Bullet List">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="['tiptap-btn', { active: editor.isActive('orderedList') }]" title="Numbered List">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
                </button>
                <span class="w-px h-5 bg-slate-200 mx-1"></span>
                <!-- Block -->
                <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="['tiptap-btn', { active: editor.isActive('blockquote') }]" title="Blockquote">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" class="tiptap-btn" title="Insert Table">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>
                </button>
                <span class="w-px h-5 bg-slate-200 mx-1"></span>
                <!-- Undo/Redo -->
                <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" class="tiptap-btn" title="Undo">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                </button>
                <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" class="tiptap-btn" title="Redo">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
                </button>
              </div>
              <!-- Editor -->
              <EditorContent :editor="editor" />
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            @click="showNoteModal = false"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitNote"
            :disabled="noteSubmitting || !noteForm.note.replace(/<[^>]*>/g, '').trim()"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg v-if="noteSubmitting" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Add Note
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tiptap toolbar button */
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

/* Tiptap editor area */
.tiptap-wrapper :deep(.tiptap) {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
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
  border-left: 3px solid #cbd5e1;
  padding-left: 0.75em;
  color: #64748b;
  margin: 0.5em 0;
  font-style: italic;
}
.tiptap-wrapper :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}
.tiptap-wrapper :deep(.tiptap th),
.tiptap-wrapper :deep(.tiptap td) {
  border: 1px solid #e2e8f0;
  padding: 0.35em 0.5em;
  font-size: 0.9em;
  min-width: 60px;
}
.tiptap-wrapper :deep(.tiptap th) {
  background: #f1f5f9;
  font-weight: 600;
}

/* Prose styling for rendered HTML notes in timeline */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  font-weight: 700;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  color: #334155;
}
.prose :deep(h2) { font-size: 1em; }
.prose :deep(h3) { font-size: 0.9em; }
.prose :deep(p) { margin: 0.3em 0; }
.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5em;
  margin: 0.3em 0;
}
.prose :deep(li) { margin: 0.15em 0; }
.prose :deep(blockquote) {
  border-left: 3px solid #cbd5e1;
  padding-left: 0.75em;
  color: #64748b;
  margin: 0.5em 0;
  font-style: italic;
}
.prose :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}
.prose :deep(th),
.prose :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.35em 0.5em;
  font-size: 0.85em;
}
.prose :deep(th) {
  background: #f1f5f9;
  font-weight: 600;
}
.prose :deep(a) {
  color: #4f46e5;
  text-decoration: underline;
}
.prose :deep(strong) { font-weight: 700; }
.prose :deep(em) { font-style: italic; }
</style>
