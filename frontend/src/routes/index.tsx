import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { workspacesApi } from '@/api/workspaces'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  BookOpen,
  Compass,
  FolderGit2,
  Plus,
  Sparkles,
  TrendingUp,
  Upload,
  ArrowRight,
  Clock,
  Layers,
  MessageSquare,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { WorkspaceCardSkeleton } from '@/components/ui/Skeleton'
import { ArxivSearchModal } from '@/components/arxiv/ArxivSearchModal'

export const DashboardRoute: React.FC = () => {
  const navigate = useNavigate()
  const { setActiveWorkspaceId, activeWorkspaceId } = useWorkspaceStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isArxivOpen, setIsArxivOpen] = useState(false)
  const [deleteConfirmWs, setDeleteConfirmWs] = useState<{ id: string; name: string } | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: workspaces = [], isLoading, refetch } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setIsCreating(true)
      const created = await workspacesApi.create({
        name: name.trim(),
        description: desc.trim() || undefined,
      })
      await refetch()
      setActiveWorkspaceId(created.id)
      setIsCreateOpen(false)
      setName('')
      setDesc('')
      navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: created.id } })
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmWs) return
    try {
      setIsDeleting(true)
      await workspacesApi.delete(deleteConfirmWs.id)
      await refetch()
      if (activeWorkspaceId === deleteConfirmWs.id) {
        setActiveWorkspaceId(null)
      }
      setDeleteConfirmWs(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id)
    navigate({ to: '/workspaces/$workspaceId', params: { workspaceId: id } })
  }

  const totalDocuments = workspaces.reduce((sum, w) => sum + (w.document_count || 0), 0)
  const totalConversations = workspaces.reduce((sum, w) => sum + (w.conversation_count || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto bg-canvas text-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-subtle">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#e06c38]/10 border border-[#e06c38]/20 text-[#fb923c] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Research Assistant</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              PaperPilot AI
            </h1>
            <p className="text-sm text-secondary max-w-xl leading-relaxed">
              Upload papers or search arXiv, ask questions across documents, and verify answers with interactive page citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsArxivOpen(true)}
              leftIcon={<Compass className="w-4 h-4 text-[#fb923c]" />}
            >
              Search arXiv
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Workspace
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-card border border-subtle space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-muted">
              <FolderGit2 className="w-4 h-4" />
              <span>Research Workspaces</span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary">{workspaces.length}</p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-subtle space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-muted">
              <BookOpen className="w-4 h-4 text-[#fb923c]" />
              <span>Indexed Documents</span>
            </div>
            <p className="text-2xl font-bold font-mono text-[#fb923c]">{totalDocuments}</p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-subtle space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-muted">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Research Chats</span>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-500">{totalConversations}</p>
          </div>
        </div>

        {/* Workspaces Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary tracking-tight">
              Recent Workspaces
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Workspace
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
              <WorkspaceCardSkeleton />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-subtle space-y-3">
              <FolderGit2 className="w-10 h-10 text-muted mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-primary">No Workspaces Found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Create a workspace to group related papers, synthesize comparative literature, and evaluate RAG pipelines.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create First Workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className="p-5 rounded-xl bg-card border border-subtle hover:border-[#e06c38]/40 hover:bg-card-hover transition-all cursor-pointer group space-y-3 flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-primary group-hover:text-[#fb923c] transition-colors truncate">
                        {ws.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmWs({ id: ws.id, name: ws.name })
                          }}
                          title="Delete workspace"
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-400 rounded hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-[#fb923c] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                    {ws.description && (
                      <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                        {ws.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center gap-3">
                      <span>{ws.document_count || 0} papers</span>
                      <span>•</span>
                      <span>{ws.conversation_count || 0} chats</span>
                    </div>
                    <span className="text-[11px]">
                      {new Date(ws.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Workspace Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Workspace"
        description="Organize related research papers and chat threads under a dedicated workspace."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Workspace Title
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graph Neural Networks in Drug Discovery"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Description (optional)
            </label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Paper comparison and benchmark notes"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating}
              disabled={!name.trim()}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
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
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Workspace
          </Button>
        </div>
      </Modal>

      {/* arXiv Modal */}
      <ArxivSearchModal
        isOpen={isArxivOpen}
        onClose={() => setIsArxivOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
