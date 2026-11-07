import React, { useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useQuery } from '@tanstack/react-query'
import { workspacesApi } from '@/api/workspaces'
import { Header } from '@/components/layout/Header'
import { DocumentScopePanel } from '@/components/chat/DocumentScopePanel'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { PdfViewer } from '@/components/pdf/PdfViewer'

export const WorkspaceRoute: React.FC = () => {
  const { workspaceId } = useParams({ strict: false }) as { workspaceId?: string }
  const {
    activeWorkspaceId,
    setActiveWorkspaceId,
    pdfViewerOpen,
  } = useWorkspaceStore()

  useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId)
    }
  }, [workspaceId, activeWorkspaceId, setActiveWorkspaceId])

  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => (workspaceId ? workspacesApi.get(workspaceId) : Promise.resolve(null)),
    enabled: !!workspaceId,
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <Header
        title={workspace?.name || 'Workspace'}
        showRagSelector={true}
      />

      {/* 3-Panel Main Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel: Document Scoping & Uploads (280px) */}
        <DocumentScopePanel />

        {/* Center Panel: Chat & Citations (Flex) */}
        <ChatContainer />

        {/* Right Panel: Interactive PDF Viewer & Citation Overlay (480px) */}
        {pdfViewerOpen && (
          <div className="w-[480px] lg:w-[540px] xl:w-[620px] h-full shrink-0 animate-in slide-in-from-right-4 duration-200">
            <PdfViewer />
          </div>
        )}
      </div>
    </div>
  )
}
