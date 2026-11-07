import React, { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { workspacesApi } from '@/api/workspaces'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PaperCardSkeleton } from '@/components/ui/Skeleton'
import { DocumentUploadModal } from '@/components/library/DocumentUploadModal'
import { ArxivSearchModal } from '@/components/arxiv/ArxivSearchModal'
import { ChunkInspectorModal } from '@/components/library/ChunkInspectorModal'
import {
  BookOpen,
  Compass,
  FileText,
  Layers,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  Eye,
} from 'lucide-react'

export const LibraryRoute: React.FC = () => {
  const { workspaceId } = useParams({ strict: false }) as { workspaceId?: string }
  const navigate = useNavigate()
  const { activeWorkspaceId, setActiveWorkspaceId, openPdfDocument } = useWorkspaceStore()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isArxivOpen, setIsArxivOpen] = useState(false)
  const [inspectDocId, setInspectDocId] = useState<string | null>(null)
  const [inspectDocTitle, setInspectDocTitle] = useState<string>('')

  React.useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId)
    }
  }, [workspaceId, activeWorkspaceId, setActiveWorkspaceId])

  const targetWsId = workspaceId || activeWorkspaceId

  const { data: workspace } = useQuery({
    queryKey: ['workspace', targetWsId],
    queryFn: () => (targetWsId ? workspacesApi.get(targetWsId) : Promise.resolve(null)),
    enabled: !!targetWsId,
  })

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', targetWsId],
    queryFn: () => (targetWsId ? documentsApi.list(targetWsId) : Promise.resolve([])),
    enabled: !!targetWsId,
  })

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this document from the workspace?')) return
    try {
      await documentsApi.delete(docId)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenPdf = (docId: string) => {
    openPdfDocument(docId, 1)
    if (targetWsId) {
      navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: targetWsId } })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      <Header
        title="Paper Library"
        showRagSelector={false}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
            <div>
              <h2 className="text-xl font-semibold text-primary font-serif">
                Indexed Research Papers
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                {documents.length} paper{documents.length !== 1 ? 's' : ''} available for grounded RAG generation and citation lookup.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsArxivOpen(true)}
                leftIcon={<Compass className="w-3.5 h-3.5 text-[#fb923c]" />}
              >
                Import from arXiv
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload PDF
              </Button>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PaperCardSkeleton />
              <PaperCardSkeleton />
              <PaperCardSkeleton />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-card border border-subtle space-y-3 shadow-2xs">
              <BookOpen className="w-10 h-10 text-muted mx-auto opacity-30" />
              <h3 className="text-sm font-semibold text-primary">Library is Empty</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Upload PDFs or search arXiv to populate your workspace with academic papers.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Research PDF
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 hover:bg-card-hover transition-all space-y-3 flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={
                          doc.status === 'ready'
                            ? 'success'
                            : doc.status === 'processing'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {doc.status}
                      </Badge>

                      {doc.arxiv_id && (
                        <span className="text-[10px] font-mono text-[#fb923c] px-1.5 py-0.5 rounded bg-[#e06c38]/10 border border-[#e06c38]/20">
                          {doc.arxiv_id}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-primary font-serif leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted truncate font-mono">
                      {doc.file_name}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <span>{doc.total_pages} pages</span>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setInspectDocId(doc.id)
                          setInspectDocTitle(doc.title)
                        }}
                        title="Inspect Chunks & Coordinates"
                        className="p-1.5 text-muted hover:text-[#fb923c] rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenPdf(doc.id)}
                        title="Open in PDF Reader"
                        className="p-1.5 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        title="Delete Document"
                        className="p-1.5 text-muted hover:text-rose-400 rounded hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* arXiv Modal */}
      <ArxivSearchModal
        isOpen={isArxivOpen}
        onClose={() => setIsArxivOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Chunk Inspector */}
      <ChunkInspectorModal
        isOpen={!!inspectDocId}
        documentId={inspectDocId}
        documentTitle={inspectDocTitle}
        onClose={() => setInspectDocId(null)}
      />
    </div>
  )
}
