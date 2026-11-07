import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { useThemeStore } from './store/useThemeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  const { initTheme } = useThemeStore()

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
