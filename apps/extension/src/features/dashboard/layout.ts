import type { LayoutItem, WidgetSize } from '@one-place/shared'

export interface GridRect {
  x: number
  y: number
  w: number
  h: number
}

type Placed = GridRect & { id: string }

function collides(a: GridRect, b: GridRect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

// Top left first. The id breaks ties, so every device gets the same result.
function byRowThenColumn(a: Placed, b: Placed) {
  return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1)
}

// F-GRID-03: widgets do not overlap and move up as far as they can. The same algorithm as
// `verticalCompact` in grid-layout-plus, so the preview looks exactly like the editor.
export function compactLayout<T extends Placed>(items: T[]): T[] {
  const placed: T[] = []
  for (const item of [...items].sort(byRowThenColumn)) {
    const next = { ...item }
    while (next.y > 0 && !placed.some((other) => collides(other, next))) next.y -= 1
    let collision: T | undefined
    while ((collision = placed.find((other) => collides(other, next)))) {
      next.y = collision.y + collision.h
    }
    placed.push(next)
  }
  // The same order as the input
  return items.map((item) => placed.find((other) => other.id === item.id)!)
}

// F-WGT-02: a new widget goes below all the others
export function placeNewWidget(items: GridRect[], size: WidgetSize): GridRect {
  const bottom = Math.max(0, ...items.map((item) => item.y + item.h))
  return { x: 0, y: bottom, ...size }
}

// Only what really changed is saved, so a click without a move sends nothing
export function changedLayout(saved: Placed[], current: Placed[]): LayoutItem[] {
  const savedById = new Map(saved.map((item) => [item.id, item]))
  return current
    .filter((item) => {
      const before = savedById.get(item.id)
      return (
        before !== undefined &&
        (before.x !== item.x || before.y !== item.y || before.w !== item.w || before.h !== item.h)
      )
    })
    .map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))
}

// F-GRID-05: in one column the widgets keep the reading order of the grid
export function columnOrder<T extends Placed>(items: T[]): T[] {
  return [...items].sort(byRowThenColumn)
}
