import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Layers, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export interface ChunkInspectorModalProps {
  documentId: string | null
  documentTitle?: string
  isOpen: boolean
  onClose: () => void
}

export const ChunkInspectorModal: React.FC<ChunkInspectorModalProps> = ({
  documentId,
  documentTitle,
  isOpen,
  onClose,
}) => {
  const [filterText, setFilterText] = useState('')

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ['chunks', documentId],
    queryFn: () => (documentId ? documentsApi.getChunks(documentId) : Promise.resolve([])),
    enabled: !!documentId && isOpen,
  })

  const filteredChunks = chunks.filter((c) =>
    c.text.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#fb923c]" />
          <span>Chunk Inspector</span>
        </div>
      }
      description={`Viewing extracted vector chunks for "${documentTitle || 'Document'}" (${chunks.length} chunks indexed in ChromaDB)`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Search within chunks */}
        <div className="flex items-center justify-between gap-4">
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search within extracted chunks..."
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full max-w-sm"
          />
          <span className="text-xs text-muted font-mono">
            Showing {filteredChunks.length} of {chunks.length}
          </span>
        </div>

        {/* Chunks Feed */}
        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs">
              No matching chunks found.
            </div>
          ) : (
            filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-3.5 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 transition-colors space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" size="sm">
                      Chunk #{chunk.chunk_index}
                    </Badge>
                    <span className="text-secondary font-medium">Page {chunk.page_number}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted">
                    BBox: [{chunk.bounding_box.map((n) => n.toFixed(1)).join(', ')}]%
                  </span>
                </div>
                <p className="text-xs text-primary font-mono bg-surface p-3 rounded-lg border border-subtle leading-relaxed whitespace-pre-wrap">
                  {chunk.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
