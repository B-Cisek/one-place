import { type ContextDto, DEFAULT_THEME, type SettingsDto } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { accountTheme } from './use-account-theme'

const settings = {
  theme: { ...DEFAULT_THEME, mode: 'dark', accent: 'green' },
} as SettingsDto
const work = { id: 'work', themeOverride: { accent: 'rose' } } as ContextDto
const home = { id: 'home', themeOverride: null } as ContextDto

describe('accountTheme', () => {
  it('waits for both the settings and the contexts', () => {
    expect(accountTheme(undefined, [work], work)).toBeNull()
    expect(accountTheme(settings, undefined, null)).toBeNull()
  })

  it('uses the override of the active context', () => {
    expect(accountTheme(settings, [work, home], work)).toEqual({
      ...settings.theme,
      accent: 'rose',
    })
  })

  it('uses the global theme in a context without an override and without contexts', () => {
    expect(accountTheme(settings, [work, home], home)).toEqual(settings.theme)
    expect(accountTheme(settings, [], null)).toEqual(settings.theme)
  })
})
