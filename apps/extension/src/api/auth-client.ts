import { createAuthClient } from 'better-auth/vue'
import { getToken } from './session'

export const authClient = createAuthClient({
  baseURL: import.meta.env.WXT_API_URL,
  fetchOptions: {
    // The token travels in a header. Without 'omit' the browser would require CORS with credentials.
    credentials: 'omit',
    auth: { type: 'Bearer', token: () => getToken() ?? undefined },
  },
})
