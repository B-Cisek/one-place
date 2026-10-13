import { type ClientResponse, parseResponse } from 'hono/client'
import { describe, expect, it } from 'vitest'
import { jsonResponse } from '@/queries/testing'
import { mutationErrorKey } from './mutation-error'

async function apiError(status: number, code: string) {
  const response = jsonResponse(status, { error: { code, message: code } })
  return parseResponse(response as unknown as ClientResponse<unknown>).catch((error) => error)
}

describe('mutationErrorKey', () => {
  it('explains a missing connection', () => {
    expect(mutationErrorKey(new TypeError('Failed to fetch'))).toBe('errors.network')
  })

  it('names the reason for known API errors', async () => {
    expect(mutationErrorKey(await apiError(422, 'LIMIT_EXCEEDED'))).toBe('errors.limitExceeded')
    expect(mutationErrorKey(await apiError(404, 'NOT_FOUND'))).toBe('errors.notFound')
    expect(mutationErrorKey(await apiError(500, 'INTERNAL_ERROR'))).toBe('errors.rejected')
  })

  it('stays silent on 401, because the sign-in screen explains it', async () => {
    expect(mutationErrorKey(await apiError(401, 'UNAUTHORIZED'))).toBeNull()
  })
})
