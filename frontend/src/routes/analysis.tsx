import React, { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Tabs } from '@/components/ui/Tabs'
import { SummaryTab } from '@/components/analysis/SummaryTab'
import { CompareTab } from '@/components/analysis/CompareTab'
import { LitReviewTab } from '@/components/analysis/LitReviewTab'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BookOpen, FileText, GitCompare } from 'lucide-react'

export const AnalysisRoute: React.FC = () => {
  const { workspaceId: routeWsId } = useParams({ strict: false }) as {
    workspaceId?: string
  }
  const { activeWorkspaceId, setActiveWorkspaceId, pdfViewerOpen } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<'summary' | 'compare' | 'lit-review'>('summary')

  React.useEffect(() => {
    if (routeWsId && routeWsId !== activeWorkspaceId) {
      setActiveWorkspaceId(routeWsId)
    }
  }, [routeWsId, activeWorkspaceId, setActiveWorkspaceId])

  const tabs = [
    {
      id: 'summary',
      label: 'Structured Paper Summary',
      icon: <FileText className="w-4 h-4 text-[#fb923c]" />,
    },
    {
      id: 'compare',
      label: 'Cross-Paper Comparison Matrix',
      icon: <GitCompare className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'lit-review',
      label: 'Literature Review Synthesis',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    },
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      <Header
        title="Paper Analysis"
        showRagSelector={false}
      />

      {/* Tabs Bar */}
      <div className="px-8 pt-4 pb-2 border-b border-subtle bg-surface shrink-0">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          variant="underline"
        />
      </div>

      {/* Content & Side-by-Side PDF Reader (Appears on Citation Click) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'summary' && <SummaryTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'lit-review' && <LitReviewTab />}
        </div>

        {/* Slide-in PDF Viewer Panel when a Citation is clicked in Analysis */}
        {pdfViewerOpen && (
          <div className="w-[480px] lg:w-[540px] xl:w-[600px] h-full shrink-0 border-l border-subtle animate-in slide-in-from-right-4 duration-200">
            <PdfViewer />
          </div>
        )}
      </div>
    </div>
  )
}
