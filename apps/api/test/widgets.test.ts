import { MAX_WIDGETS_PER_CONTEXT } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput, widgetInput } from './fixtures'

const contextNotFound = { error: { code: 'NOT_FOUND', message: 'Context not found' } }

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  const context = contextInput()
  await alice.post('/api/contexts', context)
  return { app, client, alice, bob, contextId: context.id }
}

describe('GET /api/contexts/:id/widgets', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}/widgets`)
    expect(res.status).toBe(401)
  })

  it('returns only the widgets of the given context', async () => {
    const { alice, contextId } = await setup()
    const other = contextInput()
    await alice.post('/api/contexts', other)
    const widget = widgetInput()
    await alice.post(`/api/contexts/${contextId}/widgets`, widget)
    await alice.post(`/api/contexts/${other.id}/widgets`, widgetInput())
    const res = await alice.get(`/api/contexts/${contextId}/widgets`)
    expect(res.status).toBe(200)
    expect((await res.json()).map((item: { id: string }) => item.id)).toEqual([widget.id])
  })

  it("returns 404 for another user's context", async () => {
    const { bob, contextId } = await setup()
    const res = await bob.get(`/api/contexts/${contextId}/widgets`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(contextNotFound)
  })
})

describe('POST /api/contexts/:id/widgets', () => {
  it('creates a widget with the default config and returns it with 201', async () => {
    const { alice, contextId } = await setup()
    const input = widgetInput({ x: 4, y: 2 })
    const res = await alice.post(`/api/contexts/${contextId}/widgets`, input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      contextId,
      type: 'todo',
      config: { title: '', hideCompleted: false, source: { type: 'local' } },
      x: 4,
      y: 2,
      w: 4,
      h: 6,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing widget with 200 when the request is retried', async () => {
    const { alice, contextId } = await setup()
    const input = widgetInput()
    const first = await (await alice.post(`/api/contexts/${contextId}/widgets`, input)).json()
    const retry = await alice.post(`/api/contexts/${contextId}/widgets`, input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob, contextId } = await setup()
    const input = widgetInput()
    await alice.post(`/api/contexts/${contextId}/widgets`, input)
    const bobsContext = contextInput()
    await bob.post('/api/contexts', bobsContext)
    const res = await bob.post(`/api/contexts/${bobsContext.id}/widgets`, input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it("returns 404 for another user's context", async () => {
    const { bob, contextId } = await setup()
    const res = await bob.post(`/api/contexts/${contextId}/widgets`, widgetInput())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(contextNotFound)
  })

  it('rejects an unknown type, an invalid config and a widget outside the grid', async () => {
    const { alice, contextId } = await setup()
    const path = `/api/contexts/${contextId}/widgets`
    for (const input of [
      widgetInput({ type: 'notes' as 'todo' }),
      widgetInput({ config: { title: 'a'.repeat(61) } }),
      widgetInput({ x: 10, w: 4 }),
    ]) {
      const res = await alice.post(path, input)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })

  it(`allows at most ${MAX_WIDGETS_PER_CONTEXT} widgets in a context`, async () => {
    const { alice, contextId } = await setup()
    const path = `/api/contexts/${contextId}/widgets`
    const inputs = Array.from({ length: MAX_WIDGETS_PER_CONTEXT }, () => widgetInput())
    for (const input of inputs) await alice.post(path, input)
    const res = await alice.post(path, widgetInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post(path, inputs[0])).status).toBe(200)
  })
})

describe('DELETE /api/contexts/:id', () => {
  it('deletes the widgets of the context', async () => {
    const { client, alice, contextId } = await setup()
    await alice.post(`/api/contexts/${contextId}/widgets`, widgetInput())
    await alice.delete(`/api/contexts/${contextId}`)
    const { rows } = await client.query('select id from widgets')
    expect(rows).toEqual([])
  })
})

const widgetNotFound = { error: { code: 'NOT_FOUND', message: 'Widget not found' } }

async function setupWithWidget() {
  const result = await setup()
  const widget = widgetInput()
  await result.alice.post(`/api/contexts/${result.contextId}/widgets`, widget)
  return { ...result, widgetId: widget.id }
}

describe('PATCH /api/widgets/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}`, { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  it('replaces the config and increments the version', async () => {
    const { alice, widgetId } = await setupWithWidget()
    const res = await alice.patch(`/api/widgets/${widgetId}`, { config: { title: '  Zakupy  ' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: widgetId,
      config: { title: 'Zakupy', hideCompleted: false, source: { type: 'local' } },
      x: 0,
      w: 4,
      version: 2,
    })
  })

  it("returns 404 for another user's widget and leaves it unchanged", async () => {
    const { alice, bob, contextId, widgetId } = await setupWithWidget()
    const res = await bob.patch(`/api/widgets/${widgetId}`, { config: { title: 'Hacked' } })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
    const [widget] = await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()
    expect(widget.config.title).toBe('')
  })

  it('rejects a config that does not match the type and an id that is not a UUID', async () => {
    const { alice, widgetId } = await setupWithWidget()
    const invalid = await alice.patch(`/api/widgets/${widgetId}`, { config: { title: 123 } })
    expect(invalid.status).toBe(400)
    expect((await invalid.json()).error.code).toBe('VALIDATION_ERROR')
    expect((await alice.patch('/api/widgets/42', { config: {} })).status).toBe(400)
  })
})

describe('DELETE /api/widgets/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('deletes the widget', async () => {
    const { alice, contextId, widgetId } = await setupWithWidget()
    expect((await alice.delete(`/api/widgets/${widgetId}`)).status).toBe(204)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toEqual([])
    expect((await alice.delete(`/api/widgets/${widgetId}`)).status).toBe(404)
  })

  it("returns 404 for another user's widget and keeps it", async () => {
    const { alice, bob, contextId, widgetId } = await setupWithWidget()
    const res = await bob.delete(`/api/widgets/${widgetId}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toHaveLength(1)
  })
})
