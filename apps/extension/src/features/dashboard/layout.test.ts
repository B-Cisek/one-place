import { compact } from 'grid-layout-plus/es/helpers/common'
import { describe, expect, it } from 'vitest'
import { changedLayout, columnOrder, compactLayout, placeNewWidget } from './layout'

const rect = (id: string, x: number, y: number, w = 4, h = 2) => ({ id, x, y, w, h })

describe('compactLayout', () => {
  it('moves a widget up into the gap left by a deleted one', () => {
    expect(compactLayout([rect('a', 0, 0), rect('b', 0, 5)])).toEqual([
      rect('a', 0, 0),
      rect('b', 0, 2),
    ])
  })

  it('moves a widget to the top when nothing is above it', () => {
    expect(compactLayout([rect('a', 0, 0), rect('b', 4, 3)])[1]).toEqual(rect('b', 4, 0))
  })

  it('pushes down a widget that overlaps another, e.g. added at once on two devices', () => {
    expect(compactLayout([rect('b', 0, 0), rect('a', 0, 0)])).toEqual([
      rect('b', 0, 2),
      rect('a', 0, 0),
    ])
  })

  it('places widgets exactly like the grid in edit mode', () => {
    const layouts = [
      [rect('a', 0, 3), rect('b', 2, 0, 4, 1), rect('c', 4, 6, 8, 3)],
      [rect('a', 0, 0, 12, 1), rect('b', 0, 4, 6), rect('c', 6, 2, 6, 5), rect('d', 3, 9)],
      [rect('a', 0, 0), rect('b', 0, 0), rect('c', 2, 1), rect('d', 8, 7, 4, 4)],
    ]
    for (const layout of layouts) {
      // grid-layout-plus works on `i` instead of `id` and changes the items in place
      const expected = compact(
        layout.map(({ id, ...item }) => ({ ...item, i: id })),
        true,
      ).map(({ i, x, y, w, h }) => ({ id: String(i), x, y, w, h }))
      expect(compactLayout(layout)).toEqual(expected)
    }
  })
})

describe('placeNewWidget', () => {
  it('puts a new widget below all the others, at the left edge', () => {
    expect(placeNewWidget([], { w: 4, h: 6 })).toEqual({ x: 0, y: 0, w: 4, h: 6 })
    const layout = [rect('a', 0, 0, 4, 6), rect('b', 4, 0, 4, 2)]
    expect(placeNewWidget(layout, { w: 4, h: 6 })).toEqual({ x: 0, y: 6, w: 4, h: 6 })
  })
})

describe('changedLayout', () => {
  it('returns only the widgets that moved or changed size', () => {
    const saved = [rect('a', 0, 0), rect('b', 4, 0), rect('c', 8, 0)]
    const current = [rect('a', 0, 2), rect('b', 4, 0), rect('c', 8, 0, 4, 3)]
    expect(changedLayout(saved, current)).toEqual([rect('a', 0, 2), rect('c', 8, 0, 4, 3)])
  })
})

describe('columnOrder', () => {
  it('sorts widgets by row and then by column for the one-column view', () => {
    const layout = [rect('c', 0, 6), rect('b', 4, 0), rect('a', 0, 0)]
    expect(columnOrder(layout).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})
