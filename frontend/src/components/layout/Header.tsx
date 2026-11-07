import React from 'react'
import { BookOpen } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

export interface HeaderProps {
  title?: string
  subtitle?: string
  showRagSelector?: boolean
  showPdfToggle?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showRagSelector = true,
  showPdfToggle = true,
}) => {
  const {
    activeRagStrategy,
    setRagStrategy,
    pdfViewerOpen,
    setPdfViewerOpen,
    selectedDocumentIds,
  } = useWorkspaceStore()

  const strategies: Array<{ id: 'basic' | 'hyde' | 'fusion'; label: string; desc: string }> = [
    { id: 'basic', label: 'Basic', desc: 'Direct vector similarity' },
    { id: 'hyde', label: 'HyDE', desc: 'Hypothetical embeddings' },
    { id: 'fusion', label: 'Fusion', desc: 'Reciprocal rank fusion' },
  ]

  return (
    <header className="h-13 border-b border-subtle bg-surface px-4 flex items-center justify-between shrink-0 z-20">
      {/* Left: Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-primary tracking-tight">
          {title || 'Workspace'}
        </h1>
        {subtitle && (
          <span className="text-xs text-muted hidden lg:inline">
            — {subtitle}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* RAG Strategy Pill Selector */}
        {showRagSelector && (
          <div className="flex items-center bg-card border border-subtle rounded-lg p-0.5">
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() => setRagStrategy(s.id)}
                title={s.desc}
                className={clsx(
                  'px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer',
                  activeRagStrategy === s.id
                    ? 'bg-[#e06c38] text-white'
                    : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected docs scope badge */}
        {selectedDocumentIds.length > 0 && (
          <Badge variant="accent" size="sm">
            {selectedDocumentIds.length} scoped
          </Badge>
        )}

        {/* PDF Viewer Toggle */}
        {showPdfToggle && (
          <Button
            variant={pdfViewerOpen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPdfViewerOpen(!pdfViewerOpen)}
            leftIcon={<BookOpen className="w-3.5 h-3.5 text-[#fb923c]" />}
            className="text-xs"
          >
            {pdfViewerOpen ? 'Close PDF' : 'View PDF'}
          </Button>
        )}
      </div>
    </header>
  )
}
