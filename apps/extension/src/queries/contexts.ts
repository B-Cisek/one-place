import type { ContextDto, CreateContextInput, UpdateContextInput } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { changeOptimistically } from './optimistic'
import { widgetsKey } from './widgets'

export const contextsKey = ['contexts'] as const

// The same order as the API: byte order (COLLATE "C"), then the id. localeCompare() would put
// 'Zz' after 'a0'.
function byPosition(a: ContextDto, b: ContextDto) {
  if (a.position !== b.position) return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}

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
    mutationFn: (input: CreateContextInput) =>
      parseResponse(apiClient.api.contexts.$post({ json: input })),
    onMutate: (input) => {
      const now = new Date().toISOString()
      const draft: ContextDto = { ...input, createdAt: now, updatedAt: now, version: 1 }
      return changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        withContext(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
  })
}

export function useUpdateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...changes }: UpdateContextInput & { id: string }) =>
      parseResponse(apiClient.api.contexts[':id'].$patch({ param: { id }, json: changes })),
    onMutate: ({ id, ...changes }) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withContext(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
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
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: widgetsKey(id) }),
  })
}
