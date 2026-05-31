'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'sunset' | 'acid' | 'dream'

type ThemeContextValue = {
  theme: Theme
  dark: boolean
  setTheme: (t: Theme) => void
  setDark: (d: boolean) => void
  toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_THEME = 'bindu:theme'
const STORAGE_DARK = 'bindu:dark'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-stable defaults — sunset light. Real values rehydrate on mount.
  const [theme, setThemeState] = useState<Theme>('sunset')
  const [dark, setDarkState] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  // Read persisted prefs on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_THEME) as Theme | null
      const savedDark = localStorage.getItem(STORAGE_DARK)
      if (savedTheme && ['sunset', 'acid', 'dream'].includes(savedTheme)) {
        setThemeState(savedTheme)
      }
      if (savedDark === '1') setDarkState(true)
    } catch {
      /* localStorage may be blocked — fall back to defaults */
    }
    setMounted(true)
  }, [])

  // Apply classes to <body> whenever state changes
  useEffect(() => {
    if (!mounted) return
    document.body.className = `theme-${theme}${dark ? ' dark' : ''}`
  }, [theme, dark, mounted])

  function setTheme(t: Theme) {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_THEME, t)
    } catch {}
  }

  function setDark(d: boolean) {
    setDarkState(d)
    try {
      localStorage.setItem(STORAGE_DARK, d ? '1' : '0')
    } catch {}
  }

  function toggleDark() {
    setDark(!dark)
  }

  return (
    <ThemeContext.Provider value={{ theme, dark, setTheme, setDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
