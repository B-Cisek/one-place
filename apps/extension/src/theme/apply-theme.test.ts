// @vitest-environment happy-dom
import { DEFAULT_THEME, type ThemeSettings } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, THEME_STORAGE_KEY } from './apply-theme'

const root = document.documentElement
const theme = (changes: Partial<ThemeSettings>) => ({ ...DEFAULT_THEME, ...changes })

afterEach(() => {
  root.className = ''
  root.removeAttribute('style')
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('applyTheme', () => {
  it('sets the dark class for the dark mode and removes it for the light one', () => {
    applyTheme(theme({ mode: 'dark' }), false)
    expect(root.classList.contains('dark')).toBe(true)
    applyTheme(theme({ mode: 'light' }), true)
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('follows the system in the system mode', () => {
    applyTheme(theme({ mode: 'system' }), true)
    expect(root.classList.contains('dark')).toBe(true)
    applyTheme(theme({ mode: 'system' }), false)
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('replaces the accent variables', () => {
    applyTheme(theme({ accent: 'green' }), false)
    applyTheme(theme({ accent: 'rose' }), false)
    expect(root.style.getPropertyValue('--ui-color-primary-500')).toBe('var(--color-rose-500)')
    expect(root.style.getPropertyValue('--ui-color-primary-950')).toBe('var(--color-rose-950)')
  })

  it('saves the mode and the variables for the boot script', () => {
    applyTheme(theme({ mode: 'system', accent: 'teal' }), true)
    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')
    expect(stored.mode).toBe('system')
    expect(stored.vars['--ui-color-primary-500']).toBe('var(--color-teal-500)')
  })

  it('still applies the theme when the storage is not available', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    applyTheme(theme({ mode: 'dark' }), false)
    expect(root.classList.contains('dark')).toBe(true)
  })
})
