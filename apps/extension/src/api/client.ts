import { hc } from 'hono/client'
import type { AppType } from '@one-place/api'
import { createAuthFetch } from './auth-fetch'
import { endSession, getToken } from './session'

export const apiClient = hc<AppType>(import.meta.env.WXT_API_URL, {
  fetch: createAuthFetch({
    getToken,
    // F-AUTH-05: any 401 from the API works like signing out
    onUnauthorized: () => void endSession('session-expired'),
  }),
})
