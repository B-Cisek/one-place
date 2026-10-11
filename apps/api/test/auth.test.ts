import { describe, expect, it } from 'vitest'
import { postJson, signUp, TEST_USER } from './auth-helpers'
import { createTestApp, TEST_ORIGIN } from './create-test-app'

describe('auth', () => {
  it('signs up a user and returns a session token', async () => {
    const { app } = await createTestApp()
    const res = await postJson(app, '/api/auth/sign-up/email', { ...TEST_USER, name: '  Ala  ' })
    expect(res.status).toBe(200)
    expect(res.headers.get('set-auth-token')).toBeTruthy()
    expect((await res.json()).user.name).toBe('Ala')
  })

  it('creates a session valid for 30 days', async () => {
    const { app, client } = await createTestApp()
    await signUp(app)
    const { rows } = await client.query<{ days: number }>(
      `select extract(epoch from expires_at - created_at) / 86400 as days from session`,
    )
    expect(Number(rows[0]?.days)).toBeCloseTo(30)
  })

  it('rejects a name longer than 50 characters and creates no user', async () => {
    const { app, client } = await createTestApp()
    const res = await postJson(app, '/api/auth/sign-up/email', {
      ...TEST_USER,
      name: 'a'.repeat(51),
    })
    expect(res.status).toBe(400)
    const { rows } = await client.query('select id from "user"')
    expect(rows).toHaveLength(0)
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    const { app } = await createTestApp()
    await signUp(app)
    const wrongPassword = await postJson(app, '/api/auth/sign-in/email', {
      email: TEST_USER.email,
      password: 'wrong-password',
    })
    const unknownEmail = await postJson(app, '/api/auth/sign-in/email', {
      email: 'nobody@example.com',
      password: 'wrong-password',
    })
    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect((await wrongPassword.json()).code).toBe((await unknownEmail.json()).code)
  })

  it('returns the session for a bearer token', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const res = await app.request('/api/auth/get-session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    expect((await res.json()).user.email).toBe(TEST_USER.email)
  })

  it('rejects sign-in from an origin outside the allowed list', async () => {
    const { app } = await createTestApp()
    await signUp(app)
    const res = await postJson(
      app,
      '/api/auth/sign-in/email',
      { email: TEST_USER.email, password: TEST_USER.password },
      { Origin: 'https://evil.example' },
    )
    expect(res.status).toBe(403)
  })

  it('limits sign-in attempts to 3 per 10 seconds per IP', async () => {
    const { app } = await createTestApp()
    const attempt = () =>
      postJson(
        app,
        '/api/auth/sign-in/email',
        { email: TEST_USER.email, password: 'wrong-password' },
        { 'X-Forwarded-For': '203.0.113.7' },
      )
    const statuses = []
    for (let i = 0; i < 4; i++) statuses.push((await attempt()).status)
    expect(statuses).toEqual([401, 401, 401, 429])
  })

  it('lets the extension send Authorization and read set-auth-token', async () => {
    const { app } = await createTestApp()
    const preflight = await app.request('/api/auth/sign-in/email', {
      method: 'OPTIONS',
      headers: {
        Origin: TEST_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    })
    expect(preflight.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain(
      'authorization',
    )
    const res = await postJson(app, '/api/auth/sign-up/email', TEST_USER)
    expect(res.headers.get('Access-Control-Expose-Headers')?.toLowerCase()).toContain(
      'set-auth-token',
    )
  })
})
