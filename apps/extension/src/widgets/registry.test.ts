import { WIDGET_SIZES } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { findWidgetDefinition } from './registry'

describe('findWidgetDefinition', () => {
  it('returns the definition of a known type with the sizes from shared', () => {
    expect(findWidgetDefinition('todo')).toMatchObject({
      type: 'todo',
      defaultSize: WIDGET_SIZES.todo.default,
      minSize: WIDGET_SIZES.todo.min,
    })
  })

  it('returns null for a type added in a newer version of the extension', () => {
    expect(findWidgetDefinition('notes')).toBeNull()
  })
})
