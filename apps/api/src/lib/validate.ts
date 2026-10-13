import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import { z } from 'zod'

// Without it, a malformed id would reach Postgres and fail as a 500 (invalid uuid syntax)
export const IdParamSchema = z.object({ id: z.uuid() })

// zValidator answers invalid input with its own JSON. Throwing the ZodError instead
// lets handleError return it in the standard error format.
export function validate<Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) throw result.error
  })
}
