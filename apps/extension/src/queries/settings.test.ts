import type { SettingsDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'
import { settingsKey, useUpdateSettings } from './settings'
import { deferred, jsonResponse, withQueryClient } from './testing'

const api = vi.hoisted(() => ({ patch: vi.fn() }))

vi.mock('@/api/client', () => ({ apiClient: { api: { settings: { $patch: api.patch } } } }))

const saved: SettingsDto = { locale: null, updatedAt: null, version: 0 }

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
})
