// Shared by the grid in preview (CSS grid) and in edit mode (grid-layout-plus), so a widget does
// not move when the mode changes. grid-layout-plus puts `GRID_GAP` around and between widgets.
export const ROW_HEIGHT = 40
export const GRID_GAP = 10

// The height of a widget `h` rows tall, gaps between its rows included
export function widgetHeight(h: number) {
  return h * ROW_HEIGHT + (h - 1) * GRID_GAP
}
