import { accentCssVariables, type ThemeMode, type ThemeSettings } from '@one-place/shared'

// public/theme-boot.js reads this entry before the first paint (F-THEME-05)
export const THEME_STORAGE_KEY = 'one-place:theme'

// The mode, not the result: in the system mode the boot script asks the system itself, so a
// change of the system theme while the browser was closed does not flash the old one
export interface StoredTheme {
  mode: ThemeMode
  vars: Record<string, string>
}

export function isDark(mode: ThemeMode, systemDark: boolean) {
  return mode === 'dark' || (mode === 'system' && systemDark)
}

export function applyTheme(theme: ThemeSettings, systemDark: boolean) {
  const root = document.documentElement
  const vars = accentCssVariables(theme.accent)
  root.classList.toggle('dark', isDark(theme.mode, systemDark))
  // An inline style wins over the :root rule that Nuxt UI adds at run time
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
  const stored: StoredTheme = { mode: theme.mode, vars }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage may be blocked or full. The theme still works until the tab is closed.
  }
}
