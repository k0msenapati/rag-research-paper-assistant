import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded-md bg-white/5 relative overflow-hidden', className)
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export const WorkspaceCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-xl border border-white/5 bg-[#141417] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full max-w-[280px]" />
      <Skeleton className="h-3.5 w-3/4" />
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export const PaperCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-[#161619] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 py-4 max-w-3xl mx-auto w-full">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="bg-[#e06c38]/10 border border-[#e06c38]/20 rounded-2xl p-4 max-w-md w-full space-y-2">
          <Skeleton className="h-4 w-3/4 ml-auto" />
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/10 shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1 space-y-2.5 bg-[#161619] border border-white/5 rounded-2xl p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const ArxivResultSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-[#161619] space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-1 pt-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export const SummaryBlockSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-white/5 bg-[#141417] space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      ))}
    </div>
  )
}
