import { createAuthClient } from 'better-auth/vue'
import { getToken } from './session'

export const authClient = createAuthClient({
  baseURL: import.meta.env.WXT_API_URL,
  fetchOptions: {
    auth: { type: 'Bearer', token: () => getToken() ?? undefined },
  },
})
