import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import {
  type PersistQueryClientOptions,
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import type { QueryClient } from '@tanstack/vue-query'
import { storage } from 'wxt/utils/storage'

// F-SYNC-07: bump it whenever the shape of cached data changes. A cache saved with another
// value is thrown away, and the data is fetched again.
export const CACHE_SCHEMA_VERSION = '2'
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30
export const CACHE_KEY = 'one-place:query-cache'

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => storage.getItem<string>(`local:${key}`),
    setItem: (key, value) => storage.setItem(`local:${key}`, value),
    removeItem: (key) => storage.removeItem(`local:${key}`),
  },
  key: CACHE_KEY,
  throttleTime: 1000,
})

function options(queryClient: QueryClient): PersistQueryClientOptions {
  return {
    queryClient,
    persister,
    buster: CACHE_SCHEMA_VERSION,
    maxAge: CACHE_MAX_AGE,
    dehydrateOptions: {
      // By default only queries in the 'success' state are saved. A failed refetch (API down)
      // switches a query to 'error' but keeps its data, which must stay in the cache.
      shouldDehydrateQuery: (query) => query.state.data !== undefined,
      // A change made offline is lost when the tab closes (known MVP limitation)
      shouldDehydrateMutation: () => false,
    },
  }
}

export async function restoreCache(queryClient: QueryClient) {
  try {
    await persistQueryClientRestore(options(queryClient))
  } catch {
    // The damaged cache is already removed. Start without it.
  }
}

export function persistCache(queryClient: QueryClient) {
  return persistQueryClientSubscribe(options(queryClient))
}

// F-AUTH-04. The subscription stays on, so the last save (throttled) writes the empty cache
// and cannot bring back data saved before.
export async function clearCache(queryClient: QueryClient) {
  queryClient.clear()
  await persister.removeClient()
}
