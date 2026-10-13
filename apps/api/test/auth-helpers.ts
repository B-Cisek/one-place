import type { AppType } from '../src/app'
import { TEST_ORIGIN } from './create-test-app'

export const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'correct-horse-battery',
}

let ipCounter = 0

// Better Auth limits sign-in and sign-up to 3 requests per 10 s per IP, and keeps the counters
// in memory shared by all tests in a file. A fresh IP per request keeps tests independent.
export function uniqueIp() {
  ipCounter += 1
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`
}

export function postJson(
  app: AppType,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
      'X-Forwarded-For': uniqueIp(),
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

export async function signUp(app: AppType, user = TEST_USER) {
  const res = await postJson(app, '/api/auth/sign-up/email', user)
  const token = res.headers.get('set-auth-token')
  if (!res.ok || !token) throw new Error(`Sign-up failed with status ${res.status}`)
  return token
}

export function asUser(app: AppType, token: string) {
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  return {
    get: (path: string) => send('GET', path),
    post: (path: string, body: unknown) => send('POST', path, body),
    patch: (path: string, body: unknown) => send('PATCH', path, body),
    delete: (path: string) => send('DELETE', path),
  }
}
