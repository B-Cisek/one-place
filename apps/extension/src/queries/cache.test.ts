import type { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { CACHE_KEY, clearCache, persistCache, restoreCache } from './cache'
import { createQueryClient } from './query-client'

const contexts = [{ id: '1', name: 'Praca' }]

// What a new tab opened right now would find in the saved cache
async function restoredInNewTab(queryKey: string[]) {
  const newTab = createQueryClient()
  await restoreCache(newTab)
  return newTab.getQueryData(queryKey)
}

// The persister saves at most once per second, so wait for the save
function eventually(assertion: () => Promise<void>) {
  return vi.waitFor(assertion, { timeout: 3000, interval: 100 })
}

async function tabWithSavedContexts() {
  const tab = createQueryClient()
  persistCache(tab)
  tab.setQueryData(['contexts'], contexts)
  await eventually(async () => expect(await restoredInNewTab(['contexts'])).toEqual(contexts))
  return tab
}

function failRefetch(tab: QueryClient) {
  return tab
    .fetchQuery({
      queryKey: ['contexts'],
      queryFn: () => Promise.reject(new TypeError('Failed to fetch')),
      retry: false,
    })
    .catch(() => {})
}

describe('query cache in chrome.storage.local', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('restores data saved by a previous tab', async () => {
    await tabWithSavedContexts()
  })

  it('keeps cached data when a refetch fails, e.g. while the API is down', async () => {
    const tab = await tabWithSavedContexts()
    await failRefetch(tab)
    tab.setQueryData(['me'], { name: 'Bartek' })
    await eventually(async () => expect(await restoredInNewTab(['me'])).toBeDefined())
    expect(await restoredInNewTab(['contexts'])).toEqual(contexts)
  })

  it('drops a cache saved by a version with a different data shape', async () => {
    await tabWithSavedContexts()
    const { [CACHE_KEY]: saved } =
      await fakeBrowser.storage.local.get<Record<string, string>>(CACHE_KEY)
    await fakeBrowser.storage.local.set({
      [CACHE_KEY]: JSON.stringify({ ...JSON.parse(saved!), buster: '0' }),
    })
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
    expect(await fakeBrowser.storage.local.get(CACHE_KEY)).toEqual({})
  })

  it('ignores a damaged cache instead of failing to start', async () => {
    await fakeBrowser.storage.local.set({ [CACHE_KEY]: '{not json' })
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
  })

  it('removes all data from memory and storage on sign-out', async () => {
    const tab = await tabWithSavedContexts()
    await clearCache(tab)
    expect(tab.getQueryData(['contexts'])).toBeUndefined()
    // At once, in case the tab closes before the next throttled save
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
    await eventually(async () => expect(await restoredInNewTab(['contexts'])).toBeUndefined())
  })
})
