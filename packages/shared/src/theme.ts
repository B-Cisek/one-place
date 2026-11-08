// Constants, types and functions without Zod: the extension uses them on the start-up path.
// The schemas are in theme-schemas.ts.

export const ACCENT_COLORS = [
  'blue',
  'indigo',
  'violet',
  'pink',
  'rose',
  'orange',
  'amber',
  'green',
  'emerald',
  'teal',
] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]

export const THEME_MODES = ['light', 'dark', 'system'] as const

export type ThemeMode = (typeof THEME_MODES)[number]

// F-THEME-06: the MVP has no background yet. Later: color, gradient, image.
export type ThemeBackground = { type: 'none' }

export interface ThemeSettings {
  schemaVersion: 1
  mode: ThemeMode
  accent: AccentColor
  background: ThemeBackground
}

// A context overrides only the fields it has (F-THEME-03)
export type ThemeOverride = Partial<Omit<ThemeSettings, 'schemaVersion'>>

export const DEFAULT_THEME: ThemeSettings = {
  schemaVersion: 1,
  mode: 'system',
  accent: 'blue',
  background: { type: 'none' },
}

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export function accentCssVariables(accent: AccentColor): Record<string, string> {
  return Object.fromEntries(
    COLOR_SHADES.map((shade) => [`--ui-color-primary-${shade}`, `var(--color-${accent}-${shade})`]),
  )
}

// The effective theme: each field of the override that is set replaces the global one
export function resolveTheme(
  global: ThemeSettings,
  override?: ThemeOverride | null,
): ThemeSettings {
  return {
    schemaVersion: global.schemaVersion,
    mode: override?.mode ?? global.mode,
    accent: override?.accent ?? global.accent,
    background: override?.background ?? global.background,
  }
}
