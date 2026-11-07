import React, { useState } from 'react'
import {
  BookOpen,
  CheckSquare,
  Compass,
  FileText,
  Sliders,
  Square,
  Upload,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { Button } from '@/components/ui/Button'
import { DocumentUploadModal } from '@/components/library/DocumentUploadModal'
import { ArxivSearchModal } from '@/components/arxiv/ArxivSearchModal'

export const DocumentScopePanel: React.FC = () => {
  const {
    activeWorkspaceId,
    selectedDocumentIds,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    openPdfDocument,
    activePdfDocumentId,
    topK,
    setTopK,
    rrfK,
    setRrfK,
    activeRagStrategy,
  } = useWorkspaceStore()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isArxivOpen, setIsArxivOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: () => (activeWorkspaceId ? documentsApi.list(activeWorkspaceId) : Promise.resolve([])),
    enabled: !!activeWorkspaceId,
  })

  const allSelected = documents.length > 0 && selectedDocumentIds.length === documents.length

  const handleToggleAll = () => {
    if (allSelected) {
      clearDocumentSelection()
    } else {
      selectAllDocuments(documents.map((d) => d.id))
    }
  }

  return (
    <>
      <div className="w-72 bg-surface border-r border-subtle flex flex-col h-full shrink-0 select-none">
        {/* Header */}
        <div className="p-3 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#fb923c]" />
            <h3 className="text-xs font-semibold text-primary">Paper Scope</h3>
            <span className="text-[10px] text-muted">
              ({selectedDocumentIds.length}/{documents.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Retrieval Settings"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#e06c38]/20 text-[#fb923c]'
                  : 'text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-2.5 border-b border-subtle grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5 text-[#fb923c]" />}
            className="text-xs"
          >
            Upload PDF
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsArxivOpen(true)}
            leftIcon={<Compass className="w-3.5 h-3.5 text-[#fb923c]" />}
            className="text-xs"
          >
            arXiv Paper
          </Button>
        </div>

        {/* Config drawer if settings clicked */}
        {showSettings && (
          <div className="p-3 bg-card border-b border-subtle space-y-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <div className="flex justify-between text-secondary mb-1">
                <span>Top-K Chunks</span>
                <span className="font-mono text-[#fb923c] font-semibold">{topK}</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-[#e06c38] cursor-pointer"
              />
            </div>

            {activeRagStrategy === 'fusion' && (
              <div>
                <div className="flex justify-between text-secondary mb-1">
                  <span>RRF Constant (k)</span>
                  <span className="font-mono text-[#fb923c] font-semibold">{rrfK}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={rrfK}
                  onChange={(e) => setRrfK(Number(e.target.value))}
                  className="w-full accent-[#e06c38] cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Select All Toggle Bar */}
        {documents.length > 0 && (
          <div className="px-3 py-2 border-b border-subtle flex items-center justify-between text-[11px] text-muted">
            <span>Filter RAG context</span>
            <button
              onClick={handleToggleAll}
              className="text-[#fb923c] hover:underline cursor-pointer"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-muted text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No papers uploaded yet.</p>
              <p className="text-[11px] mt-1 text-muted">
                Upload PDFs or import from arXiv above.
              </p>
            </div>
          ) : (
            documents.map((doc) => {
              const isChecked = selectedDocumentIds.includes(doc.id)
              const isOpenInViewer = activePdfDocumentId === doc.id

              return (
                <div
                  key={doc.id}
                  onClick={() => openPdfDocument(doc.id, 1)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer group flex items-start gap-2.5 ${
                    isOpenInViewer
                      ? 'bg-card border-[#e06c38]/50 shadow-xs'
                      : 'bg-card border-subtle hover:border-[#e06c38]/30 hover:bg-card-hover'
                  }`}
                >
                  {/* Scope Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDocumentSelection(doc.id)
                    }}
                    className="mt-0.5 text-muted hover:text-[#fb923c] cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#fb923c]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Paper Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-primary truncate group-hover:text-[#fb923c] transition-colors">
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                      <span>{doc.total_pages} pages</span>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                      {doc.arxiv_id && (
                        <>
                          <span>•</span>
                          <span className="text-[#fb923c] font-mono">arXiv</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* arXiv Explorer Modal */}
      <ArxivSearchModal
        isOpen={isArxivOpen}
        onClose={() => setIsArxivOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  )
}
