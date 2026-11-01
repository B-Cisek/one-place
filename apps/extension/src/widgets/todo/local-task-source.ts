import { v7 as uuidv7 } from 'uuid'
import { positionAfterLast, positionBetween } from '@/lib/positions'
import { useAddTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/queries/todos'
import type { TaskSource } from './task-source'

// Tasks kept by the One Place API. Positions are fractional indexes, so a move is one PATCH.
export function useLocalTaskSource(widgetId: string): TaskSource {
  const { data: todos, isError, refetch } = useTodos(widgetId)
  const { mutate: addTodo } = useAddTodo()
  const { mutate: updateTodo } = useUpdateTodo()
  const { mutate: deleteTodo } = useDeleteTodo()

  // Neighbours are looked up in all tasks, also the ones the list hides
  const find = (id: string | null) => todos.value?.find((todo) => todo.id === id)

  return {
    items: todos,
    isError,
    retry: () => void refetch(),
    capabilities: { reorder: true },
    // F-TODO-01: at the end of the list
    add: (text) =>
      addTodo({ widgetId, id: uuidv7(), text, position: positionAfterLast(todos.value ?? []) }),
    // The new state comes from the cache, which knows about the optimistic changes too
    toggle: (id) => {
      const todo = find(id)
      if (todo) updateTodo({ id, widgetId, done: !todo.done })
    },
    edit: (id, text) => updateTodo({ id, widgetId, text }),
    remove: (id) => deleteTodo({ id, widgetId }),
    move: (id, beforeId, afterId) => {
      const position = positionBetween(
        find(beforeId)?.position ?? null,
        find(afterId)?.position ?? null,
      )
      updateTodo({ id, widgetId, position })
    },
  }
}
