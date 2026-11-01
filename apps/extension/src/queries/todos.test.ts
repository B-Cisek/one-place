import type { TodoDto, WidgetDto } from '@one-place/shared'
import type { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeleteContext } from './contexts'
import { todosKey, widgetsKey } from './keys'
import { createQueryClient } from './query-client'
import { deferred, jsonResponse, withQueryClient } from './testing'
import { useAddTodo, useDeleteTodo, useTodos, useUpdateTodo } from './todos'
import { useCreateWidget, useDeleteWidget } from './widgets'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  createWidget: vi.fn(),
  deleteWidget: vi.fn(),
  deleteContext: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        ':id': { widgets: { $post: api.createWidget }, $delete: api.deleteContext },
      },
      widgets: {
        ':id': { todos: { $get: api.get, $post: api.post }, $delete: api.deleteWidget },
      },
      todos: { ':id': { $patch: api.patch, $delete: api.delete } },
    },
  },
}))

function todo(overrides: Partial<TodoDto>): TodoDto {
  return {
    id: 'id',
    widgetId: 'tasks',
    text: 'Mleko',
    done: false,
    position: 'a0',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const milk = todo({ id: 'milk', position: 'a0' })
const bread = todo({ id: 'bread', text: 'Chleb', position: 'a1' })
const key = todosKey('tasks')

let queryClient: QueryClient

function cached() {
  return queryClient.getQueryData<TodoDto[]>(key)
}

function ids() {
  return cached()?.map((item) => item.id)
}

beforeEach(() => {
  vi.resetAllMocks()
  // With the defaults of the app, so changes go to the API one after another
  queryClient = createQueryClient()
  queryClient.setQueryData(key, [milk, bread])
})

describe('useAddTodo', () => {
  it('shows the new task at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useAddTodo)

    const saving = mutateAsync({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' })
    await vi.waitFor(() => expect(ids()).toEqual(['milk', 'bread', 'butter']))
    expect(cached()?.[2]).toMatchObject({ done: false, version: 1 })

    const saved = todo({ id: 'butter', text: 'Masło', position: 'a2' })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(cached()?.[2]).toEqual(saved)
  })

  it('removes the new task when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many tasks' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useAddTodo)
    await expect(
      mutateAsync({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' }),
    ).rejects.toThrow()
    expect(cached()).toEqual([milk, bread])
  })
})

describe('useUpdateTodo', () => {
  it('moves a task at once, keeping the list sorted by position', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)

    const saving = mutateAsync({ id: 'bread', widgetId: 'tasks', position: 'Zz' })
    await vi.waitFor(() => expect(ids()).toEqual(['bread', 'milk']))

    response.resolve(jsonResponse(200, { ...bread, position: 'Zz', version: 2 }))
    await saving
    expect(cached()?.[0]).toMatchObject({ id: 'bread', version: 2 })
  })

  it('brings back the task when the API rejects the change', async () => {
    api.patch.mockResolvedValue(
      jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)
    await expect(mutateAsync({ id: 'milk', widgetId: 'tasks', done: true })).rejects.toThrow()
    expect(cached()).toEqual([milk, bread])
  })
})

describe('useUpdateTodo after a task was deleted on another device', () => {
  it('fetches the tasks again, so the deleted one disappears', async () => {
    api.patch.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Task not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)
    await expect(mutateAsync({ id: 'bread', widgetId: 'tasks', done: false })).rejects.toThrow()
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
})

describe('useDeleteTodo', () => {
  it('treats a task deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Task not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteTodo)
    await mutateAsync({ id: 'milk', widgetId: 'tasks' })
    expect(cached()).toEqual([bread])
  })
})

describe('useTodos', () => {
  it('waits with the tasks of a new widget until the API saves the widget', async () => {
    const saved = deferred<Response>()
    api.createWidget.mockReturnValue(saved.promise)
    api.get.mockResolvedValue(jsonResponse(200, []))
    queryClient.setQueryData(widgetsKey('work'), [])
    const input = { id: 'shopping', type: 'todo', config: {}, x: 0, y: 0, w: 4, h: 6 } as const
    const { mutate } = withQueryClient(queryClient, useCreateWidget)

    mutate({ contextId: 'work', ...input })
    const { data } = withQueryClient(queryClient, () => useTodos('shopping'))
    await vi.waitFor(() => expect(data.value).toEqual([]))
    expect(api.get).not.toHaveBeenCalled()

    saved.resolve(jsonResponse(201, { ...input, contextId: 'work', createdAt: 'now' }))
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce())
  })
})

describe('cache of deleted widgets', () => {
  it('removes the tasks of a deleted widget', async () => {
    api.deleteWidget.mockResolvedValue(new Response(null, { status: 204 }))
    queryClient.setQueryData(widgetsKey('work'), [{ id: 'tasks' }])
    const { mutateAsync } = withQueryClient(queryClient, useDeleteWidget)
    await mutateAsync({ id: 'tasks', contextId: 'work' })
    expect(cached()).toBeUndefined()
  })

  it('removes the tasks of the widgets of a deleted context', async () => {
    api.deleteContext.mockResolvedValue(new Response(null, { status: 204 }))
    queryClient.setQueryData<Partial<WidgetDto>[]>(widgetsKey('work'), [{ id: 'tasks' }])
    const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
    await mutateAsync('work')
    expect(cached()).toBeUndefined()
  })
})

describe('order of changes', () => {
  it('sends a change of a new task only after the API saves the task', async () => {
    const created = deferred<Response>()
    api.post.mockReturnValue(created.promise)
    api.delete.mockResolvedValue(new Response(null, { status: 204 }))
    const add = withQueryClient(queryClient, useAddTodo)
    const remove = withQueryClient(queryClient, useDeleteTodo)

    add.mutate({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' })
    remove.mutate({ id: 'butter', widgetId: 'tasks' })
    // The delete waits in the queue (paused) until the task is saved
    await vi.waitFor(() => expect(remove.isPaused.value).toBe(true))
    expect(ids()).toEqual(['milk', 'bread'])
    expect(api.delete).not.toHaveBeenCalled()

    created.resolve(jsonResponse(201, todo({ id: 'butter', text: 'Masło', position: 'a2' })))
    await vi.waitFor(() => expect(api.delete).toHaveBeenCalledOnce())
  })

  it('keeps showing the latest change while an earlier one is answered', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { mutate } = withQueryClient(queryClient, useUpdateTodo)

    // A quick double click on the checkbox
    mutate({ id: 'milk', widgetId: 'tasks', done: true })
    mutate({ id: 'milk', widgetId: 'tasks', done: false })
    await vi.waitFor(() => expect(cached()?.[0]?.done).toBe(false))

    first.resolve(jsonResponse(200, { ...milk, done: true, version: 2 }))
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
    expect(cached()?.[0]?.done).toBe(false)

    second.resolve(jsonResponse(200, { ...milk, done: false, version: 3 }))
    await vi.waitFor(() => expect(cached()?.[0]?.version).toBe(3))
  })
})
