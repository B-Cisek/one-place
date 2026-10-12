import { describe, expect, it } from 'vitest'
import { detectLocale } from './locale'

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
