// @vitest-environment happy-dom
import { DEFAULT_THEME, type ThemeSettings } from '@one-place/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { THEME_STORAGE_KEY } from './apply-theme'
import { useAppliedTheme } from './use-applied-theme'

const root = document.documentElement
let systemDark = false
let notify: (() => void) | undefined

// A system whose theme the test can switch, like matchMedia() in the browser
beforeEach(() => {
  systemDark = false
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return systemDark
    },
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      notify = () => listener({ matches: systemDark })
    },
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  root.className = ''
  root.removeAttribute('style')
  localStorage.clear()
  vi.unstubAllGlobals()
})

function setUp(theme: () => ThemeSettings | null) {
  const scope = effectScope()
  scope.run(() => useAppliedTheme(theme))
  return scope
}

describe('useAppliedTheme', () => {
  it('applies the theme at once and after a change', async () => {
    const theme = ref<ThemeSettings>({ ...DEFAULT_THEME, mode: 'dark' })
    setUp(() => theme.value)
    expect(root.classList.contains('dark')).toBe(true)
    theme.value = { ...DEFAULT_THEME, mode: 'light', accent: 'rose' }
    await nextTick()
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.style.getPropertyValue('--ui-color-primary-500')).toBe('var(--color-rose-500)')
  })

  it('follows a change of the system theme without a reload', async () => {
    setUp(() => ({ ...DEFAULT_THEME, mode: 'system' }))
    expect(root.classList.contains('dark')).toBe(false)
    systemDark = true
    notify?.()
    await nextTick()
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('keeps the page as it is until the theme is known', () => {
    root.classList.add('dark')
    setUp(() => null)
    expect(root.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })
})
