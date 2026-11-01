// Not in positions.ts: the queries sort on the start-up path, and positions.ts brings
// fractional-indexing with it, which only adding and moving need.

// The same order as the API: byte order (COLLATE "C"), then the id. localeCompare() would put
// 'Zz' after 'a0'.
export function byPosition(
  a: { id: string; position: string },
  b: { id: string; position: string },
) {
  if (a.position !== b.position) return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}
