import type { TodoDto } from '@one-place/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useLocalTaskSource } from './local-task-source'

const mutations = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn(), remove: vi.fn() }))

function todo(id: string, position: string, done = false): TodoDto {
  return {
    id,
    widgetId: 'tasks',
    text: id,
    done,
    position,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

// The source only turns calls into mutations, so the queries are replaced with plain functions
vi.mock('@/queries/todos', () => ({
  useTodos: () => ({
    data: ref([todo('milk', 'a0'), todo('bread', 'a1', true), todo('butter', 'a2')]),
    isError: ref(false),
    refetch: vi.fn(),
  }),
  useAddTodo: () => ({ mutate: mutations.add }),
  useUpdateTodo: () => ({ mutate: mutations.update }),
  useDeleteTodo: () => ({ mutate: mutations.remove }),
}))

beforeEach(() => vi.resetAllMocks())

describe('useLocalTaskSource', () => {
  it('adds a task after the last one', () => {
    useLocalTaskSource('tasks').add('Jajka')
    const [input] = mutations.add.mock.lastCall!
    expect(input).toMatchObject({ widgetId: 'tasks', text: 'Jajka', id: expect.any(String) })
    expect(input.position > 'a2').toBe(true)
  })

  it('toggles a task to the opposite of its current state', () => {
    const source = useLocalTaskSource('tasks')
    source.toggle('milk')
    source.toggle('bread')
    expect(mutations.update.mock.calls).toEqual([
      [{ id: 'milk', widgetId: 'tasks', done: true }],
      [{ id: 'bread', widgetId: 'tasks', done: false }],
    ])
  })

  it('moves a task between its new neighbours', () => {
    const source = useLocalTaskSource('tasks')
    source.move('butter', 'milk', 'bread')
    const middle = mutations.update.mock.lastCall![0].position
    expect(middle > 'a0' && middle < 'a1').toBe(true)

    source.move('butter', null, 'milk')
    expect(mutations.update.mock.lastCall![0].position < 'a0').toBe(true)
  })
})
