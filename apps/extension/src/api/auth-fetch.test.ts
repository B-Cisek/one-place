import { describe, expect, it, vi } from 'vitest'
import { createAuthFetch } from './auth-fetch'

function setup({ token = 'token' as string | null, response = new Response('{}') } = {}) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => response)
  const onUnauthorized = vi.fn()
  const authFetch = createAuthFetch({ getToken: () => token, onUnauthorized, fetch })
  const sentHeaders = () => new Headers(fetch.mock.calls[0]?.[1]?.headers)
  return { authFetch, onUnauthorized, sentHeaders }
}

describe('createAuthFetch', () => {
  it('sends the token as a Bearer header and keeps other headers', async () => {
    const { authFetch, sentHeaders } = setup()
    await authFetch('http://api.test/api/me', { headers: { 'Content-Type': 'application/json' } })
    expect(sentHeaders().get('Authorization')).toBe('Bearer token')
    expect(sentHeaders().get('Content-Type')).toBe('application/json')
  })

  it('sends no Authorization header without a token', async () => {
    const { authFetch, sentHeaders } = setup({ token: null })
    await authFetch('http://api.test/api/me')
    expect(sentHeaders().has('Authorization')).toBe(false)
  })

  it('reports a 401 response', async () => {
    const { authFetch, onUnauthorized } = setup({ response: new Response('{}', { status: 401 }) })
    await authFetch('http://api.test/api/me')
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not report other errors', async () => {
    const { authFetch, onUnauthorized } = setup({ response: new Response('{}', { status: 503 }) })
    await authFetch('http://api.test/api/me')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
