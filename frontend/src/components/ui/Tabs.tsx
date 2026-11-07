import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pills' | 'underline'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  if (variant === 'underline') {
    return (
      <div
        className={twMerge(
          'flex items-center gap-6 border-b border-white/10 text-sm font-medium',
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 pb-3 -mb-px transition-colors cursor-pointer',
                isActive
                  ? 'text-[#f4f4f6] border-b-2 border-[#e06c38]'
                  : 'text-[#71717a] hover:text-[#a1a1aa] border-b-2 border-transparent'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={twMerge(
        'inline-flex items-center p-1 bg-[#141417] border border-white/10 rounded-lg text-xs font-medium',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
              isActive
                ? 'bg-[#1e1e24] text-[#f4f4f6] shadow-xs'
                : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/5'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        )
      })}
    </div>
  )
}
