import { describe, expect, it } from 'vitest'
import { SignInSchema, SignUpSchema } from './auth'

const validSignUp = { name: 'Bartek', email: 'bartek@example.com', password: 'correct-horse' }

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('SignUpSchema', () => {
  it('accepts valid input and trims the name', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, name: '  Bartek  ' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Bartek')
  })

  it('rejects a name made only of whitespace', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, name: '   ' })
    expect(firstMessage(result)).toBe('validation.nameRequired')
  })

  it('accepts a 50-character name and rejects a 51-character one', () => {
    expect(SignUpSchema.safeParse({ ...validSignUp, name: 'a'.repeat(50) }).success).toBe(true)
    const result = SignUpSchema.safeParse({ ...validSignUp, name: 'a'.repeat(51) })
    expect(firstMessage(result)).toBe('validation.nameTooLong')
  })

  it('enforces password length between 8 and 128 characters', () => {
    expect(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(8) }).success).toBe(true)
    expect(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(128) }).success).toBe(true)
    expect(firstMessage(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(7) }))).toBe(
      'validation.passwordTooShort',
    )
    expect(
      firstMessage(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(129) })),
    ).toBe('validation.passwordTooLong')
  })

  it('rejects an invalid email', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, email: 'not-an-email' })
    expect(firstMessage(result)).toBe('validation.emailInvalid')
  })
})

describe('SignInSchema', () => {
  it('does not check password length, only presence', () => {
    expect(SignInSchema.safeParse({ email: 'bartek@example.com', password: 'x' }).success).toBe(
      true,
    )
    const result = SignInSchema.safeParse({ email: 'bartek@example.com', password: '' })
    expect(firstMessage(result)).toBe('validation.passwordRequired')
  })
})
