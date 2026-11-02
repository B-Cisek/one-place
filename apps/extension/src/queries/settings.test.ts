import { DEFAULT_THEME, type SettingsDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'
import { settingsKey, useUpdateSettings } from './settings'
import { createQueryClient } from './query-client'
import { deferred, jsonResponse, withQueryClient } from './testing'

const api = vi.hoisted(() => ({ patch: vi.fn() }))

vi.mock('@/api/client', () => ({ apiClient: { api: { settings: { $patch: api.patch } } } }))

const saved: SettingsDto = { locale: null, theme: DEFAULT_THEME, updatedAt: null, version: 0 }

describe('useUpdateSettings', () => {
  it('changes the language at once and brings it back when the API rejects it', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(settingsKey, saved)
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateSettings)

    const saving = mutateAsync({ locale: 'en' })
    await vi.waitFor(() =>
      expect(queryClient.getQueryData<SettingsDto>(settingsKey)?.locale).toBe('en'),
    )

    response.resolve(jsonResponse(500, { error: { code: 'INTERNAL_ERROR', message: 'Boom' } }))
    await expect(saving).rejects.toThrow()
    expect(queryClient.getQueryData(settingsKey)).toEqual(saved)
  })

  it('keeps showing the latest accent while an earlier change is answered', async () => {
    // With the defaults of the app, so changes go to the API one after another
    const queryClient = createQueryClient()
    queryClient.setQueryData(settingsKey, saved)
    const first = deferred<Response>()
    const second = deferred<Response>()
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { mutate } = withQueryClient(queryClient, useUpdateSettings)
    const accent = () => queryClient.getQueryData<SettingsDto>(settingsKey)?.theme.accent

    // Two quick clicks on the accent swatches
    mutate({ theme: { ...DEFAULT_THEME, accent: 'green' } })
    mutate({ theme: { ...DEFAULT_THEME, accent: 'rose' } })
    await vi.waitFor(() => expect(accent()).toBe('rose'))

    const green = { ...DEFAULT_THEME, accent: 'green' }
    first.resolve(jsonResponse(200, { ...saved, theme: green, version: 1 }))
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
    expect(accent()).toBe('rose')

    const rose = { ...DEFAULT_THEME, accent: 'rose' }
    second.resolve(jsonResponse(200, { ...saved, theme: rose, version: 2 }))
    await vi.waitFor(() =>
      expect(queryClient.getQueryData<SettingsDto>(settingsKey)?.version).toBe(2),
    )
  })
})
