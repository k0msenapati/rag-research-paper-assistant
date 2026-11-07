import { api } from './client'
import type { ArxivPaper, DocumentItem } from '@/types'

export const arxivApi = {
  search: async (
    query: string,
    category?: string,
    maxResults: number = 10,
    sortBy: string = 'relevance'
  ): Promise<ArxivPaper[]> => {
    const res = await api.get<ArxivPaper[]>('/arxiv/search', {
      params: {
        query,
        category: category || undefined,
        max_results: maxResults,
        sort_by: sortBy,
      },
    })
    return res.data
  },

  ingest: async (payload: {
    workspace_id: string
    arxiv_id: string
    title: string
    pdf_url: string
  }): Promise<DocumentItem> => {
    const res = await api.post<DocumentItem>('/arxiv/ingest', payload)
    return res.data
  },
}
