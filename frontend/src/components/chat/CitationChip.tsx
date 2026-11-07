import React, { useState } from 'react'
import type { Citation } from '@/types'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface CitationChipProps {
  citationIndex: number
  citations?: Citation[]
}

export const CitationChip: React.FC<CitationChipProps> = ({
  citationIndex,
  citations = [],
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const { openPdfDocument, activeCitation } = useWorkspaceStore()

  const cit = citations.find((c) => c.citation_index === citationIndex)
  const isSelected = activeCitation?.citation_index === citationIndex

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (cit) {
      openPdfDocument(cit.document_id, cit.page_number, cit)
    }
  }

  return (
    <span className="relative inline-block mx-0.5 align-baseline">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center justify-center font-mono text-[11px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer select-none ${
          isSelected
            ? 'bg-[#e06c38] text-white ring-2 ring-[#e06c38]/40 shadow-xs'
            : 'bg-[#e06c38]/15 text-[#fb923c] border border-[#e06c38]/30 hover:bg-[#e06c38]/30 hover:border-[#e06c38]/50'
        }`}
        title={cit ? `Click to inspect Citation [${citationIndex}] in PDF` : `Citation [${citationIndex}]`}
      >
        [{citationIndex}]
      </button>

      {/* Solid High-Contrast Hover preview tooltip */}
      {showTooltip && cit && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-[#18181c] border border-black/10 dark:border-white/10 rounded-lg shadow-2xl text-left z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between text-[10px] text-[#e06c38] dark:text-[#fb923c] font-bold mb-1">
            <span>Citation [{cit.citation_index}]</span>
            <span className="text-stone-600 dark:text-stone-400 font-mono">Page {cit.page_number}</span>
          </div>
          {cit.document_title && (
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate mb-1">
              {cit.document_title}
            </p>
          )}
          <p className="text-[11px] text-stone-700 dark:text-stone-300 italic font-serif line-clamp-3 leading-relaxed">
            "{cit.quoted_text}"
          </p>
          <div className="mt-1.5 text-[9px] text-[#fb923c] font-mono">
            Click to open & highlight on page {cit.page_number} →
          </div>
        </div>
      )}
    </span>
  )
}

export const renderWithCitations = (content: string, citations: Citation[] = []) => {
  if (!content) return null
  const parts = content.split(/(\[\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      const idx = parseInt(match[1], 10)
      return <CitationChip key={i} citationIndex={idx} citations={citations} />
    }
    return part
  })
}
