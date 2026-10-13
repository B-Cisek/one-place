import { MAX_CONTEXTS } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput } from './fixtures'

const notFound = { error: { code: 'NOT_FOUND', message: 'Context not found' } }

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  return { app, client, alice, bob }
}

describe('GET /api/contexts', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    expect((await app.request('/api/contexts')).status).toBe(401)
  })

  it('returns only own contexts sorted by position', async () => {
    const { alice, bob } = await setup()
    await alice.post('/api/contexts', contextInput({ name: 'Second', position: 'a1' }))
    await alice.post('/api/contexts', contextInput({ name: 'First', position: 'Zz' }))
    await alice.post('/api/contexts', contextInput({ name: 'Middle', position: 'a0V' }))
    await bob.post('/api/contexts', contextInput({ name: 'Bob', position: 'a0' }))
    const res = await alice.get('/api/contexts')
    expect(res.status).toBe(200)
    const names = (await res.json()).map((context: { name: string }) => context.name)
    expect(names).toEqual(['First', 'Middle', 'Second'])
  })
})

describe('POST /api/contexts', () => {
  it('creates a context and returns the full record with 201', async () => {
    const { alice } = await setup()
    const input = contextInput({ name: '  Praca  ' })
    const res = await alice.post('/api/contexts', input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      name: 'Praca',
      icon: input.icon,
      position: input.position,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing record with 200 when the same request is retried', async () => {
    const { alice } = await setup()
    const input = contextInput()
    const first = await (await alice.post('/api/contexts', input)).json()
    const retry = await alice.post('/api/contexts', input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get('/api/contexts')).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.post('/api/contexts', input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it('rejects invalid input', async () => {
    const { alice } = await setup()
    const res = await alice.post('/api/contexts', contextInput({ name: 'a'.repeat(41) }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it(`allows at most ${MAX_CONTEXTS} contexts, but still answers a retry`, async () => {
    const { alice } = await setup()
    const inputs = Array.from({ length: MAX_CONTEXTS }, () => contextInput())
    for (const input of inputs) await alice.post('/api/contexts', input)
    const res = await alice.post('/api/contexts', contextInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post('/api/contexts', inputs[0])).status).toBe(200)
  })
})

describe('PATCH /api/contexts/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}`, { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  it('updates the given fields and increments the version', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await alice.patch(`/api/contexts/${input.id}`, { name: 'Dom', position: 'a5' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: input.id,
      name: 'Dom',
      icon: input.icon,
      position: 'a5',
      version: 2,
    })
  })

  it("returns 404 for another user's context and leaves it unchanged", async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.patch(`/api/contexts/${input.id}`, { name: 'Hacked' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(notFound)
    expect(await (await alice.get('/api/contexts')).json()).toMatchObject([{ name: 'Praca' }])
  })

  it('rejects an id that is not a UUID and invalid fields', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    expect((await alice.patch('/api/contexts/42', { name: 'Dom' })).status).toBe(400)
    expect((await alice.patch(`/api/contexts/${input.id}`, { name: '' })).status).toBe(400)
  })
})

describe('DELETE /api/contexts/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('deletes the context', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await alice.delete(`/api/contexts/${input.id}`)
    expect(res.status).toBe(204)
    expect(await (await alice.get('/api/contexts')).json()).toEqual([])
    expect((await alice.delete(`/api/contexts/${input.id}`)).status).toBe(404)
  })

  it("returns 404 for another user's context and keeps it", async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.delete(`/api/contexts/${input.id}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(notFound)
    expect(await (await alice.get('/api/contexts')).json()).toHaveLength(1)
  })

  it('happens automatically when the user is deleted', async () => {
    const { client, alice } = await setup()
    await alice.post('/api/contexts', contextInput())
    await client.query(`delete from "user" where email = $1`, [TEST_USER.email])
    const { rows } = await client.query('select id from contexts')
    expect(rows).toEqual([])
  })
})
