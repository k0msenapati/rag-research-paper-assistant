import React, { useState, useRef } from 'react'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { documentsApi } from '@/api/documents'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeWorkspaceId } = useWorkspaceStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.')
        return
      }
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.')
        return
      }
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !activeWorkspaceId) return

    try {
      setIsUploading(true)
      setUploadError(null)
      await documentsApi.upload(activeWorkspaceId, selectedFile)
      setUploadSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1000)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploadError(null)
    setUploadSuccess(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Research Paper"
      description="Upload an academic PDF to extract text chunks, compute vector embeddings, and generate citation coordinates."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-subtle hover:border-[#e06c38]/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-card hover:bg-card-hover"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-[#e06c38]/15 border border-[#e06c38]/30 text-[#fb923c] flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-primary">
            {selectedFile ? selectedFile.name : 'Click or drag & drop PDF here'}
          </p>
          <p className="text-xs text-muted mt-1">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
              : 'Academic research papers, preprints, conference proceedings (up to 50MB)'}
          </p>
        </div>

        {uploadError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Document processed and indexed into ChromaDB successfully!</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadSuccess}
            isLoading={isUploading}
          >
            {isUploading ? 'Chunking & Embedding...' : 'Upload & Index'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
