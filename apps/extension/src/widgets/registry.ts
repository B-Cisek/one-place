import { isWidgetType, WIDGET_SIZES, type WidgetType } from '@one-place/shared'
import type { WidgetDefinition } from './types'

export const widgetRegistry = {
  todo: {
    type: 'todo',
    name: 'widgets.todo.name',
    description: 'widgets.todo.description',
    icon: 'i-lucide-list-checks',
    defaultSize: WIDGET_SIZES.todo.default,
    minSize: WIDGET_SIZES.todo.min,
    component: () => import('./todo/TodoWidget.vue'),
  },
} satisfies Record<WidgetType, WidgetDefinition>

// F-WGT-06: null for a type this version of the extension does not know
export function findWidgetDefinition(type: string): WidgetDefinition | null {
  return isWidgetType(type) ? widgetRegistry[type] : null
}
