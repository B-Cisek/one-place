import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('parses a valid config and sets defaults', () => {
    const env = parseEnv({ DATABASE_URL: 'postgres://one:one@localhost:5432/one_place' })
    expect(env.PORT).toBe(3000)
    expect(env.ALLOWED_ORIGINS).toEqual([])
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('splits ALLOWED_ORIGINS on commas and trims whitespace', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgres://one:one@localhost:5432/one_place',
      ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b',
    })
    expect(env.ALLOWED_ORIGINS).toEqual(['chrome-extension://a', 'chrome-extension://b'])
  })

  it('throws a readable error when DATABASE_URL is missing', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/)
  })
})
