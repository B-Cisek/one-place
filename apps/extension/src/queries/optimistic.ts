import type { QueryClient, QueryKey } from '@tanstack/vue-query'

// The first step of an optimistic change (F-SYNC-04). Cancels running fetches of the key, so a
// late response cannot overwrite the change, applies the change to the cached data, and returns
// a function that brings back the data from before the change.
export async function changeOptimistically<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  change: (data: T) => T,
) {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData<T>(queryKey)
  if (previous !== undefined) queryClient.setQueryData<T>(queryKey, change(previous))
  return () => queryClient.setQueryData(queryKey, previous)
}
