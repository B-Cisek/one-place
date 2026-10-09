import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('GET /api/health', () => {
  it('returns ok when the database responds', async () => {
    const { app } = createTestApp()
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' })
  })

  it('returns 503 when the database is unreachable', async () => {
    const { app, client } = createTestApp()
    await client.close()
    const res = await app.request('/api/health')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'error', db: 'unreachable' })
  })
})
