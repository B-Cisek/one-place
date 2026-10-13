import { DetailedError } from 'hono/client'

export interface ApiErrorInfo {
  status: number
  code: string
}

// parseResponse() from hono/client throws DetailedError for a non-2xx answer.
// Any other error (e.g. TypeError: Failed to fetch) means the API was not reached.
export function apiErrorInfo(error: unknown): ApiErrorInfo | null {
  if (!(error instanceof DetailedError)) return null
  const code: unknown = error.detail?.data?.error?.code
  return { status: error.statusCode, code: typeof code === 'string' ? code : 'UNKNOWN' }
}

const MAX_RETRIES = 3

// A 4xx answer will be the same next time. A network error or a 5xx may pass on retry.
export function shouldRetry(failureCount: number, error: unknown) {
  const info = apiErrorInfo(error)
  if (info && info.status < 500) return false
  return failureCount < MAX_RETRIES
}
