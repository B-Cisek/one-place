import { describe, expect, it } from 'vitest'
import { postJson, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'

const unauthorized = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }

describe('GET /api/me', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(unauthorized)
  })

  it('returns 401 for a token without a valid signature', async () => {
    const { app } = await createTestApp()
    const signUpRes = await postJson(app, '/api/auth/sign-up/email', TEST_USER)
    // The body holds the raw token as stored in the database, without the signature
    const { token: rawToken } = await signUpRes.json()
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${rawToken}` } })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(unauthorized)
  })

  it('returns the signed-in user', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: expect.any(String),
      name: TEST_USER.name,
      email: TEST_USER.email,
    })
  })

  it('returns 401 after sign-out', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const auth = { Authorization: `Bearer ${token}` }
    const signOut = await postJson(app, '/api/auth/sign-out', {}, auth)
    expect(signOut.status).toBe(200)
    const res = await app.request('/api/me', { headers: auth })
    expect(res.status).toBe(401)
  })
})
