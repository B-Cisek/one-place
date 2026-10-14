import { generateKeyBetween } from 'fractional-indexing'

interface Positioned {
  position: string
}

export function positionAfterLast(list: Positioned[]) {
  return generateKeyBetween(list.at(-1)?.position ?? null, null)
}

// `list` is already in the new order. Only the moved item gets a new position, between its
// new neighbours, so a move is a single PATCH.
export function positionAt(list: Positioned[], index: number) {
  const before = list[index - 1]?.position ?? null
  const after = list[index + 1]?.position ?? null
  // Equal neighbours (added on two devices at once) leave no room in between, and
  // generateKeyBetween() would throw. Going right after `before` is close enough.
  if (before !== null && after !== null && before >= after) {
    return generateKeyBetween(before, null)
  }
  return generateKeyBetween(before, after)
}
