import { api } from './client'

export const modelsApi = {
  list: async (refresh: boolean = false): Promise<string[]> => {
    const res = await api.get<string[]>('/models', {
      params: { refresh },
    })
    return res.data
  },
}
