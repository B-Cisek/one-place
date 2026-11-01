import { describe, expect, it } from 'vitest'
import { byPosition } from './by-position'

describe('byPosition', () => {
  it('sorts by bytes like the API, then by id', () => {
    const list = [
      { id: '2', position: 'a0' },
      { id: '3', position: 'Zz' },
      { id: '1', position: 'a0' },
    ]
    expect(list.sort(byPosition).map((item) => item.id)).toEqual(['3', '1', '2'])
  })
})
