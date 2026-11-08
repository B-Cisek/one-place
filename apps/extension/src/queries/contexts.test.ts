import type { ContextDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { contextsKey, useCreateContext, useDeleteContext, useUpdateContext } from './contexts'
import { deferred, jsonResponse, withQueryClient } from './testing'
import { widgetsKey } from './keys'
import { createQueryClient } from './query-client'

const api = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        $post: api.post,
        ':id': { $patch: api.patch, $delete: api.delete },
      },
    },
  },
}))

function context(overrides: Partial<ContextDto>): ContextDto {
  return {
    id: 'id',
    name: 'Praca',
    icon: 'i-lucide-briefcase',
    position: 'a0',
    themeOverride: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const work = context({ id: 'work', name: 'Praca', position: 'a0' })
const home = context({ id: 'home', name: 'Dom', position: 'a1' })

let queryClient: QueryClient

function cachedNames() {
  return queryClient.getQueryData<ContextDto[]>(contextsKey)?.map((item) => item.name)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient = new QueryClient()
  queryClient.setQueryData(contextsKey, [work, home])
})

describe('useCreateContext', () => {
  it('shows the new context at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useCreateContext)
    const input = { id: 'new', name: 'Hobby', icon: 'i-lucide-music', position: 'a2' } as const

    const saving = mutateAsync(input)
    await vi.waitFor(() => expect(cachedNames()).toEqual(['Praca', 'Dom', 'Hobby']))

    const saved = context({ ...input, version: 1, createdAt: '2026-10-12T08:00:00.000Z' })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(queryClient.getQueryData<ContextDto[]>(contextsKey)?.[2]).toEqual(saved)
  })

  it('removes the new context when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many contexts' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useCreateContext)
    const input = { id: 'new', name: 'Hobby', icon: 'i-lucide-music', position: 'a2' } as const
    await expect(mutateAsync(input)).rejects.toThrow()
    expect(cachedNames()).toEqual(['Praca', 'Dom'])
  })
})

describe('useUpdateContext', () => {
  it('keeps showing the latest change while an earlier one is answered', async () => {
    queryClient = createQueryClient()
    queryClient.setQueryData(contextsKey, [work, home])
    const first = deferred<Response>()
    const second = deferred<Response>()
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { mutate } = withQueryClient(queryClient, useUpdateContext)
    const accent = () =>
      queryClient.getQueryData<ContextDto[]>(contextsKey)?.[0]?.themeOverride?.accent

    mutate({ id: 'work', themeOverride: { accent: 'green' } })
    mutate({ id: 'work', themeOverride: { accent: 'rose' } })
    await vi.waitFor(() => expect(accent()).toBe('rose'))

    first.resolve(jsonResponse(200, { ...work, themeOverride: { accent: 'green' }, version: 2 }))
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
    expect(accent()).toBe('rose')

    second.resolve(jsonResponse(200, { ...work, themeOverride: { accent: 'rose' }, version: 3 }))
    await vi.waitFor(() =>
      expect(queryClient.getQueryData<ContextDto[]>(contextsKey)?.[0]?.version).toBe(3),
    )
  })

  it('keeps the list sorted by position after a move', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateContext)

    // 'Zz' sorts before 'a0' only in byte order
    const saving = mutateAsync({ id: 'home', position: 'Zz' })
    await vi.waitFor(() => expect(cachedNames()).toEqual(['Dom', 'Praca']))

    response.resolve(jsonResponse(200, { ...home, position: 'Zz', version: 2 }))
    await saving
    expect(cachedNames()).toEqual(['Dom', 'Praca'])
  })

  it('brings back the old name when the API rejects the change', async () => {
    api.patch.mockRejectedValue(new TypeError('Failed to fetch'))
    const { mutateAsync } = withQueryClient(queryClient, useUpdateContext)
    await expect(mutateAsync({ id: 'work', name: 'Robota' })).rejects.toThrow()
    expect(cachedNames()).toEqual(['Praca', 'Dom'])
  })
})

describe('useDeleteContext', () => {
  it('treats a context deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Context not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
    await mutateAsync('work')
    expect(cachedNames()).toEqual(['Dom'])
  })
})

it('forgets the cached widgets of the deleted context', async () => {
  api.delete.mockResolvedValue(new Response(null, { status: 204 }))
  queryClient.setQueryData(widgetsKey('work'), [{ id: 'tasks' }])
  const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
  await mutateAsync('work')
  expect(queryClient.getQueryData(widgetsKey('work'))).toBeUndefined()
})
