import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react'

/* ===========================================================================
   Landing-page theme.

   Deliberately separate from the authenticated app's ThemeContext
   (lib/ThemeContext.tsx, localStorage key "gw-theme", stamped on
   <html data-theme>). This context is scoped to the public landing page:
   it persists under its own key and the resulting attribute is stamped on
   the `.gwl` root div, never on <html>, so a visitor's landing-page
   preference can never leak into — or be overwritten by — the officer
   console's own theme state.
   =========================================================================== */

export type LandingTheme = 'light' | 'dark'

const STORAGE_KEY = 'gwl-landing-theme'

interface Ctx {
  theme: LandingTheme
  toggle: () => void
  setTheme: (t: LandingTheme) => void
}

const LandingThemeContext = createContext<Ctx | undefined>(undefined)

function readInitial(): LandingTheme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* private-browsing / storage blocked — fall through to the default */
  }
  return 'light'
}

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<LandingTheme>(readInitial)

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const value: Ctx = {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState(t => (t === 'light' ? 'dark' : 'light')),
  }

  return <LandingThemeContext.Provider value={value}>{children}</LandingThemeContext.Provider>
}

export function useLandingTheme() {
  const ctx = useContext(LandingThemeContext)
  if (!ctx) throw new Error('useLandingTheme must be used within LandingThemeProvider')
  return ctx
}
