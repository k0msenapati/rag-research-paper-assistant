import React, { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  Quote,
  X,
  AlertCircle,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { Skeleton } from '@/components/ui/Skeleton'

// Set worker source to match react-pdf's bundled pdfjs version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export const PdfViewer: React.FC = () => {
  const { workspaceId: routeWsId } = useParams({ strict: false }) as {
    workspaceId?: string
  }
  const {
    activeWorkspaceId,
    activePdfDocumentId,
    openPdfDocument,
    activePdfPage,
    setActivePdfPage,
    activeCitation,
    setActiveCitation,
    setPdfViewerOpen,
  } = useWorkspaceStore()

  const effectiveWsId = routeWsId || activeWorkspaceId

  const [numPages, setNumPages] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [error, setError] = useState<string | null>(null)

  // Fetch documents for the workspace
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', effectiveWsId],
    queryFn: () => (effectiveWsId ? documentsApi.list(effectiveWsId) : Promise.resolve([])),
    enabled: !!effectiveWsId,
  })

  const currentDoc = documents.find((d) => d.id === activePdfDocumentId) || documents[0]

  // Default select first document if none chosen
  useEffect(() => {
    if (!activePdfDocumentId && documents.length > 0) {
      openPdfDocument(documents[0].id, 1)
    }
  }, [activePdfDocumentId, documents, openPdfDocument])

  // Sync active page when user clicks a citation chip
  useEffect(() => {
    if (activeCitation && activeCitation.page_number) {
      setActivePdfPage(activeCitation.page_number)
    }
  }, [activeCitation, setActivePdfPage])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    console.error('react-pdf document load error:', err)
    setError('Failed to load PDF document.')
  }

  if (!currentDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-surface border-l border-subtle select-none">
        <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-primary mb-1">No Paper Selected</h3>
        <p className="text-xs text-muted max-w-xs mb-4">
          Upload a research PDF or search arXiv to inspect paper passages and verified citations.
        </p>
      </div>
    )
  }

  const pdfUrl = documentsApi.getPdfUrl(currentDoc.id)

  // Bounding box percentage coordinates: [ymin, xmin, ymax, xmax]
  const isHighlightVisible =
    activeCitation &&
    activeCitation.document_id === currentDoc.id &&
    activeCitation.page_number === activePdfPage &&
    Array.isArray(activeCitation.bounding_box) &&
    activeCitation.bounding_box.length === 4

  const [ymin, xmin, ymax, xmax] = isHighlightVisible ? activeCitation.bounding_box : [0, 0, 0, 0]
  const topPercent = Math.max(0, ymin)
  const leftPercent = Math.max(0, xmin)
  const widthPercent = Math.max(1, Math.min(100 - leftPercent, xmax - xmin))
  const heightPercent = Math.max(1, Math.min(100 - topPercent, ymax - ymin))

  return (
    <div className="h-full flex flex-col bg-surface border-l border-subtle relative overflow-hidden select-none">
      {/* 1. Sleek Top Bar (Zero Overlapping) */}
      <div className="h-11 border-b border-subtle px-3 flex items-center justify-between bg-surface shrink-0 z-10">
        {/* Document Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-3">
          <FileText className="w-4 h-4 text-[#fb923c] shrink-0" />
          <select
            value={currentDoc.id}
            onChange={(e) => openPdfDocument(e.target.value, 1)}
            className="w-full max-w-[280px] bg-card text-xs text-primary font-medium border border-subtle rounded-md px-2 py-1 outline-none truncate cursor-pointer shadow-2xs"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions: Download & Close */}
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new browser tab"
            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={pdfUrl}
            download={currentDoc.file_name}
            title="Download PDF"
            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setPdfViewerOpen(false)}
            title="Close viewer"
            className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SOLID, OPAQUE CITATION CARD (Text with X) - Fully Visible & Crisp */}
      {activeCitation && (
        <div className="absolute top-12 inset-x-3 z-30 rounded-xl bg-white dark:bg-[#18181c] border-2 border-[#e06c38] p-3.5 shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[#e06c38] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Quote className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#e06c38] dark:text-[#fb923c]">
                  Citation [{activeCitation.citation_index}]
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-800 dark:text-stone-200">
                  Page {activeCitation.page_number}
                </span>
                {activeCitation.document_title && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[200px]">
                    • {activeCitation.document_title}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-900 dark:text-stone-100 italic font-serif leading-relaxed line-clamp-3">
                "{activeCitation.quoted_text}"
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveCitation(null)}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Dismiss citation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main PDF Canvas Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-canvas relative pb-20">
        {error ? (
          <div className="p-8 text-center text-rose-500 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#fb923c] underline mt-2"
            >
              Open PDF directly in browser
            </a>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="w-full max-w-md pt-8 space-y-4">
                <Skeleton className="h-[550px] w-full rounded-lg" />
              </div>
            }
          >
            <div className="relative inline-block shadow-lg rounded-sm overflow-hidden bg-white">
              <Page
                pageNumber={Math.min(Math.max(activePdfPage, 1), numPages)}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />

              {/* Bounding-box Highlight Overlay for Citations */}
              {isHighlightVisible && (
                <div
                  style={{
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                  }}
                  className="absolute pointer-events-none rounded transition-all duration-300 border-2 border-[#e06c38] bg-[#e06c38]/30 shadow-[0_0_15px_rgba(224,108,56,0.6)] animate-pulse"
                />
              )}
            </div>
          </Document>
        )}
      </div>

      {/* 4. Floating page and zoom control toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#18181c] border border-black/10 dark:border-white/10 shadow-2xl text-xs">
          {/* Page Previous / Next */}
          <button
            onClick={() => setActivePdfPage(Math.max(activePdfPage - 1, 1))}
            disabled={activePdfPage <= 1}
            className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono text-secondary px-1 select-none whitespace-nowrap">
            {activePdfPage} / {numPages || 1}
          </span>

          <button
            onClick={() => setActivePdfPage(Math.min(activePdfPage + 1, numPages))}
            disabled={activePdfPage >= numPages}
            className="p-1 text-muted hover:text-primary disabled:opacity-30 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-black/10 dark:bg-white/10 mx-1" />

          {/* Zoom Out / In */}
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            className="p-1 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Zoom out"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="text-[11px] font-mono text-secondary w-9 text-center select-none">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            className="p-1 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Zoom in"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
