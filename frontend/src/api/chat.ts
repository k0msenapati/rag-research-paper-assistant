import { api } from './client'
import type { ChatRequestPayload, Citation, Conversation } from '@/types'

export interface StreamEvent {
  event: 'token' | 'done' | 'error'
  content?: string
  full_text?: string
  citations?: Citation[]
  latency_ms?: number
  conversation_id?: string
  error?: string
}

export const chatApi = {
  listConversations: async (workspaceId: string): Promise<Conversation[]> => {
    const res = await api.get<Conversation[]>('/chat/conversations', {
      params: { workspace_id: workspaceId },
    })
    return res.data
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const res = await api.get<Conversation>(`/chat/conversations/${conversationId}`)
    return res.data
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/chat/conversations/${conversationId}`)
  },

  streamChat: async (
    payload: ChatRequestPayload,
    onToken: (token: string) => void,
    onDone: (data: {
      full_text: string
      citations: Citation[]
      latency_ms: number
      conversation_id: string
    }) => void,
    onError: (err: Error) => void
  ): Promise<void> => {
    try {
      const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Chat request failed (${response.status}): ${errorText}`)
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const jsonStr = trimmed.slice(6)
          try {
            const data: StreamEvent = JSON.parse(jsonStr)
            if (data.event === 'token' && data.content) {
              onToken(data.content)
            } else if (data.event === 'done') {
              onDone({
                full_text: data.full_text || '',
                citations: data.citations || [],
                latency_ms: data.latency_ms || 0,
                conversation_id: data.conversation_id || '',
              })
            }
          } catch {
            // Ignore non-json chunk or partial buffer
          }
        }
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  },
}
