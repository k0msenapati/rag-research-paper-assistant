import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div
        className={twMerge(
          clsx(
            'relative w-full bg-card border border-subtle rounded-xl shadow-2xl p-6 text-primary z-10 animate-in fade-in zoom-in-95 duration-150',
            maxWidthStyles[maxWidth],
            className
          )
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {title && (
          <div className="mb-4 pr-6">
            <h2 className="text-base font-semibold text-primary tracking-tight">{title}</h2>
            {description && <p className="text-xs text-secondary mt-1">{description}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  )
}
