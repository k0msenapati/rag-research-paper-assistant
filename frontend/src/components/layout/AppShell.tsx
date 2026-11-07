import React from 'react'
import { Sidebar } from './Sidebar'

export interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-canvas">
        {children}
      </div>
    </div>
  )
}
