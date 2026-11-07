import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Sparkles, Zap } from 'lucide-react'
import type { Citation, Message } from '@/types'
import { CitationChip } from './CitationChip'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false)
  const { openPdfDocument } = useWorkspaceStore()
  const isAssistant = message.role === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Custom text transformer to render citation chips inside markdown
  const renderContentWithCitations = (content: string, citations: Citation[] = []) => {
    const parts = content.split(/(\[\d+\])/g)
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/)
      if (match) {
        const idx = parseInt(match[1], 10)
        return <CitationChip key={i} citationIndex={idx} citations={citations} />
      }
      return part
    })
  }

  if (!isAssistant) {
    return (
      <div className="flex justify-end py-2 px-4">
        <div className="max-w-2xl bg-[#e06c38]/10 text-primary border border-[#e06c38]/20 rounded-2xl px-4 py-3 text-sm shadow-xs">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 px-4 group hover:bg-black/[0.02] dark:hover:bg-white/[0.01] transition-colors rounded-xl">
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-[#e06c38]/15 border border-[#e06c38]/30 flex items-center justify-center text-[#fb923c] shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">PaperPilot</span>
              {message.rag_strategy && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-card text-muted border border-subtle">
                  {message.rag_strategy}
                </span>
              )}
              {message.latency_ms > 0 && (
                <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  {(message.latency_ms / 1000).toFixed(2)}s
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="p-1 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none text-primary leading-relaxed font-sans text-[13.5px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => {
                  return (
                    <p className="mb-3 leading-relaxed">
                      {React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return renderContentWithCitations(child, message.citations)
                        }
                        return child
                      })}
                    </p>
                  )
                },
                li: ({ children }) => {
                  return (
                    <li className="mb-1 leading-relaxed">
                      {React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                          return renderContentWithCitations(child, message.citations)
                        }
                        return child
                      })}
                    </li>
                  )
                },
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return (
                    <code
                      className={`font-mono text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#fb923c] ${
                        match ? 'block p-3 overflow-x-auto my-2' : ''
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#e06c38] pl-3 italic text-secondary my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Supporting Citations Footer */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-subtle">
              <div className="text-[10px] uppercase font-semibold text-muted mb-2 tracking-wider">
                Sources Cited ({message.citations.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c) => (
                  <button
                    key={c.id || `${c.citation_index}-${c.page_number}`}
                    onClick={() => openPdfDocument(c.document_id, c.page_number, c)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-subtle hover:border-[#e06c38]/40 hover:bg-[#e06c38]/5 text-left transition-colors cursor-pointer group/cit shadow-2xs"
                  >
                    <span className="font-mono text-[10px] font-bold text-[#fb923c]">
                      [{c.citation_index}]
                    </span>
                    <span className="text-[11px] text-secondary group-hover/cit:text-primary truncate max-w-[180px]">
                      {c.document_title || 'Document'}
                    </span>
                    <span className="text-[10px] text-muted">p.{c.page_number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
