import { describe, expect, it } from 'vitest'
import { UpdateSettingsSchema } from './settings'

describe('UpdateSettingsSchema', () => {
  it('accepts a supported locale or null for the browser language', () => {
    expect(UpdateSettingsSchema.parse({ locale: 'pl' })).toEqual({ locale: 'pl' })
    expect(UpdateSettingsSchema.parse({ locale: null })).toEqual({ locale: null })
  })

  it('rejects an unsupported locale', () => {
    expect(UpdateSettingsSchema.safeParse({ locale: 'de' }).success).toBe(false)
  })
})
