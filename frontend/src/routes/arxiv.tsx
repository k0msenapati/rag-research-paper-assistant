import React, { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArxivResultSkeleton } from '@/components/ui/Skeleton'
import { arxivApi } from '@/api/arxiv'
import type { ArxivPaper } from '@/types'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  Compass,
  Download,
  ExternalLink,
  Search,
  CheckCircle,
  Sparkles,
} from 'lucide-react'

export const ArxivRoute: React.FC = () => {
  const { workspaceId } = useParams({ strict: false }) as { workspaceId?: string }
  const { activeWorkspaceId } = useWorkspaceStore()
  const targetWsId = workspaceId || activeWorkspaceId

  const [query, setQuery] = useState('Large Language Models Reasoning')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState<ArxivPaper[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [ingestingId, setIngestingId] = useState<string | null>(null)
  const [ingestedMap, setIngestedMap] = useState<Record<string, boolean>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const categories = [
    { id: '', label: 'All Fields' },
    { id: 'cs.AI', label: 'Artificial Intelligence (cs.AI)' },
    { id: 'cs.CL', label: 'Computation and Language (cs.CL)' },
    { id: 'cs.LG', label: 'Machine Learning (cs.LG)' },
    { id: 'stat.ML', label: 'Statistics - Machine Learning (stat.ML)' },
    { id: 'cs.CV', label: 'Computer Vision (cs.CV)' },
  ]

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    try {
      setIsSearching(true)
      setErrorMsg(null)
      const data = await arxivApi.search(query.trim(), category || undefined, 12)
      setResults(data)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'arXiv search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleIngest = async (paper: ArxivPaper) => {
    if (!targetWsId) return

    try {
      setIngestingId(paper.arxiv_id)
      await arxivApi.ingest({
        workspace_id: targetWsId,
        arxiv_id: paper.arxiv_id,
        title: paper.title,
        pdf_url: paper.pdf_url,
      })
      setIngestedMap((prev) => ({ ...prev, [paper.arxiv_id]: true }))
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ingestion failed')
    } finally {
      setIngestingId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      <Header
        title="arXiv Search"
        showRagSelector={false}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Search Box */}
          <div className="p-5 rounded-2xl bg-card border border-subtle space-y-3 shadow-2xs">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search papers by keyword, title, author, or arXiv ID..."
                  leftIcon={<Search className="w-4 h-4" />}
                  autoFocus
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-card text-xs text-secondary border border-subtle rounded-lg px-3 py-2 outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSearching}
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Search arXiv
              </Button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Results List */}
          <div className="space-y-3">
            {isSearching ? (
              <div className="space-y-3">
                <ArxivResultSkeleton />
                <ArxivResultSkeleton />
                <ArxivResultSkeleton />
              </div>
            ) : results.length === 0 ? (
              <div className="py-20 text-center text-muted text-xs select-none">
                <Compass className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-primary">Explore Academic Papers</p>
                <p className="mt-1">
                  Type an academic query above to search directly against the official arXiv API.
                </p>
              </div>
            ) : (
              results.map((paper) => {
                const isIngested = ingestedMap[paper.arxiv_id]
                const isIngesting = ingestingId === paper.arxiv_id

                return (
                  <div
                    key={paper.arxiv_id}
                    className="p-5 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="accent" size="sm">
                            {paper.primary_category}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted">
                            arXiv:{paper.arxiv_id}
                          </span>
                          <span className="text-[11px] text-muted">
                            {new Date(paper.published).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-primary font-serif leading-snug">
                          {paper.title}
                        </h3>
                        <p className="text-xs text-secondary mt-1">
                          {paper.authors.join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-muted hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Open original arXiv PDF"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <Button
                          size="sm"
                          variant={isIngested ? 'secondary' : 'primary'}
                          onClick={() => handleIngest(paper)}
                          disabled={isIngested || isIngesting || !targetWsId}
                          isLoading={isIngesting}
                          leftIcon={
                            isIngested ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {isIngested
                            ? 'Imported'
                            : isIngesting
                            ? 'Processing PDF...'
                            : 'Import to Workspace'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                      {paper.summary}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
