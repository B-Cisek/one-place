import { QueryClient } from '@tanstack/vue-query'
import { shouldRetry } from '@/api/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // A query nobody watches is removed after gcTime (5 minutes by default), and then it is
        // also gone from the saved cache. CACHE_MAX_AGE (30 days) does not fit into setTimeout
        // (max about 24.8 days) and would become 1 ms, so the cache is never collected.
        gcTime: Infinity,
      },
    },
  })
}
