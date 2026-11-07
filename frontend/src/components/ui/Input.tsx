import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-card text-primary text-sm rounded-lg border border-subtle px-3.5 py-2 placeholder:text-muted transition-colors',
                'focus:outline-none focus:border-[#e06c38] focus:ring-1 focus:ring-[#e06c38]/40',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                leftIcon && 'pl-9',
                rightIcon && 'pr-9',
                error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-muted flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
