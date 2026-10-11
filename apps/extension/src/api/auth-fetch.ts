interface AuthFetchDeps {
  getToken: () => string | null
  onUnauthorized: () => void
  fetch?: typeof globalThis.fetch
}

export function createAuthFetch({
  getToken,
  onUnauthorized,
  fetch = globalThis.fetch,
}: AuthFetchDeps): typeof globalThis.fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers)
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(input, { ...init, headers })
    if (response.status === 401) onUnauthorized()
    return response
  }
}
