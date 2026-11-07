import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Citation } from '@/types'

interface WorkspaceState {
  activeWorkspaceId: string | null
  selectedDocumentIds: string[]
  activeRagStrategy: 'basic' | 'hyde' | 'fusion'
  selectedModel: string
  topK: number
  rrfK: number
  sidebarCollapsed: boolean
  pdfViewerOpen: boolean
  activePdfDocumentId: string | null
  activePdfPage: number
  activeCitation: Citation | null

  // Actions
  setActiveWorkspaceId: (id: string | null) => void
  toggleDocumentSelection: (id: string) => void
  selectAllDocuments: (ids: string[]) => void
  clearDocumentSelection: () => void
  setRagStrategy: (strategy: 'basic' | 'hyde' | 'fusion') => void
  setSelectedModel: (model: string) => void
  setTopK: (k: number) => void
  setRrfK: (k: number) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setPdfViewerOpen: (open: boolean) => void
  openPdfDocument: (docId: string, page?: number, citation?: Citation | null) => void
  setActivePdfPage: (page: number) => void
  setActiveCitation: (citation: Citation | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      selectedDocumentIds: [],
      activeRagStrategy: 'basic',
      selectedModel: 'openai/gpt-oss-120b',
      topK: 5,
      rrfK: 60,
      sidebarCollapsed: false,
      pdfViewerOpen: false, // Default closed so chat & analysis have full screen width
      activePdfDocumentId: null,
      activePdfPage: 1,
      activeCitation: null,

      setActiveWorkspaceId: (id) =>
        set({
          activeWorkspaceId: id,
          selectedDocumentIds: [],
          activePdfDocumentId: null,
          activeCitation: null,
          pdfViewerOpen: false,
        }),

      toggleDocumentSelection: (id) => {
        const current = get().selectedDocumentIds
        if (current.includes(id)) {
          set({ selectedDocumentIds: current.filter((item) => item !== id) })
        } else {
          set({ selectedDocumentIds: [...current, id] })
        }
      },

      selectAllDocuments: (ids) => set({ selectedDocumentIds: ids }),
      clearDocumentSelection: () => set({ selectedDocumentIds: [] }),

      setRagStrategy: (strategy) => set({ activeRagStrategy: strategy }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setTopK: (k) => set({ topK: k }),
      setRrfK: (k) => set({ rrfK: k }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setPdfViewerOpen: (open) => set({ pdfViewerOpen: open }),

      openPdfDocument: (docId, page = 1, citation = null) =>
        set({
          pdfViewerOpen: true, // Automatically opens when citation or paper is selected!
          activePdfDocumentId: docId,
          activePdfPage: page,
          activeCitation: citation,
        }),

      setActivePdfPage: (page) => set({ activePdfPage: page }),
      setActiveCitation: (citation) => set({ activeCitation: citation }),
    }),
    {
      name: 'paperpilot-workspace-storage',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        activeRagStrategy: state.activeRagStrategy,
        selectedModel: state.selectedModel,
        topK: state.topK,
        rrfK: state.rrfK,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
