import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  ChevronDown,
  Compass,
  FileText,
  FolderGit2,
  Layers,
  MessageSquare,
  Moon,
  Plus,
  Sun,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useQuery } from '@tanstack/react-query'
import { workspacesApi } from '@/api/workspaces'
import { modelsApi } from '@/api/models'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    activeWorkspaceId,
    setActiveWorkspaceId,
    sidebarCollapsed,
    toggleSidebar,
    selectedModel,
    setSelectedModel,
  } = useWorkspaceStore()
  const { theme, toggleTheme } = useThemeStore()

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [deleteConfirmWs, setDeleteConfirmWs] = useState<{ id: string; name: string } | null>(null)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  const { data: workspaces = [], refetch: refetchWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list(false),
  })

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0]

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    try {
      setIsCreating(true)
      const created = await workspacesApi.create({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim() || undefined,
      })
      await refetchWorkspaces()
      setActiveWorkspaceId(created.id)
      setIsWorkspaceModalOpen(false)
      setNewWorkspaceName('')
      setNewWorkspaceDesc('')
      navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: created.id } })
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!deleteConfirmWs) return
    try {
      setIsDeleting(true)
      await workspacesApi.delete(deleteConfirmWs.id)
      await refetchWorkspaces()

      if (activeWorkspaceId === deleteConfirmWs.id) {
        const remaining = workspaces.filter((w) => w.id !== deleteConfirmWs.id)
        if (remaining.length > 0) {
          setActiveWorkspaceId(remaining[0].id)
          navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: remaining[0].id } })
        } else {
          setActiveWorkspaceId(null)
          navigate({ to: '/' })
        }
      }
      setDeleteConfirmWs(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const currentWsId = activeWorkspaceId || currentWorkspace?.id || 'default'

  const navItems = [
    {
      label: 'Workspace Chat',
      icon: <MessageSquare className="w-4 h-4" />,
      to: `/workspaces/${currentWsId}`,
      active: location.pathname === `/workspaces/${currentWsId}` || location.pathname === `/workspaces/${currentWsId}/`,
    },
    {
      label: 'Research Library',
      icon: <BookOpen className="w-4 h-4" />,
      to: `/workspaces/${currentWsId}/library`,
      active: location.pathname.includes('/library'),
    },
    {
      label: 'arXiv Explorer',
      icon: <Compass className="w-4 h-4" />,
      to: `/workspaces/${currentWsId}/arxiv`,
      active: location.pathname.includes('/arxiv'),
    },
    {
      label: 'Paper Analysis',
      icon: <FileText className="w-4 h-4" />,
      to: `/workspaces/${currentWsId}/analysis`,
      active: location.pathname.includes('/analysis'),
    },
    {
      label: 'RAG Benchmarks',
      icon: <TrendingUp className="w-4 h-4" />,
      to: `/workspaces/${currentWsId}/evaluation`,
      active: location.pathname.includes('/evaluation'),
    },
  ]

  if (sidebarCollapsed) {
    return (
      <aside className="w-14 bg-surface border-r border-subtle flex flex-col items-center py-3 shrink-0 select-none">
        <button
          onClick={toggleSidebar}
          title="Expand sidebar (Cmd+B)"
          className="p-2 text-muted hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer mb-4"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <Link
          to="/"
          title="PaperPilot Home"
          className="w-8 h-8 rounded-lg bg-[#e06c38]/15 border border-[#e06c38]/30 flex items-center justify-center text-[#fb923c] mb-6"
        >
          <Sparkles className="w-4 h-4" />
        </Link>

        <nav className="flex flex-col gap-1.5 w-full px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors mx-auto',
                item.active
                  ? 'bg-card text-primary font-semibold shadow-xs border border-subtle'
                  : 'text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              {item.icon}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    )
  }

  return (
    <>
      <aside className="w-64 bg-surface border-r border-subtle flex flex-col h-screen shrink-0 select-none">
        {/* Brand & Workspace Switcher */}
        <div className="p-3 border-b border-subtle">
          <div className="flex items-center justify-between mb-2 px-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-[#e06c38]/15 border border-[#e06c38]/30 flex items-center justify-center text-[#fb923c] group-hover:bg-[#e06c38]/25 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-primary">
                PaperPilot <span className="text-[#fb923c] font-normal text-xs">AI</span>
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar (Cmd+B)"
              className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Workspace Pill & Add Button */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-card border border-subtle shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted shrink-0">
                <FolderGit2 className="w-3 h-3" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-primary truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              title="Create new workspace"
              className="p-1 text-muted hover:text-primary rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="px-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
              Workspace
            </span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-card text-primary font-semibold shadow-xs border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <span className={item.active ? 'text-[#fb923c]' : 'text-muted'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Workspaces List Section with Delete Button */}
          <div className="pt-4 px-2 mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
              Workspaces ({workspaces.length})
            </span>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="text-[11px] text-[#fb923c] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id)
                  navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: ws.id } })
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer group',
                  ws.id === activeWorkspaceId
                    ? 'bg-card text-primary font-medium border border-subtle shadow-2xs'
                    : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <span className="truncate flex-1 mr-1">{ws.name}</span>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted group-hover:hidden">
                    {ws.document_count || 0} doc
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmWs({ id: ws.id, name: ws.name })
                    }}
                    title="Delete workspace"
                    className="hidden group-hover:flex items-center justify-center p-1 text-muted hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Model Picker & Theme Toggle Footer */}
        <div className="p-3 border-t border-subtle space-y-2">
          {/* Active Model Pill */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-card border border-subtle hover:border-black/15 dark:hover:border-white/15 text-left text-xs cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-secondary text-[11px] truncate">
                  {selectedModel.split('/').pop() || 'Select Model'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted shrink-0" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-card border border-subtle rounded-lg shadow-xl p-1 z-50 max-h-48 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] text-muted uppercase font-semibold">
                  Models
                </div>
                {models.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted">
                    openai/gpt-oss-120b (default)
                  </div>
                ) : (
                  models.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedModel(m)
                        setModelDropdownOpen(false)
                      }}
                      className={clsx(
                        'w-full text-left px-2 py-1.5 text-xs rounded truncate cursor-pointer',
                        m === selectedModel
                          ? 'bg-[#e06c38]/15 text-[#fb923c]'
                          : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      {m}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted">PaperPilot AI</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* New Workspace Modal */}
      <Modal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title="Create New Workspace"
        description="Organize papers, discussions, and comparisons under a unified research project."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Workspace Name
            </label>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. LLM Reasoning & Chain-of-Thought"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Description (optional)
            </label>
            <Input
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              placeholder="Thesis research notes and comparative evaluation"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsWorkspaceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating}
              disabled={!newWorkspaceName.trim()}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Workspace Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmWs}
        onClose={() => setDeleteConfirmWs(null)}
        title={
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Delete Workspace?</span>
          </div>
        }
        description={`Are you sure you want to delete "${deleteConfirmWs?.name}"? All associated research chats and document mappings will be permanently removed.`}
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => setDeleteConfirmWs(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteWorkspace}
            isLoading={isDeleting}
          >
            Delete Workspace
          </Button>
        </div>
      </Modal>
    </>
  )
}
