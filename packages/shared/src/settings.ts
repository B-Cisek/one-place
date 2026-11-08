import { z } from 'zod'
import type { ThemeSettings } from './theme'
import { ThemeSettingsSchema } from './theme-schemas'

export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const UpdateSettingsSchema = z
  .object({
    // null means "follow the browser language" (F-I18N-02)
    locale: z.enum(LOCALES).nullable(),
    // The whole theme, not single fields: the extension always has it (F-THEME-04)
    theme: ThemeSettingsSchema,
  })
  .partial()

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>

export interface SettingsDto {
  locale: Locale | null
  theme: ThemeSettings
  // null and 0 until the user saves settings for the first time
  updatedAt: string | null
  version: number
}
