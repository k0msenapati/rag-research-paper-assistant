import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { analysisApi } from '@/api/analysis'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { ComparisonData } from '@/types'
import { Button } from '@/components/ui/Button'
import { SummaryBlockSkeleton } from '@/components/ui/Skeleton'
import { CitationChip, renderWithCitations } from '@/components/chat/CitationChip'
import { CheckSquare, GitCompare, Sparkles, Square } from 'lucide-react'

export const CompareTab: React.FC = () => {
  const { activeWorkspaceId, selectedModel } = useWorkspaceStore()
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: () => (activeWorkspaceId ? documentsApi.list(activeWorkspaceId) : Promise.resolve([])),
    enabled: !!activeWorkspaceId,
  })

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleCompare = async () => {
    if (selectedDocs.length < 2) return
    try {
      setLoading(true)
      setError(null)
      const data = await analysisApi.compare(selectedDocs, selectedModel)
      setComparison(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Paper selection header */}
      <div className="p-4 rounded-xl bg-card border border-subtle space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#fb923c]" />
            <h3 className="text-xs font-semibold text-primary">
              Select Papers to Compare (minimum 2)
            </h3>
          </div>
          <Button
            variant="primary"
            onClick={handleCompare}
            disabled={selectedDocs.length < 2 || loading}
            isLoading={loading}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {loading ? 'Comparing...' : `Compare ${selectedDocs.length} Papers`}
          </Button>
        </div>

        {/* Paper Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {documents.map((doc) => {
            const isSelected = selectedDocs.includes(doc.id)
            return (
              <button
                key={doc.id}
                onClick={() => toggleDoc(doc.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#e06c38]/15 border-[#e06c38]/40 text-[#fb923c]'
                    : 'bg-card border-subtle text-secondary hover:text-primary hover:bg-card-hover'
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span className="truncate max-w-[200px]">{doc.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <SummaryBlockSkeleton />
      ) : comparison ? (
        <div className="space-y-6">
          {/* Synthesis Block */}
          <div className="p-5 rounded-xl bg-card border border-subtle space-y-2 shadow-2xs">
            <h4 className="text-sm font-semibold text-primary font-serif">
              Cross-Paper Synthesis
            </h4>
            <div className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">
              {renderWithCitations(comparison.synthesis, comparison.citations)}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl border border-subtle bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-subtle bg-surface text-secondary">
                    <th className="p-3.5 font-semibold text-primary w-1/4">
                      Research Dimension
                    </th>
                    {comparison.documents.map((d) => (
                      <th key={d.id} className="p-3.5 font-semibold text-primary">
                        {d.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {comparison.comparison_table.map((row, i) => (
                    <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="p-3.5 font-medium text-[#fb923c] align-top bg-surface/50">
                        {row.aspect}
                      </td>
                      {comparison.documents.map((d) => (
                        <td key={d.id} className="p-3.5 text-secondary align-top leading-relaxed">
                          {renderWithCitations(
                            row.paper_analyses[d.id] || row.paper_analyses[d.title] || 'N/A',
                            comparison.citations
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Citations */}
          {comparison.citations.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-subtle shadow-2xs">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Referenced Citations (Click to open in PDF reader)
              </span>
              <div className="flex flex-wrap gap-2">
                {comparison.citations.map((c) => (
                  <CitationChip
                    key={c.id || c.citation_index}
                    citationIndex={c.citation_index}
                    citations={comparison.citations}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-muted text-xs">
          <GitCompare className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium text-primary">No Comparison Generated</p>
          <p className="mt-1">
            Check two or more papers above and click Compare to evaluate methodologies and findings side-by-side.
          </p>
        </div>
      )}
    </div>
  )
}
