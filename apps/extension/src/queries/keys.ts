// Keys used by more than one file in queries/. Here, so contexts.ts and widgets.ts do not
// import each other.

// Lets useWidgets() find contexts that are in the cache but not saved by the API yet
export const createContextKey = ['contexts', 'create'] as const

// One cache entry per context, so switching back to a context shows its widgets at once
export function widgetsKey(contextId: string) {
  return ['widgets', contextId] as const
}

// Lets useTodos() find widgets that are in the cache but not saved by the API yet
export const createWidgetKey = ['widgets', 'create'] as const

export function todosKey(widgetId: string) {
  return ['todos', widgetId] as const
}
