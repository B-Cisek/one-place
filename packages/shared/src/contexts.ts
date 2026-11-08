import { z } from 'zod'
import type { ThemeOverride } from './theme'
import { ThemeOverrideSchema } from './theme-schemas'

export const CONTEXT_NAME_MAX_LENGTH = 40
export const MAX_CONTEXTS = 20

// A fixed list, because every icon has to be in the bundle (no requests to the Iconify API)
export const CONTEXT_ICONS = [
  'i-lucide-briefcase',
  'i-lucide-house',
  'i-lucide-user',
  'i-lucide-heart',
  'i-lucide-code',
  'i-lucide-book-open',
  'i-lucide-graduation-cap',
  'i-lucide-dumbbell',
  'i-lucide-plane',
  'i-lucide-coffee',
  'i-lucide-music',
  'i-lucide-gamepad-2',
  'i-lucide-palette',
  'i-lucide-wallet',
  'i-lucide-shopping-cart',
  'i-lucide-star',
] as const

export type ContextIcon = (typeof CONTEXT_ICONS)[number]

// Keys from `fractional-indexing` use only digits and letters, and are compared byte by byte
export const PositionSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[0-9A-Za-z]+$/)

export const ContextNameSchema = z
  .string()
  .trim()
  .min(1, 'validation.contextNameRequired')
  .max(CONTEXT_NAME_MAX_LENGTH, 'validation.contextNameTooLong')

export const CreateContextSchema = z.object({
  id: z.uuid(),
  name: ContextNameSchema,
  icon: z.enum(CONTEXT_ICONS),
  position: PositionSchema,
})

export const UpdateContextSchema = CreateContextSchema.omit({ id: true })
  .extend({
    // null removes the override, so the context uses the global theme (F-THEME-03)
    themeOverride: ThemeOverrideSchema.nullable(),
  })
  .partial()

// What the user fills in. The id and the position come from the extension.
export const ContextFormSchema = CreateContextSchema.pick({ name: true, icon: true })

export type CreateContextInput = z.infer<typeof CreateContextSchema>
export type UpdateContextInput = z.infer<typeof UpdateContextSchema>
export type ContextFormInput = z.infer<typeof ContextFormSchema>

export interface ContextDto {
  id: string
  name: string
  icon: ContextIcon
  position: string
  themeOverride: ThemeOverride | null
  createdAt: string
  updatedAt: string
  version: number
}
