import { describe, expect, it } from 'vitest'
import {
  accentCssVariables,
  COLOR_SHADES,
  DEFAULT_THEME,
  resolveTheme,
  type ThemeSettings,
} from './theme'

describe('accentCssVariables', () => {
  it('maps accent color to CSS variable', () => {
    const vars = accentCssVariables('green')
    expect(vars['--ui-color-primary-500']).toBe('var(--color-green-500)')
    expect(vars['--ui-color-primary-950']).toBe('var(--color-green-950)')
  })

  it('returns exactly one variable for each accent color', () => {
    expect(Object.keys(accentCssVariables('blue'))).toHaveLength(COLOR_SHADES.length)
  })
})

describe('resolveTheme', () => {
  const global: ThemeSettings = { ...DEFAULT_THEME, mode: 'dark', accent: 'green' }

  it('returns the global theme without an override', () => {
    expect(resolveTheme(global)).toEqual(global)
    expect(resolveTheme(global, null)).toEqual(global)
    expect(resolveTheme(global, {})).toEqual(global)
  })

  it('replaces only the fields the override has', () => {
    expect(resolveTheme(global, { accent: 'rose' })).toEqual({ ...global, accent: 'rose' })
    expect(resolveTheme(global, { mode: 'light' })).toEqual({ ...global, mode: 'light' })
  })

  it('replaces both fields', () => {
    expect(resolveTheme(global, { mode: 'system', accent: 'teal' })).toEqual({
      ...global,
      mode: 'system',
      accent: 'teal',
    })
  })

  // The settings panel removes a field by setting it to undefined ("same as the global theme")
  it('ignores a field set to undefined', () => {
    expect(resolveTheme(global, { accent: undefined })).toEqual(global)
  })

  it('does not change the global theme', () => {
    resolveTheme(global, { accent: 'rose' })
    expect(global.accent).toBe('green')
  })
})
