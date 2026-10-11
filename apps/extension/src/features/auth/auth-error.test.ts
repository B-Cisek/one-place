import { describe, expect, it } from 'vitest'
import { authErrorKey } from './auth-error'

describe('authErrorKey', () => {
  it('uses one generic message for wrong email or password', () => {
    expect(authErrorKey({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(
      'auth.errors.invalidCredentials',
    )
  })

  it('recognizes an email that is already taken', () => {
    expect(authErrorKey({ status: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' })).toBe(
      'auth.errors.emailTaken',
    )
  })

  it('recognizes rate limiting', () => {
    expect(authErrorKey({ status: 429 })).toBe('auth.errors.tooManyAttempts')
  })

  it('falls back to a generic message', () => {
    expect(authErrorKey({ status: 500 })).toBe('auth.errors.unknown')
  })
})
