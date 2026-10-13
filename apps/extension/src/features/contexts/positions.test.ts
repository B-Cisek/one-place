import { describe, expect, it } from 'vitest'
import { positionAfterLast, positionAt } from './positions'

const items = (...positions: string[]) => positions.map((position) => ({ position }))

describe('positionAfterLast', () => {
  it('starts with a0 and then goes after the last item', () => {
    expect(positionAfterLast([])).toBe('a0')
    expect(positionAfterLast(items('a0', 'a1')) > 'a1').toBe(true)
  })
})

describe('positionAt', () => {
  it('puts an item moved to the top before the first one', () => {
    // The list is already in the new order, the moved item is at index 0
    const position = positionAt(items('a2', 'a0', 'a1'), 0)
    expect(position < 'a0').toBe(true)
  })

  it('puts an item moved to the middle between its neighbours', () => {
    const position = positionAt(items('a0', 'a2', 'a1'), 1)
    expect(position > 'a0' && position < 'a1').toBe(true)
  })

  it('puts an item moved to the end after the last one', () => {
    expect(positionAt(items('a1', 'a2', 'a0'), 2) > 'a2').toBe(true)
  })

  it('does not throw when two neighbours have the same position', () => {
    // Two devices added a context at the same time, both after 'a0'
    expect(() => positionAt(items('a1', 'a0', 'a1'), 1)).not.toThrow()
  })
})
