import React, { useState } from 'react'
import {
  Compass,
  Download,
  ExternalLink,
  Search,
  CheckCircle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArxivResultSkeleton } from '@/components/ui/Skeleton'
import { arxivApi } from '@/api/arxiv'
import type { ArxivPaper } from '@/types'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface ArxivSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ArxivSearchModal: React.FC<ArxivSearchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeWorkspaceId } = useWorkspaceStore()
  const [searchQuery, setSearchQuery] = useState('Retrieval Augmented Generation')
  const [category, setCategory] = useState<string>('')
  const [results, setResults] = useState<ArxivPaper[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [ingestingId, setIngestingId] = useState<string | null>(null)
  const [ingestedMap, setIngestedMap] = useState<Record<string, boolean>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const categories = [
    { id: '', label: 'All Categories' },
    { id: 'cs.AI', label: 'cs.AI (Artificial Intelligence)' },
    { id: 'cs.CL', label: 'cs.CL (Computation & Language)' },
    { id: 'cs.LG', label: 'cs.LG (Learning)' },
    { id: 'stat.ML', label: 'stat.ML (Machine Learning)' },
  ]

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      setErrorMsg(null)
      const data = await arxivApi.search(searchQuery.trim(), category || undefined, 8)
      setResults(data)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleIngest = async (paper: ArxivPaper) => {
    if (!activeWorkspaceId) return

    try {
      setIngestingId(paper.arxiv_id)
      await arxivApi.ingest({
        workspace_id: activeWorkspaceId,
        arxiv_id: paper.arxiv_id,
        title: paper.title,
        pdf_url: paper.pdf_url,
      })
      setIngestedMap((prev) => ({ ...prev, [paper.arxiv_id]: true }))
      onSuccess?.()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ingest failed')
    } finally {
      setIngestingId(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search & Import from arXiv"
      description="Query papers by title, author, topic, or arXiv ID and import directly into your workspace."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search Bar & Category Filters */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Transformers, Reciprocal Rank Fusion, HyDE..."
              leftIcon={<Search className="w-4 h-4 text-muted" />}
              autoFocus
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-card text-xs text-secondary border border-subtle rounded-lg px-3 outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" isLoading={isSearching}>
            Search
          </Button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {isSearching ? (
            <div className="space-y-3">
              <ArxivResultSkeleton />
              <ArxivResultSkeleton />
              <ArxivResultSkeleton />
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-muted text-xs select-none">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Search arXiv to explore preprints and add them to your research workspace.</p>
            </div>
          ) : (
            results.map((paper) => {
              const isIngested = ingestedMap[paper.arxiv_id]
              const isIngesting = ingestingId === paper.arxiv_id

              return (
                <div
                  key={paper.arxiv_id}
                  className="p-4 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="accent" size="sm">
                          {paper.primary_category}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted">
                          {paper.arxiv_id}
                        </span>
                        <span className="text-[10px] text-muted">
                          {new Date(paper.published).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-primary font-serif leading-snug">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-secondary mt-0.5 truncate">
                        {paper.authors.join(', ')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/5"
                        title="Open on arXiv"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <Button
                        size="sm"
                        variant={isIngested ? 'secondary' : 'primary'}
                        onClick={() => handleIngest(paper)}
                        disabled={isIngested || isIngesting}
                        isLoading={isIngesting}
                        leftIcon={
                          isIngested ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {isIngested ? 'Added' : isIngesting ? 'Ingesting...' : 'Import'}
                      </Button>
                    </div>
                  </div>

                  {/* Summary snippet */}
                  <p className="text-xs text-secondary line-clamp-3 leading-relaxed">
                    {paper.summary}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
