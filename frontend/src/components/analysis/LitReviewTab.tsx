import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { analysisApi } from '@/api/analysis'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { LitReviewData } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SummaryBlockSkeleton } from '@/components/ui/Skeleton'
import { CitationChip, renderWithCitations } from '@/components/chat/CitationChip'
import { BookOpen, Sparkles } from 'lucide-react'

export const LitReviewTab: React.FC = () => {
  const { activeWorkspaceId, selectedModel } = useWorkspaceStore()
  const [topic, setTopic] = useState('Comparative evaluation of RAG retrieval strategies')
  const [litReview, setLitReview] = useState<LitReviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!activeWorkspaceId) return
    try {
      setLoading(true)
      setError(null)
      const data = await analysisApi.generateLitReview({
        workspace_id: activeWorkspaceId,
        topic: topic.trim() || undefined,
        llm_model: selectedModel,
      })
      setLitReview(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate literature review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Topic input */}
      <div className="p-4 rounded-xl bg-card border border-subtle space-y-3 shadow-2xs">
        <label className="text-xs font-semibold text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#fb923c]" />
          <span>Research Topic or Literature Focus</span>
        </label>
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Hallucination mitigation in Dense Retrieval and HyDE"
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            isLoading={loading}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {loading ? 'Synthesizing...' : 'Generate Review'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <SummaryBlockSkeleton />
      ) : litReview ? (
        <div className="space-y-6">
          {/* Synthesis */}
          <div className="p-5 rounded-xl bg-card border border-subtle space-y-2 shadow-2xs">
            <h4 className="text-sm font-semibold text-primary font-serif">
              Literature Synthesis: {litReview.topic}
            </h4>
            <div className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">
              {renderWithCitations(litReview.synthesis, litReview.citations)}
            </div>
          </div>

          {/* Matrix Table */}
          {litReview.review_matrix && litReview.review_matrix.length > 0 && (
            <div className="rounded-xl border border-subtle bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-subtle bg-surface text-secondary">
                      <th className="p-3 font-semibold text-primary">Author & Year</th>
                      <th className="p-3 font-semibold text-primary">Objective</th>
                      <th className="p-3 font-semibold text-primary">Key Methodology</th>
                      <th className="p-3 font-semibold text-primary">Findings</th>
                      <th className="p-3 font-semibold text-primary">Research Gaps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {litReview.review_matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 font-medium text-[#fb923c] align-top">
                          {row.author_year || row.title || 'Document'}
                        </td>
                        <td className="p-3 text-secondary align-top leading-relaxed">
                          {renderWithCitations(row.objective || 'N/A', litReview.citations)}
                        </td>
                        <td className="p-3 text-secondary align-top leading-relaxed">
                          {renderWithCitations(row.methodology || 'N/A', litReview.citations)}
                        </td>
                        <td className="p-3 text-primary align-top leading-relaxed font-medium">
                          {renderWithCitations(row.findings || 'N/A', litReview.citations)}
                        </td>
                        <td className="p-3 text-amber-500 align-top leading-relaxed">
                          {renderWithCitations(row.gaps || 'N/A', litReview.citations)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Citations */}
          {litReview.citations.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-subtle shadow-2xs">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Referenced Citations (Click to open in PDF reader)
              </span>
              <div className="flex flex-wrap gap-2">
                {litReview.citations.map((c) => (
                  <CitationChip
                    key={c.id || c.citation_index}
                    citationIndex={c.citation_index}
                    citations={litReview.citations}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-muted text-xs">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium text-primary">No Literature Review Generated</p>
          <p className="mt-1">
            Specify a topic above and synthesize an academic literature review matrix.
          </p>
        </div>
      )}
    </div>
  )
}
