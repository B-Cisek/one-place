import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const validEnv = {
  DATABASE_URL: 'postgres://one:one@localhost:5432/one_place',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
}

describe('parseEnv', () => {
  it('parses a valid config and sets defaults', () => {
    const env = parseEnv(validEnv)
    expect(env.PORT).toBe(3000)
    expect(env.ALLOWED_ORIGINS).toEqual([])
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('splits ALLOWED_ORIGINS on commas and trims whitespace', () => {
    const env = parseEnv({
      ...validEnv,
      ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b',
    })
    expect(env.ALLOWED_ORIGINS).toEqual(['chrome-extension://a', 'chrome-extension://b'])
  })

  it('throws a readable error when DATABASE_URL is missing', () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/)
  })

  it('requires a BETTER_AUTH_SECRET of at least 32 characters', () => {
    expect(() => parseEnv({ ...validEnv, BETTER_AUTH_SECRET: 'too-short' })).toThrow(
      /BETTER_AUTH_SECRET/,
    )
  })
})
