import type { CreateWidgetInput, LayoutItem, UpdateWidgetInput, WidgetDto } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { changeOptimistically } from './optimistic'

// One cache entry per context, so switching back to a context shows its widgets at once
export function widgetsKey(contextId: string) {
  return ['widgets', contextId] as const
}

interface WidgetRef {
  id: string
  contextId: string
}

// Replaces the widget with the same id, or adds it at the end
function withWidget(list: WidgetDto[], widget: WidgetDto) {
  return list.some((item) => item.id === widget.id)
    ? list.map((item) => (item.id === widget.id ? widget : item))
    : [...list, widget]
}

function withLayout(list: WidgetDto[], items: LayoutItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]))
  return list.map((widget) => {
    const item = byId.get(widget.id)
    return item ? { ...widget, x: item.x, y: item.y, w: item.w, h: item.h } : widget
  })
}

export function useWidgets(contextId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => widgetsKey(toValue(contextId) ?? '')),
    queryFn: ({ queryKey: [, id] }) =>
      parseResponse(apiClient.api.contexts[':id'].widgets.$get({ param: { id } })),
    enabled: computed(() => toValue(contextId) !== null),
  })
}

export function useCreateWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contextId, ...input }: CreateWidgetInput & { contextId: string }) =>
      parseResponse(
        apiClient.api.contexts[':id'].widgets.$post({ param: { id: contextId }, json: input }),
      ),
    onMutate: ({ contextId, ...input }) => {
      const now = new Date().toISOString()
      const draft: WidgetDto = { ...input, contextId, createdAt: now, updatedAt: now, version: 1 }
      return changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        withWidget(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(saved.contextId), (list = []) =>
        withWidget(list, saved),
      ),
  })
}

export function useUpdateWidgetConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, config }: WidgetRef & UpdateWidgetInput) =>
      parseResponse(apiClient.api.widgets[':id'].$patch({ param: { id }, json: { config } })),
    onMutate: ({ id, contextId, config }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        list.map((item) => (item.id === id ? { ...item, config } : item)),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(saved.contextId), (list = []) =>
        withWidget(list, saved),
      ),
  })
}

export function useDeleteWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: WidgetRef) => {
      try {
        await parseResponse(apiClient.api.widgets[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: ({ id, contextId }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  })
}

export function useSaveLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contextId, items }: { contextId: string; items: LayoutItem[] }) =>
      parseResponse(
        apiClient.api.contexts[':id'].layout.$put({ param: { id: contextId }, json: items }),
      ),
    onMutate: ({ contextId, items }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        withLayout(list, items),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
    // The API returns every widget of the context
    onSuccess: (saved, { contextId }) => queryClient.setQueryData(widgetsKey(contextId), saved),
  })
}
