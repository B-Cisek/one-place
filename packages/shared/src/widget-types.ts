// Constants without Zod. The extension imports them on the start-up path, and a module with
// schemas would bring the whole Zod with it (about 90 kB), even if only a constant is used.
export const WIDGET_TYPES = ['todo'] as const
export const GRID_COLUMNS = 12
export const MAX_WIDGETS_PER_CONTEXT = 50

export type WidgetType = (typeof WIDGET_TYPES)[number]

export interface WidgetSize {
  w: number
  h: number
}

// In grid units. The API checks the minimum, the extension uses both when adding and resizing.
export const WIDGET_SIZES: Record<WidgetType, { min: WidgetSize; default: WidgetSize }> = {
  todo: { min: { w: 3, h: 3 }, default: { w: 4, h: 6 } },
}

export function isWidgetType(type: string): type is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(type)
}

export interface WidgetDto<TConfig = unknown> {
  id: string
  contextId: string
  // A string, not WidgetType: a newer version of the extension may have added a type (F-WGT-06)
  type: string
  config: TConfig
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
  version: number
}
