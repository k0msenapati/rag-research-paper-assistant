import { api } from './client'
import type { ChunkItem, DocumentItem } from '@/types'

export const documentsApi = {
  list: async (workspaceId: string): Promise<DocumentItem[]> => {
    const res = await api.get<DocumentItem[]>('/documents', {
      params: { workspace_id: workspaceId },
    })
    return res.data
  },

  get: async (documentId: string): Promise<DocumentItem> => {
    const res = await api.get<DocumentItem>(`/documents/${documentId}`)
    return res.data
  },

  upload: async (workspaceId: string, file: File): Promise<DocumentItem> => {
    const formData = new FormData()
    formData.append('workspace_id', workspaceId)
    formData.append('file', file)

    const res = await api.post<DocumentItem>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  getChunks: async (documentId: string): Promise<ChunkItem[]> => {
    const res = await api.get<ChunkItem[]>(`/documents/${documentId}/chunks`)
    return res.data
  },

  getPdfUrl: (documentId: string): string => {
    return `/api/v1/documents/${documentId}/pdf`
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`)
  },
}
