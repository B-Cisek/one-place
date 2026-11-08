import { describe, expect, expectTypeOf, it } from 'vitest'
import type { z } from 'zod'
import { DEFAULT_THEME, type ThemeOverride, type ThemeSettings } from './theme'
import { ThemeOverrideSchema, ThemeSettingsSchema } from './theme-schemas'

describe('ThemeSettingsSchema', () => {
  it('accepts the default theme', () => {
    expect(ThemeSettingsSchema.parse(DEFAULT_THEME)).toEqual(DEFAULT_THEME)
  })

  it('rejects an unknown mode, accent, background or schema version', () => {
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, mode: 'sepia' }).success).toBe(false)
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, accent: 'red' }).success).toBe(false)
    const image = { ...DEFAULT_THEME, background: { type: 'image' } }
    expect(ThemeSettingsSchema.safeParse(image).success).toBe(false)
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, schemaVersion: 2 }).success).toBe(
      false,
    )
  })

  it('requires every field', () => {
    expect(ThemeSettingsSchema.safeParse({ mode: 'dark' }).success).toBe(false)
  })

  it('matches the ThemeSettings type', () => {
    expectTypeOf<z.infer<typeof ThemeSettingsSchema>>().toEqualTypeOf<ThemeSettings>()
  })
})

describe('ThemeOverrideSchema', () => {
  it('accepts any subset of the fields', () => {
    expect(ThemeOverrideSchema.parse({})).toEqual({})
    expect(ThemeOverrideSchema.parse({ accent: 'rose' })).toEqual({ accent: 'rose' })
    expect(ThemeOverrideSchema.parse({ mode: 'dark', accent: 'teal' })).toEqual({
      mode: 'dark',
      accent: 'teal',
    })
  })

  it('validates the fields it has', () => {
    expect(ThemeOverrideSchema.safeParse({ accent: 'red' }).success).toBe(false)
  })

  it('drops the schema version', () => {
    expect(ThemeOverrideSchema.parse({ schemaVersion: 1, mode: 'light' })).toEqual({
      mode: 'light',
    })
  })

  it('matches the ThemeOverride type', () => {
    expectTypeOf<z.infer<typeof ThemeOverrideSchema>>().toEqualTypeOf<ThemeOverride>()
  })
})
