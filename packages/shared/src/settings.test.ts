import { describe, expect, it } from 'vitest'
import { UpdateSettingsSchema } from './settings'
import { DEFAULT_THEME } from './theme'

describe('UpdateSettingsSchema', () => {
  it('accepts a supported locale or null for the browser language', () => {
    expect(UpdateSettingsSchema.parse({ locale: 'pl' })).toEqual({ locale: 'pl' })
    expect(UpdateSettingsSchema.parse({ locale: null })).toEqual({ locale: null })
  })

  it('rejects an unsupported locale', () => {
    expect(UpdateSettingsSchema.safeParse({ locale: 'de' }).success).toBe(false)
  })

  it('accepts a whole theme and rejects a part of it', () => {
    const theme = { ...DEFAULT_THEME, mode: 'dark' }
    expect(UpdateSettingsSchema.parse({ theme })).toEqual({ theme })
    expect(UpdateSettingsSchema.safeParse({ theme: { mode: 'dark' } }).success).toBe(false)
  })
})
