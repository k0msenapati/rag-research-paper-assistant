import { api } from './client'
import type { ComparisonData, LitReviewData, SummaryData } from '@/types'

export const analysisApi = {
  getSummary: async (documentId: string, llmModel?: string): Promise<SummaryData> => {
    const res = await api.post<SummaryData>('/analysis/summary', {
      document_id: documentId,
      llm_model: llmModel || null,
    })
    return res.data
  },

  compare: async (documentIds: string[], llmModel?: string): Promise<ComparisonData> => {
    const res = await api.post<ComparisonData>('/analysis/compare', {
      document_ids: documentIds,
      llm_model: llmModel || null,
    })
    return res.data
  },

  generateLitReview: async (payload: {
    workspace_id: string
    document_ids?: string[]
    topic?: string
    llm_model?: string
  }): Promise<LitReviewData> => {
    const res = await api.post<LitReviewData>('/analysis/lit-review', {
      workspace_id: payload.workspace_id,
      document_ids: payload.document_ids || [],
      topic: payload.topic || null,
      llm_model: payload.llm_model || null,
    })
    return res.data
  },
}
