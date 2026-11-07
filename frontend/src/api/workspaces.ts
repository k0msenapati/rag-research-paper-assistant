import { api } from './client'
import type { Workspace } from '@/types'

export const workspacesApi = {
  list: async (): Promise<Workspace[]> => {
    const res = await api.get<Workspace[]>('/workspaces')
    return res.data
  },

  get: async (id: string): Promise<Workspace> => {
    const res = await api.get<Workspace>(`/workspaces/${id}`)
    return res.data
  },

  create: async (payload: { name: string; description?: string }): Promise<Workspace> => {
    const res = await api.post<Workspace>('/workspaces', payload)
    return res.data
  },

  update: async (id: string, payload: { name?: string; description?: string }): Promise<Workspace> => {
    const res = await api.put<Workspace>(`/workspaces/${id}`, payload)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workspaces/${id}`)
  },
}
