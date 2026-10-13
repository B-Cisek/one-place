import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { handleError } from '../src/lib/errors'
import { validate } from '../src/lib/validate'

const app = new Hono()
  .post(
    '/items/:id',
    validate('param', z.object({ id: z.uuid() })),
    validate('json', z.object({ name: z.string().trim().min(1) })),
    (c) => c.json({ id: c.req.valid('param').id, name: c.req.valid('json').name }),
  )
  .onError(handleError)

const id = '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10'

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('validate', () => {
  it('passes parsed data to the handler', async () => {
    const res = await post(`/items/${id}`, { name: '  Praca  ' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id, name: 'Praca' })
  })

  it('returns invalid JSON body in the standard error format', async () => {
    const res = await post(`/items/${id}`, { name: '' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.fieldErrors).toHaveProperty('name')
  })

  it('rejects a malformed JSON body with 400 instead of 500', async () => {
    const res = await app.request(`/items/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":',
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a path parameter that is not a UUID', async () => {
    const res = await post('/items/42', { name: 'Praca' })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })
})
