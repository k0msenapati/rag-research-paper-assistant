import React from 'react'
import { Header } from '@/components/layout/Header'
import { EvaluationDashboard } from '@/components/evaluation/EvaluationDashboard'

export const EvaluationRoute: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      <Header
        title="RAG Benchmarks"
        showRagSelector={false}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <EvaluationDashboard />
      </div>
    </div>
  )
}
