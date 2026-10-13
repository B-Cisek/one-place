import { useQuery } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiClient } from '@/api/client'

export const meKey = ['me'] as const

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => parseResponse(apiClient.api.me.$get()) })
}
