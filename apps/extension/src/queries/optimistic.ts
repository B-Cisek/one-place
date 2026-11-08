import type { MutationKey, QueryClient, QueryKey } from '@tanstack/vue-query'

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

// Changes wait in one queue, so a later change of the same data may still be waiting when this one
// is answered. Its optimistic state is newer than this response: writing the response would show an
// older state for a moment (a task ticked twice in a row, or the accent clicked twice, would
// blink). The last change writes.
export function hasLaterChanges(queryClient: QueryClient, mutationKey: MutationKey) {
  // This mutation is still pending while its onSuccess runs, so it counts too
  return queryClient.isMutating({ mutationKey }) > 1
}
