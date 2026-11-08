import { z } from 'zod'
import { ACCENT_COLORS, THEME_MODES } from './theme'

// The types are in theme.ts, so the start-up path does not need Zod. The tests check that the
// schemas and the types describe the same data.
export const ThemeSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(THEME_MODES),
  accent: z.enum(ACCENT_COLORS),
  background: z.discriminatedUnion('type', [z.object({ type: z.literal('none') })]),
})

export const ThemeOverrideSchema = ThemeSettingsSchema.omit({ schemaVersion: true }).partial()
