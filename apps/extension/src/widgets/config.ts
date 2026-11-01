import type { ZodType } from 'zod'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The API validates every config it saves, but a newer version of the extension may save a field
// in a shape this one does not expect. Invalid fields get their default value, the valid ones stay.
// Every field of a config schema has a default, so `schema.parse({})` is the default config.
export function resolveConfig<T>(schema: ZodType<T>, config: unknown): T {
  const result = schema.safeParse(config)
  if (result.success) return result.data
  console.warn('Invalid widget config, using defaults for the invalid fields', result.error.issues)
  const invalid = new Set(result.error.issues.map((issue) => issue.path[0]))
  const valid = isRecord(config)
    ? Object.fromEntries(Object.entries(config).filter(([key]) => !invalid.has(key)))
    : {}
  return schema.safeParse(valid).data ?? schema.parse({})
}
