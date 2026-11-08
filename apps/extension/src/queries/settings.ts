import type { SettingsDto, UpdateSettingsInput } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiClient } from '@/api/client'
import { changeOptimistically, hasLaterChanges } from './optimistic'

export const settingsKey = ['settings'] as const
const settingsChangeKey = ['settings', 'change'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => parseResponse(apiClient.api.settings.$get()),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: settingsChangeKey,
    mutationFn: (changes: UpdateSettingsInput) =>
      parseResponse(apiClient.api.settings.$patch({ json: changes })),
    onMutate: (changes) =>
      changeOptimistically<SettingsDto>(queryClient, settingsKey, (settings) => ({
        ...settings,
        ...changes,
      })),
    onError: (_error, _changes, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient, settingsChangeKey)) return
      queryClient.setQueryData(settingsKey, saved)
    },
  })
}
