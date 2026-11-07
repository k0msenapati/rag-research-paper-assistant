import React, { useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  disabled?: boolean
  isLoading?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const {
    activeRagStrategy,
    setRagStrategy,
    selectedModel,
    selectedDocumentIds,
  } = useWorkspaceStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled && !isLoading) {
        onSubmit()
      }
    }
  }

  return (
    <div className="p-4 bg-gradient-to-t from-[var(--bg-canvas)] via-[var(--bg-canvas)]/90 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl bg-card border border-subtle hover:border-[#e06c38]/40 focus-within:border-[#e06c38]/60 focus-within:ring-1 focus-within:ring-[#e06c38]/30 transition-all shadow-md p-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDocumentIds.length > 0
                ? `Ask about ${selectedDocumentIds.length} scoped paper${
                    selectedDocumentIds.length > 1 ? 's' : ''
                  }...`
                : 'Ask a question across all workspace papers...'
            }
            disabled={disabled || isLoading}
            className="w-full bg-transparent text-sm text-primary placeholder:text-muted resize-none outline-none max-h-44 min-h-[44px] leading-relaxed"
          />

          {/* Footer Controls within Input */}
          <div className="flex items-center justify-between pt-2 border-t border-subtle mt-1">
            {/* Quick Strategy Switcher */}
            <div className="flex items-center gap-1.5">
              <select
                value={activeRagStrategy}
                onChange={(e) =>
                  setRagStrategy(e.target.value as 'basic' | 'hyde' | 'fusion')
                }
                className="bg-black/5 dark:bg-white/5 text-[11px] font-mono text-secondary rounded-md px-2 py-1 outline-none border border-subtle cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
              >
                <option value="basic">Basic RAG</option>
                <option value="hyde">HyDE RAG</option>
                <option value="fusion">RAG-Fusion</option>
              </select>

              <span className="text-[11px] text-muted hidden sm:inline">
                • {selectedModel.split('/').pop()}
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted hidden sm:inline">
                Enter ↵
              </span>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!value.trim() || disabled || isLoading}
                className="w-8 h-8 rounded-lg bg-[#e06c38] text-white flex items-center justify-center hover:bg-[#eb7a47] active:bg-[#c95926] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-muted mt-2">
          Answers are strictly grounded in retrieved PDF passages with verified citation coordinates.
        </p>
      </div>
    </div>
  )
}
