import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardRoute } from '@/routes/index'
import { WorkspaceRoute } from '@/routes/workspace'
import { LibraryRoute } from '@/routes/library'
import { ArxivRoute } from '@/routes/arxiv'
import { AnalysisRoute } from '@/routes/analysis'
import { EvaluationRoute } from '@/routes/evaluation'

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

// 2. Child Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardRoute,
})

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceId',
  component: WorkspaceRoute,
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceId/library',
  component: LibraryRoute,
})

const arxivRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceId/arxiv',
  component: ArxivRoute,
})

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceId/analysis',
  component: AnalysisRoute,
})

const evaluationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/$workspaceId/evaluation',
  component: EvaluationRoute,
})

// 3. Assemble Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  workspaceRoute,
  libraryRoute,
  arxivRoute,
  analysisRoute,
  evaluationRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
