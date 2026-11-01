import type {
  CreateTodoInput,
  CreateWidgetInput,
  TodoDto,
  UpdateTodoInput,
} from '@one-place/shared'
import {
  type QueryClient,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { byPosition } from '@/lib/by-position'
import { createWidgetKey, todosKey } from './keys'
import { changeOptimistically } from './optimistic'

interface TodoRef {
  id: string
  widgetId: string
}

// Adds the task or replaces the one with the same id, keeping the list sorted
function withTodo(list: TodoDto[], todo: TodoDto) {
  return [...list.filter((item) => item.id !== todo.id), todo].sort(byPosition)
}

const todoChangeKey = ['todos', 'change'] as const

// Changes wait in one queue, so a later change of the tasks may still be waiting when this one is
// answered. Its optimistic state is newer than this response: writing the response would show an
// older state for a moment (a task ticked twice in a row would blink). The last change writes.
function hasLaterChanges(queryClient: QueryClient) {
  // This mutation is still pending while its onSuccess runs, so it counts too
  return queryClient.isMutating({ mutationKey: todoChangeKey }) > 1
}

export function useTodos(widgetId: MaybeRefOrGetter<string>) {
  // The same as with a new context: a widget added in this tab is in the cache before the API
  // saves it, and its tasks would get 404. Until then the cache has [] from useCreateWidget().
  const unsaved = useMutationState({
    filters: { mutationKey: createWidgetKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as CreateWidgetInput).id,
  })
  return useQuery({
    queryKey: computed(() => todosKey(toValue(widgetId))),
    queryFn: ({ queryKey: [, id] }) =>
      parseResponse(apiClient.api.widgets[':id'].todos.$get({ param: { id } })),
    enabled: computed(() => !unsaved.value.includes(toValue(widgetId))),
  })
}

export function useAddTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: todoChangeKey,
    mutationFn: ({ widgetId, ...input }: CreateTodoInput & { widgetId: string }) =>
      parseResponse(
        apiClient.api.widgets[':id'].todos.$post({ param: { id: widgetId }, json: input }),
      ),
    onMutate: ({ widgetId, ...input }) => {
      const now = new Date().toISOString()
      const draft: TodoDto = {
        ...input,
        widgetId,
        done: false,
        createdAt: now,
        updatedAt: now,
        version: 1,
      }
      return changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) =>
        withTodo(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient)) return
      queryClient.setQueryData<TodoDto[]>(todosKey(saved.widgetId), (list = []) =>
        withTodo(list, saved),
      )
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: todoChangeKey,
    mutationFn: ({ id, text, done, position }: TodoRef & UpdateTodoInput) =>
      parseResponse(
        apiClient.api.todos[':id'].$patch({ param: { id }, json: { text, done, position } }),
      ),
    onMutate: ({ id, widgetId, ...changes }) =>
      changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withTodo(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient)) return
      queryClient.setQueryData<TodoDto[]>(todosKey(saved.widgetId), (list = []) =>
        withTodo(list, saved),
      )
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: todoChangeKey,
    mutationFn: async ({ id }: TodoRef) => {
      try {
        await parseResponse(apiClient.api.todos[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: ({ id, widgetId }) =>
      changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  })
}
