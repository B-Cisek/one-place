import { describe, expect, it } from 'vitest'
import { CreateTodoSchema, UpdateTodoSchema } from './todos'

const validTodo = { id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10', text: 'Mleko', position: 'a0' }

describe('CreateTodoSchema', () => {
  it('accepts valid input and trims the text', () => {
    expect(CreateTodoSchema.parse({ ...validTodo, text: '  Mleko  ' })).toEqual(validTodo)
  })

  it('requires a text of 1 to 500 characters after trimming', () => {
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: '   ' }).success).toBe(false)
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: 'a'.repeat(500) }).success).toBe(true)
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: 'a'.repeat(501) }).success).toBe(false)
  })

  it('requires a UUID and a fractional index key', () => {
    expect(CreateTodoSchema.safeParse({ ...validTodo, id: '42' }).success).toBe(false)
    expect(CreateTodoSchema.safeParse({ ...validTodo, position: 'a 0' }).success).toBe(false)
  })
})

describe('UpdateTodoSchema', () => {
  it('accepts a single field and validates it', () => {
    expect(UpdateTodoSchema.parse({ done: true })).toEqual({ done: true })
    expect(UpdateTodoSchema.parse({ text: ' Chleb ' })).toEqual({ text: 'Chleb' })
    expect(UpdateTodoSchema.safeParse({ done: 'yes' }).success).toBe(false)
    expect(UpdateTodoSchema.safeParse({ text: '' }).success).toBe(false)
  })

  it('does not move a task to another widget', () => {
    expect(UpdateTodoSchema.parse({ widgetId: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b11' })).toEqual({})
  })
})
