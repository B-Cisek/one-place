import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AppError, handleError } from '../src/lib/errors'
import { createTestApp } from './create-test-app'

function appThatThrows(error: Error) {
  return new Hono()
    .get('/boom', () => {
      throw error
    })
    .onError(handleError)
}

describe('error handling', () => {
  it('maps AppError to its status and code', async () => {
    const app = appThatThrows(new AppError(422, 'LIMIT_EXCEEDED', 'Too many contexts'))
    const res = await app.request('/boom')
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({
      error: { code: 'LIMIT_EXCEEDED', message: 'Too many contexts' },
    })
  })

  it('maps ZodError to 400 with field errors', async () => {
    const result = z.object({ name: z.string() }).safeParse({})
    const app = appThatThrows(result.error!)
    const res = await app.request('/boom')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.fieldErrors).toHaveProperty('name')
  })

  it('hides details of unexpected errors', async () => {
    const app = appThatThrows(new Error('connection string postgres://secret'))
    const res = await app.request('/boom')
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
    expect(text).not.toContain('secret')
  })

  it('returns NOT_FOUND in the standard format for unknown API routes', async () => {
    const { app } = createTestApp()
    const res = await app.request('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })
})
