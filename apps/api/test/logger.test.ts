import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { pino } from 'pino'
import { describe, expect, it } from 'vitest'
import { handleError } from '../src/lib/errors'
import { requestLogger } from '../src/middleware/logger'
import { createTestApp } from './create-test-app'

function createLoggedApp() {
  const lines: Record<string, unknown>[] = []
  const logger = pino({ level: 'info' }, { write: (line: string) => lines.push(JSON.parse(line)) })
  const app = new Hono()
    .use(requestId())
    .use(requestLogger(logger))
    .get('/ok', (c) => c.text('ok'))
    .get('/boom', () => {
      throw new Error('kaboom')
    })
    .onError(handleError)
  return { app, lines }
}

describe('request logging', () => {
  it('writes one JSON line per request with the request id', async () => {
    const { app, lines } = createLoggedApp()
    const res = await app.request('/ok?token=secret')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      level: 30,
      requestId: res.headers.get('X-Request-Id'),
      method: 'GET',
      path: '/ok',
      status: 200,
    })
    expect(lines[0]).toHaveProperty('durationMs')
    expect(JSON.stringify(lines[0])).not.toContain('secret')
  })

  it('logs unexpected errors with the stack at error level', async () => {
    const { app, lines } = createLoggedApp()
    await app.request('/boom')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ level: 50, status: 500, err: { message: 'kaboom' } })
    expect(lines[0]?.err).toHaveProperty('stack')
  })

  it('adds X-Request-Id to API responses', async () => {
    const { app } = await createTestApp()
    const res = await app.request('/api/health')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })
})
