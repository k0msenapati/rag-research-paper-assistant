import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  initTheme: () => void
}

const applyThemeToDOM = (theme: 'dark' | 'light') => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyThemeToDOM(next)
        set({ theme: next })
      },
      setTheme: (theme) => {
        applyThemeToDOM(theme)
        set({ theme })
      },
      initTheme: () => {
        applyThemeToDOM(get().theme)
      },
    }),
    {
      name: 'paperpilot-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme)
        }
      },
    }
  )
)
