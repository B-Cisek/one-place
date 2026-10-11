import { describe, expect, it } from 'vitest'
import { createTestApp, TEST_ORIGIN } from './create-test-app'

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

  it('allows CORS only for the extension origin', async () => {
    const { app } = createTestApp()
    const allowed = await app.request('/api/health', { headers: { Origin: TEST_ORIGIN } })
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(TEST_ORIGIN)
    const denied = await app.request('/api/health', { headers: { Origin: 'https://evil.example' } })
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
