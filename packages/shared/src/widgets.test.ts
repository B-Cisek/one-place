import { describe, expect, it } from 'vitest'
import { WIDGET_TYPES } from './widget-types'
import { CreateWidgetSchema, LayoutSchema, TodoConfigSchema, widgetConfigSchemas } from './widgets'

const validWidget = {
  id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10',
  type: 'todo',
  config: {},
  x: 0,
  y: 0,
  w: 4,
  h: 6,
}

function issues(result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return result.error?.issues.map((issue) => ({ path: issue.path, message: issue.message }))
}

describe('TodoConfigSchema', () => {
  it('fills in the default config', () => {
    expect(TodoConfigSchema.parse({})).toEqual({
      title: '',
      hideCompleted: false,
      source: { type: 'local' },
    })
  })

  it('trims the title and allows at most 60 characters', () => {
    expect(TodoConfigSchema.parse({ title: '  Zakupy  ' }).title).toBe('Zakupy')
    expect(TodoConfigSchema.safeParse({ title: 'a'.repeat(60) }).success).toBe(true)
    expect(issues(TodoConfigSchema.safeParse({ title: 'a'.repeat(61) }))).toEqual([
      { path: ['title'], message: 'validation.widgetTitleTooLong' },
    ])
  })
})

describe('widgetConfigSchemas', () => {
  // The extension adds widgets with `config: {}` and fixes invalid fields with the defaults
  it('give every widget type a full default config', () => {
    for (const type of WIDGET_TYPES) {
      expect(widgetConfigSchemas[type].safeParse({}).success).toBe(true)
    }
  })
})

describe('CreateWidgetSchema', () => {
  it('accepts a valid widget and fills in its config', () => {
    const result = CreateWidgetSchema.safeParse(validWidget)
    expect(result.success).toBe(true)
    expect(result.data?.config).toEqual({
      title: '',
      hideCompleted: false,
      source: { type: 'local' },
    })
  })

  it('accepts only types from WIDGET_TYPES', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, type: 'notes' }).success).toBe(false)
  })

  it('validates the config with the schema of its type', () => {
    const result = CreateWidgetSchema.safeParse({
      ...validWidget,
      config: { title: 'a'.repeat(61) },
    })
    expect(issues(result)).toEqual([
      { path: ['config', 'title'], message: 'validation.widgetTitleTooLong' },
    ])
  })

  it('requires the widget to fit in 12 columns', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 8, w: 4 }).success).toBe(true)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 9, w: 4 }).success).toBe(false)
  })

  it('rejects sizes below the minimum of the type and positions that are not whole numbers', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, w: 2 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, h: 2 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 1.5 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, y: -1 }).success).toBe(false)
  })
})

describe('LayoutSchema', () => {
  const item = { id: validWidget.id, x: 0, y: 0, w: 4, h: 6 }

  it('accepts a list of positions and sizes', () => {
    expect(LayoutSchema.safeParse([item]).success).toBe(true)
  })

  it('rejects the same widget twice and items that do not fit', () => {
    expect(LayoutSchema.safeParse([item, { ...item, y: 6 }]).success).toBe(false)
    expect(LayoutSchema.safeParse([{ ...item, x: 10 }]).success).toBe(false)
  })
})
