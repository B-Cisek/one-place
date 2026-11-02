import type {
  ContextDto,
  CreateContextInput,
  UpdateContextInput,
  WidgetDto,
} from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { byPosition } from '@/lib/by-position'
import { createContextKey, todosKey, widgetsKey } from './keys'
import { changeOptimistically, hasLaterChanges } from './optimistic'

export const contextsKey = ['contexts'] as const
const contextChangeKey = ['contexts', 'change'] as const

// Adds the context or replaces the one with the same id, keeping the list sorted
function withContext(list: ContextDto[], context: ContextDto) {
  return [...list.filter((item) => item.id !== context.id), context].sort(byPosition)
}

export function useContexts() {
  return useQuery({
    queryKey: contextsKey,
    queryFn: () => parseResponse(apiClient.api.contexts.$get()),
  })
}

export function useCreateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: createContextKey,
    mutationFn: (input: CreateContextInput) =>
      parseResponse(apiClient.api.contexts.$post({ json: input })),
    onMutate: async (input) => {
      const now = new Date().toISOString()
      const draft: ContextDto = {
        ...input,
        themeOverride: null,
        createdAt: now,
        updatedAt: now,
        version: 1,
      }
      const rollback = await changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        withContext(list, draft),
      )
      // A new context has no widgets. Its dashboard shows that at once, also offline.
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(input.id), [])
      return rollback
    },
    onError: (_error, input, rollback) => {
      rollback?.()
      queryClient.removeQueries({ queryKey: widgetsKey(input.id) })
    },
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
  })
}

export function useUpdateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: contextChangeKey,
    mutationFn: ({ id, ...changes }: UpdateContextInput & { id: string }) =>
      parseResponse(apiClient.api.contexts[':id'].$patch({ param: { id }, json: changes })),
    onMutate: ({ id, ...changes }) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withContext(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient, contextChangeKey)) return
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved))
    },
  })
}

export function useDeleteContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await parseResponse(apiClient.api.contexts[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device. What the user wanted has happened.
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: (id) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _id, rollback) => rollback?.(),
    onSuccess: (_data, id) => {
      // The API deleted the widgets and their tasks, so their cache entries go too
      for (const widget of queryClient.getQueryData<WidgetDto[]>(widgetsKey(id)) ?? []) {
        queryClient.removeQueries({ queryKey: todosKey(widget.id) })
      }
      queryClient.removeQueries({ queryKey: widgetsKey(id) })
    },
  })
}
