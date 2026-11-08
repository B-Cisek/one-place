// @vitest-environment happy-dom
import { DEFAULT_THEME } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import bootScript from '../../public/theme-boot.js?raw'
import { applyTheme, THEME_STORAGE_KEY } from './apply-theme'

const root = document.documentElement

function resetPage() {
  root.className = ''
  root.removeAttribute('style')
}

function boot(systemDark: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: systemDark }))
  new Function(bootScript)()
}

afterEach(() => {
  resetPage()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('theme-boot.js', () => {
  it('gives the page the same look as applyTheme', () => {
    applyTheme({ ...DEFAULT_THEME, mode: 'dark', accent: 'green' }, false)
    const applied = { className: root.className, style: root.getAttribute('style') }
    resetPage()
    boot(false)
    expect({ className: root.className, style: root.getAttribute('style') }).toEqual(applied)
  })

  it('asks the system in the system mode', () => {
    applyTheme({ ...DEFAULT_THEME, mode: 'system' }, false)
    resetPage()
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('uses the system mode without a saved theme or with a broken one', () => {
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
    resetPage()
    localStorage.setItem(THEME_STORAGE_KEY, '{broken')
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
  })
})
