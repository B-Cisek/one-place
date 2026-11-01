import { MAX_TODOS_PER_WIDGET } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput, todoInput, widgetInput } from './fixtures'

const widgetNotFound = { error: { code: 'NOT_FOUND', message: 'Widget not found' } }

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  const context = contextInput()
  await alice.post('/api/contexts', context)
  const widget = widgetInput()
  await alice.post(`/api/contexts/${context.id}/widgets`, widget)
  const todosPath = `/api/widgets/${widget.id}/todos`
  return { app, client, alice, bob, contextId: context.id, widgetId: widget.id, todosPath }
}

// Only `todo` exists in WIDGET_TYPES, so a widget of another type goes straight to the database,
// as if a newer version of the API had added it
async function insertNotesWidget(
  client: Awaited<ReturnType<typeof setup>>['client'],
  contextId: string,
) {
  const { rows } = await client.query<{ id: string }>(
    `insert into widgets (id, user_id, context_id, type, config, x, y, w, h)
     select gen_random_uuid(), user_id, id, 'notes', '{}', 0, 0, 4, 4 from contexts where id = $1
     returning id`,
    [contextId],
  )
  return rows[0]!.id
}

describe('GET /api/widgets/:id/todos', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}/todos`)
    expect(res.status).toBe(401)
  })

  it('returns the tasks in byte order of the position, then by id', async () => {
    const { alice, todosPath } = await setup()
    const [first, second] = [todoInput({ position: 'a1' }), todoInput({ position: 'a1' })].sort(
      (a, b) => (a.id < b.id ? -1 : 1),
    )
    for (const input of [todoInput({ text: 'a0', position: 'a0' }), second!, first!]) {
      await alice.post(todosPath, input)
    }
    await alice.post(todosPath, todoInput({ text: 'Zz', position: 'Zz' }))
    const res = await alice.get(todosPath)
    expect(res.status).toBe(200)
    const todos: { id: string; position: string }[] = await res.json()
    expect(todos.map((todo) => todo.position)).toEqual(['Zz', 'a0', 'a1', 'a1'])
    expect(todos.slice(2).map((todo) => todo.id)).toEqual([first!.id, second!.id])
  })

  it("returns 404 for another user's widget", async () => {
    const { bob, todosPath } = await setup()
    const res = await bob.get(todosPath)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
  })

  it('returns 400 for a widget that is not a todo widget', async () => {
    const { client, alice, contextId } = await setup()
    const notesId = await insertNotesWidget(client, contextId)
    const res = await alice.get(`/api/widgets/${notesId}/todos`)
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/widgets/:id/todos', () => {
  it('creates a task that is not done and returns it with 201', async () => {
    const { alice, widgetId, todosPath } = await setup()
    const input = todoInput({ text: '  Mleko  ' })
    const res = await alice.post(todosPath, input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      widgetId,
      text: 'Mleko',
      done: false,
      position: 'a0',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing task with 200 when the request is retried', async () => {
    const { alice, todosPath } = await setup()
    const input = todoInput()
    const first = await (await alice.post(todosPath, input)).json()
    const retry = await alice.post(todosPath, input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get(todosPath)).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob, todosPath } = await setup()
    const input = todoInput()
    await alice.post(todosPath, input)
    const bobsContext = contextInput()
    await bob.post('/api/contexts', bobsContext)
    const bobsWidget = widgetInput()
    await bob.post(`/api/contexts/${bobsContext.id}/widgets`, bobsWidget)
    const res = await bob.post(`/api/widgets/${bobsWidget.id}/todos`, input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it("returns 404 for another user's widget", async () => {
    const { bob, todosPath } = await setup()
    const res = await bob.post(todosPath, todoInput())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
  })

  it('rejects an empty text, a too long text and an invalid position', async () => {
    const { alice, todosPath } = await setup()
    for (const input of [
      todoInput({ text: '   ' }),
      todoInput({ text: 'a'.repeat(501) }),
      todoInput({ position: 'a 0' }),
    ]) {
      const res = await alice.post(todosPath, input)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('returns 400 for a widget that is not a todo widget', async () => {
    const { client, alice, contextId } = await setup()
    const notesId = await insertNotesWidget(client, contextId)
    const res = await alice.post(`/api/widgets/${notesId}/todos`, todoInput())
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it(`allows at most ${MAX_TODOS_PER_WIDGET} tasks in a widget`, async () => {
    const { client, alice, widgetId, todosPath } = await setup()
    const last = todoInput()
    // 499 tasks straight in the database, in one query instead of 499 requests
    await client.query(
      `insert into todo_items (id, user_id, widget_id, text, position)
       select gen_random_uuid(), user_id, id, 'Task ' || n, 'a' || n
       from widgets cross join generate_series(1, $2::int) n where id = $1`,
      [widgetId, MAX_TODOS_PER_WIDGET - 1],
    )
    expect((await alice.post(todosPath, last)).status).toBe(201)
    const res = await alice.post(todosPath, todoInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post(todosPath, last)).status).toBe(200)
  })
})

describe('DELETE /api/widgets/:id', () => {
  it('deletes the tasks of the widget', async () => {
    const { client, alice, widgetId, todosPath } = await setup()
    await alice.post(todosPath, todoInput())
    await alice.delete(`/api/widgets/${widgetId}`)
    const { rows } = await client.query('select id from todo_items')
    expect(rows).toEqual([])
  })
})
