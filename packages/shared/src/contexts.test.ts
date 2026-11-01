import { describe, expect, it } from 'vitest'
import { CreateContextSchema, UpdateContextSchema } from './contexts'

const validContext = {
  id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10',
  name: 'Praca',
  icon: 'i-lucide-briefcase',
  position: 'a0',
}

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('CreateContextSchema', () => {
  it('accepts valid input and trims the name', () => {
    const result = CreateContextSchema.safeParse({ ...validContext, name: '  Praca  ' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Praca')
  })

  it('requires a name of 1 to 40 characters after trimming', () => {
    expect(firstMessage(CreateContextSchema.safeParse({ ...validContext, name: '   ' }))).toBe(
      'validation.contextNameRequired',
    )
    expect(CreateContextSchema.safeParse({ ...validContext, name: 'a'.repeat(40) }).success).toBe(
      true,
    )
    expect(
      firstMessage(CreateContextSchema.safeParse({ ...validContext, name: 'a'.repeat(41) })),
    ).toBe('validation.contextNameTooLong')
  })

  it('accepts only icons from CONTEXT_ICONS', () => {
    expect(CreateContextSchema.safeParse({ ...validContext, icon: 'i-lucide-skull' }).success).toBe(
      false,
    )
  })

  it('requires a UUID as the id', () => {
    expect(CreateContextSchema.safeParse({ ...validContext, id: '42' }).success).toBe(false)
  })

  it('accepts fractional index keys as the position', () => {
    for (const position of ['a0', 'Zz', 'a0V']) {
      expect(CreateContextSchema.safeParse({ ...validContext, position }).success).toBe(true)
    }
    for (const position of ['', 'a 0', 'a-0']) {
      expect(CreateContextSchema.safeParse({ ...validContext, position }).success).toBe(false)
    }
  })
})

describe('UpdateContextSchema', () => {
  it('accepts a single field and validates it', () => {
    expect(UpdateContextSchema.parse({ name: ' Dom ' })).toEqual({ name: 'Dom' })
    expect(UpdateContextSchema.safeParse({ icon: 'i-lucide-skull' }).success).toBe(false)
  })

  it('accepts a theme override or null that removes it', () => {
    expect(UpdateContextSchema.parse({ themeOverride: { accent: 'rose' } })).toEqual({
      themeOverride: { accent: 'rose' },
    })
    expect(UpdateContextSchema.parse({ themeOverride: null })).toEqual({ themeOverride: null })
    expect(UpdateContextSchema.safeParse({ themeOverride: { accent: 'red' } }).success).toBe(false)
  })

  it('does not take a theme override when creating a context', () => {
    expect(CreateContextSchema.parse({ ...validContext, themeOverride: {} })).toEqual(validContext)
  })
})
