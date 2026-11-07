import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { analysisApi } from '@/api/analysis'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { SummaryData } from '@/types'
import { Button } from '@/components/ui/Button'
import { SummaryBlockSkeleton } from '@/components/ui/Skeleton'
import { CitationChip, renderWithCitations } from '@/components/chat/CitationChip'
import {
  FileText,
  Sparkles,
  Target,
  AlertTriangle,
  Cpu,
  Database,
  BarChart3,
  ShieldAlert,
  ArrowRightCircle,
} from 'lucide-react'

export const SummaryTab: React.FC = () => {
  const { activeWorkspaceId, selectedModel } = useWorkspaceStore()
  const [selectedDocId, setSelectedDocId] = useState<string>('')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: () => (activeWorkspaceId ? documentsApi.list(activeWorkspaceId) : Promise.resolve([])),
    enabled: !!activeWorkspaceId,
  })

  // Set default selection
  React.useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id)
    }
  }, [documents, selectedDocId])

  const handleGenerateSummary = async () => {
    if (!selectedDocId) return
    try {
      setLoading(true)
      setError(null)
      const data = await analysisApi.getSummary(selectedDocId, selectedModel)
      setSummary(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const sections = summary
    ? [
        {
          label: 'Research Objective',
          icon: <Target className="w-4 h-4 text-[#fb923c]" />,
          text: summary.objective,
        },
        {
          label: 'Problem Addressed',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          text: summary.problem,
        },
        {
          label: 'Proposed Methodology',
          icon: <Cpu className="w-4 h-4 text-indigo-400" />,
          text: summary.methodology,
        },
        {
          label: 'Models & Technologies',
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          text: summary.models_and_technologies,
        },
        {
          label: 'Datasets & Benchmarks',
          icon: <Database className="w-4 h-4 text-emerald-500" />,
          text: summary.dataset,
        },
        {
          label: 'Experimental Results',
          icon: <BarChart3 className="w-4 h-4 text-blue-500" />,
          text: summary.results,
        },
        {
          label: 'Limitations',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          text: summary.limitations,
        },
        {
          label: 'Future Scope',
          icon: <ArrowRightCircle className="w-4 h-4 text-teal-500" />,
          text: summary.future_scope,
        },
      ]
    : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-card border border-subtle shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FileText className="w-5 h-5 text-[#fb923c] shrink-0" />
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full sm:w-80 bg-card text-xs text-primary border border-subtle rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            {documents.length === 0 ? (
              <option value="">No papers available</option>
            ) : (
              documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))
            )}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleGenerateSummary}
          disabled={!selectedDocId || loading}
          isLoading={loading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {loading ? 'Synthesizing...' : 'Generate Structured Summary'}
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <SummaryBlockSkeleton />
      ) : summary ? (
        <div className="space-y-4">
          <div className="border-b border-subtle pb-4">
            <h2 className="text-xl font-semibold text-primary font-serif">
              {summary.document_title}
            </h2>
            <p className="text-xs text-muted mt-1 font-mono">
              Verified with {summary.citations.length} cited source passages (click any citation to inspect PDF)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((sec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/30 transition-colors space-y-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  {sec.icon}
                  <span>{sec.label}</span>
                </div>
                <div className="text-xs text-secondary leading-relaxed">
                  {renderWithCitations(sec.text, summary.citations)}
                </div>
              </div>
            ))}
          </div>

          {/* Citations bar */}
          {summary.citations.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-subtle shadow-2xs">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                Referenced Citations (Click to open in PDF reader)
              </span>
              <div className="flex flex-wrap gap-2">
                {summary.citations.map((c) => (
                  <CitationChip
                    key={c.id || c.citation_index}
                    citationIndex={c.citation_index}
                    citations={summary.citations}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-muted text-xs">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium text-primary">No Summary Generated</p>
          <p className="mt-1">
            Select a paper above and click Generate Structured Summary to extract key findings.
          </p>
        </div>
      )}
    </div>
  )
}
