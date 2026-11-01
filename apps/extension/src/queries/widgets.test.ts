import type { WidgetDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, jsonResponse, withQueryClient } from './testing'
import { contextsKey, useCreateContext } from './contexts'
import { widgetsKey } from './keys'
import {
  useCreateWidget,
  useDeleteWidget,
  useSaveLayout,
  useUpdateWidgetConfig,
  useWidgets,
} from './widgets'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  createContext: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        $post: api.createContext,
        ':id': { widgets: { $get: api.get, $post: api.post }, layout: { $put: api.put } },
      },
      widgets: { ':id': { $patch: api.patch, $delete: api.delete } },
    },
  },
}))

function widget(overrides: Partial<WidgetDto>): WidgetDto {
  return {
    id: 'id',
    contextId: 'work',
    type: 'todo',
    config: { title: '' },
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const tasks = widget({ id: 'tasks' })
const shopping = widget({ id: 'shopping', x: 4 })
const key = widgetsKey('work')

let queryClient: QueryClient

function cached() {
  return queryClient.getQueryData<WidgetDto[]>(key)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient = new QueryClient()
  queryClient.setQueryData(key, [tasks, shopping])
})

describe('useCreateWidget', () => {
  it('shows the new widget at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useCreateWidget)
    const input = { id: 'new', type: 'todo', config: {}, x: 0, y: 6, w: 4, h: 6 } as const

    const saving = mutateAsync({ contextId: 'work', ...input })
    await vi.waitFor(() =>
      expect(cached()?.map((item) => item.id)).toEqual(['tasks', 'shopping', 'new']),
    )

    const saved = widget({ ...input, config: { title: '', hideCompleted: false } })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(cached()?.[2]).toEqual(saved)
  })

  it('removes the new widget when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many widgets' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useCreateWidget)
    const input = { id: 'new', type: 'todo', config: {}, x: 0, y: 6, w: 4, h: 6 } as const
    await expect(mutateAsync({ contextId: 'work', ...input })).rejects.toThrow()
    expect(cached()).toEqual([tasks, shopping])
  })
})

describe('useSaveLayout', () => {
  it('moves widgets at once and moves them back when the API rejects the layout', async () => {
    const response = deferred<Response>()
    api.put.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useSaveLayout)

    const saving = mutateAsync({
      contextId: 'work',
      items: [{ id: 'tasks', x: 0, y: 6, w: 6, h: 4 }],
    })
    await vi.waitFor(() => expect(cached()?.[0]).toMatchObject({ y: 6, w: 6, h: 4 }))

    response.resolve(jsonResponse(400, { error: { code: 'LAYOUT_INVALID', message: 'Invalid' } }))
    await expect(saving).rejects.toThrow()
    expect(cached()).toEqual([tasks, shopping])
  })
})

describe('useUpdateWidgetConfig', () => {
  it('changes the config at once and keeps the saved one', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateWidgetConfig)

    const saving = mutateAsync({ id: 'tasks', contextId: 'work', config: { title: 'Zakupy ' } })
    await vi.waitFor(() => expect(cached()?.[0]?.config).toEqual({ title: 'Zakupy ' }))

    const saved = { ...tasks, config: { title: 'Zakupy' }, version: 2 }
    response.resolve(jsonResponse(200, saved))
    await saving
    expect(cached()?.[0]).toEqual(saved)
  })
})

describe('useDeleteWidget', () => {
  it('treats a widget deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Widget not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteWidget)
    await mutateAsync({ id: 'tasks', contextId: 'work' })
    expect(cached()).toEqual([shopping])
  })
})

describe('useWidgets', () => {
  it('waits with the widgets of a new context until the API saves the context', async () => {
    const saved = deferred<Response>()
    api.createContext.mockReturnValue(saved.promise)
    api.get.mockResolvedValue(jsonResponse(200, []))
    queryClient.setQueryData(contextsKey, [])
    const input = { id: 'hobby', name: 'Hobby', icon: 'i-lucide-music', position: 'a0' } as const
    const { mutate } = withQueryClient(queryClient, useCreateContext)

    mutate(input)
    // The dashboard of the new context opens at once, like after useAddContext()
    const { data } = withQueryClient(queryClient, () => useWidgets('hobby'))
    await vi.waitFor(() => expect(data.value).toEqual([]))
    expect(api.get).not.toHaveBeenCalled()

    saved.resolve(jsonResponse(201, { ...input, createdAt: 'now', updatedAt: 'now', version: 1 }))
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce())
  })
})
