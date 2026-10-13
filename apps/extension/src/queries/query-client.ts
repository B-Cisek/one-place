import { QueryClient } from '@tanstack/vue-query'
import { shouldRetry } from '@/api/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
  })
}
