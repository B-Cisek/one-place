import { describe, expect, it } from 'vitest'
import { detectLocale, resolveLocale } from './locale'

describe('detectLocale', () => {
  it('returns pl for any Polish browser language', () => {
    expect(detectLocale('pl')).toBe('pl')
    expect(detectLocale('pl-PL')).toBe('pl')
  })

  it('returns en for every other language', () => {
    expect(detectLocale('en-US')).toBe('en')
    expect(detectLocale('de')).toBe('en')
    expect(detectLocale('')).toBe('en')
  })
})

describe('resolveLocale', () => {
  it('uses the language saved on the account', () => {
    expect(resolveLocale('en', 'pl-PL')).toBe('en')
  })

  it('follows the browser when the account has no language', () => {
    expect(resolveLocale(null, 'pl-PL')).toBe('pl')
    expect(resolveLocale(undefined, 'de-DE')).toBe('en')
  })
})
