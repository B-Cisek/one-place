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
      mutations: {
        // All changes go to the API one after another, in the order they were made. Otherwise a
        // change of a task could reach the API before the task (or its widget) is saved and get 404,
        // e.g. after coming back online.
        scope: { id: 'api' },
      },
    },
  })
}
