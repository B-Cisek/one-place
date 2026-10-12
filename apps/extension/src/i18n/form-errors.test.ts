import { SignUpSchema } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { formErrors } from './form-errors'

const t = (key: string) => `translated:${key}`

describe('formErrors', () => {
  it('returns no errors for valid input', () => {
    const validate = formErrors(SignUpSchema, t)
    expect(validate({ name: 'Ala', email: 'ala@example.com', password: 'correct-horse' })).toEqual(
      [],
    )
  })

  it('translates the message of every invalid field', () => {
    const validate = formErrors(SignUpSchema, t)
    expect(validate({ name: '', email: 'ala@example.com', password: 'short' })).toEqual([
      { name: 'name', message: 'translated:validation.nameRequired' },
      { name: 'password', message: 'translated:validation.passwordTooShort' },
    ])
  })
})
