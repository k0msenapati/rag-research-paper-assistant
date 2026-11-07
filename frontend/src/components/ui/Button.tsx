import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-7',
      md: 'text-sm px-3.5 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
      icon: 'h-8 w-8 p-0',
    }

    const variantStyles = {
      primary:
        'bg-[#e06c38] text-white hover:bg-[#eb7a47] active:bg-[#c95926] shadow-xs focus-visible:ring-[#e06c38]/50',
      secondary:
        'bg-card text-primary hover:bg-card-hover border border-subtle focus-visible:ring-black/10 dark:focus-visible:ring-white/20 shadow-2xs',
      ghost:
        'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10',
      outline:
        'border border-subtle text-primary hover:bg-black/5 dark:hover:bg-white/5',
      danger:
        'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 active:bg-rose-500/30',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
