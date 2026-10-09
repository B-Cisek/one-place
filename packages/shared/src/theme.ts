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

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export function accentCssVariables(accent: AccentColor): Record<string, string> {
  return Object.fromEntries(
    COLOR_SHADES.map((shade) => [`--ui-color-primary-${shade}`, `var(--color-${accent}-${shade})`]),
  )
}
