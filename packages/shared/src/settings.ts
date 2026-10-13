import { z } from 'zod'

export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const UpdateSettingsSchema = z
  .object({
    // null means "follow the browser language" (F-I18N-02)
    locale: z.enum(LOCALES).nullable(),
  })
  .partial()

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>

export interface SettingsDto {
  locale: Locale | null
  // null and 0 until the user saves settings for the first time
  updatedAt: string | null
  version: number
}
