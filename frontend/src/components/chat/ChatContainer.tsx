import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { Message } from '@/types'
import { chatApi } from '@/api/chat'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useQuery } from '@tanstack/react-query'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatMessageSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

export const ChatContainer: React.FC = () => {
  const {
    activeWorkspaceId,
    activeRagStrategy,
    selectedModel,
    selectedDocumentIds,
    topK,
    rrfK,
  } = useWorkspaceStore()

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Query conversations in this workspace
  const {
    data: conversations = [],
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations', activeWorkspaceId],
    queryFn: () =>
      activeWorkspaceId
        ? chatApi.listConversations(activeWorkspaceId)
        : Promise.resolve([]),
    enabled: !!activeWorkspaceId,
  })

  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }, [conversations, activeConversationId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    let isMounted = true
    chatApi
      .getConversation(activeConversationId)
      .then((convo) => {
        if (isMounted) {
          setMessages(convo.messages || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load conversation:', err)
      })

    return () => {
      isMounted = false
    }
  }, [activeConversationId])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const handleStartNewChat = () => {
    setActiveConversationId(null)
    setMessages([])
    setStreamingContent('')
    setErrorMsg(null)
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteConversation(id)
      await refetchConversations()
      if (activeConversationId === id) {
        handleStartNewChat()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputText).trim()
    if (!query || !activeWorkspaceId || isStreaming) return

    setInputText('')
    setErrorMsg(null)

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      rag_strategy: activeRagStrategy,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setIsStreaming(true)
    setStreamingContent('')

    let currentAccumulated = ''

    await chatApi.streamChat(
      {
        workspace_id: activeWorkspaceId,
        conversation_id: activeConversationId,
        query,
        rag_strategy: activeRagStrategy,
        llm_model: selectedModel,
        document_ids: selectedDocumentIds,
        top_k: topK,
        rrf_k: rrfK,
      },
      (token) => {
        currentAccumulated += token
        setStreamingContent(currentAccumulated)
      },
      (doneData) => {
        setIsStreaming(false)
        setStreamingContent('')

        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: doneData.full_text,
          rag_strategy: activeRagStrategy,
          latency_ms: doneData.latency_ms,
          created_at: new Date().toISOString(),
          citations: doneData.citations,
        }

        setMessages((prev) => [...prev, assistantMsg])

        if (!activeConversationId && doneData.conversation_id) {
          setActiveConversationId(doneData.conversation_id)
        }
        refetchConversations()
      },
      (err) => {
        setIsStreaming(false)
        setStreamingContent('')
        setErrorMsg(err.message || 'Error streaming response')
      }
    )
  }

  const starterPrompts = [
    'What is the core methodology and theoretical contribution of this research?',
    'What are the primary datasets, benchmarks, and baseline comparisons used?',
    'What key limitations or open challenges do the authors identify?',
    'Summarize the experimental findings and ablation results.',
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas text-primary overflow-hidden">
      {/* Conversation Sessions Subheader */}
      <div className="px-4 py-2 border-b border-subtle bg-surface flex items-center justify-between gap-3 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStartNewChat}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            New Chat
          </Button>

          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConversationId(c.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer group shrink-0 ${
                activeConversationId === c.id
                  ? 'bg-card text-primary shadow-xs border border-subtle'
                  : 'text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-[#fb923c]" />
              <span className="truncate max-w-[130px]">{c.title}</span>
              <button
                onClick={(e) => handleDeleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          /* Empty state */
          <div className="max-w-xl mx-auto py-12 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#e06c38]/15 border border-[#e06c38]/30 text-[#fb923c] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1.5 tracking-tight font-serif">
              Research Conversation
            </h2>
            <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto mb-6">
              Ask deep technical questions across indexed academic papers. All assertions are supported by clickable citations that highlight directly on the PDF.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 hover:bg-card-hover text-xs text-secondary hover:text-primary transition-all cursor-pointer group shadow-2xs"
                >
                  <p className="line-clamp-2 leading-relaxed">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message feed */
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* In-flight streaming response */}
            {isStreaming && (
              <div className="py-4 px-4 rounded-xl">
                <div className="max-w-3xl mx-auto flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#e06c38]/15 border border-[#e06c38]/30 flex items-center justify-center text-[#fb923c] shrink-0 mt-0.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-primary">PaperPilot</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#e06c38]/20 text-[#fb923c] animate-pulse">
                        Generating with {activeRagStrategy}...
                      </span>
                    </div>

                    {streamingContent ? (
                      <div className="text-sm text-primary leading-relaxed font-sans whitespace-pre-wrap">
                        {streamingContent}
                        <span className="inline-block w-1.5 h-4 bg-[#fb923c] ml-1 animate-pulse align-middle" />
                      </div>
                    ) : (
                      <ChatMessageSkeleton />
                    )}
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="max-w-3xl mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSubmit={() => handleSendMessage()}
        isLoading={isStreaming}
      />
    </div>
  )
}
