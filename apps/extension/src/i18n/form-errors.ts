import type { FormError } from '@nuxt/ui'
import type { z } from 'zod'

// Schemas in `shared` use i18n keys as messages. UForm shows messages as they are,
// so we validate ourselves and translate each message.
export function formErrors(schema: z.ZodType, t: (key: string) => string) {
  return (state: unknown): FormError[] => {
    const result = schema.safeParse(state)
    if (result.success) return []
    return result.error.issues.map((issue) => ({
      name: issue.path.join('.'),
      message: t(issue.message),
    }))
  }
}
