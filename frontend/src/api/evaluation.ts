import { api } from './client'
import type { EvaluationData } from '@/types'

export const evaluationApi = {
  runBenchmark: async (payload: {
    workspace_id: string
    document_ids?: string[]
    sample_queries?: string[]
    llm_model?: string
  }): Promise<EvaluationData> => {
    const res = await api.post<EvaluationData>('/evaluation/run', {
      workspace_id: payload.workspace_id,
      document_ids: payload.document_ids || [],
      sample_queries: payload.sample_queries || [],
      llm_model: payload.llm_model || null,
    })
    return res.data
  },
}
