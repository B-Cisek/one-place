import { type ClientResponse, parseResponse } from 'hono/client'
import { describe, expect, it } from 'vitest'
import { apiErrorInfo, shouldRetry } from './api-error'

// The same error parseResponse() throws for a real API response
async function errorFor(response: Response) {
  try {
    await parseResponse(response as unknown as ClientResponse<unknown>)
  } catch (error) {
    return error
  }
  throw new Error('parseResponse did not throw')
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const limitExceeded = jsonResponse(422, {
  error: { code: 'LIMIT_EXCEEDED', message: 'A user can have at most 20 contexts' },
})

describe('apiErrorInfo', () => {
  it('reads the status and code of an API error', async () => {
    expect(apiErrorInfo(await errorFor(limitExceeded.clone()))).toEqual({
      status: 422,
      code: 'LIMIT_EXCEEDED',
    })
  })

  it('uses UNKNOWN when the body is not in the API error format', async () => {
    const error = await errorFor(new Response('<h1>Bad Gateway</h1>', { status: 502 }))
    expect(apiErrorInfo(error)).toEqual({ status: 502, code: 'UNKNOWN' })
  })

  it('returns null when the API was not reached', () => {
    expect(apiErrorInfo(new TypeError('Failed to fetch'))).toBeNull()
  })
})

describe('shouldRetry', () => {
  it('does not retry client errors', async () => {
    expect(shouldRetry(0, await errorFor(limitExceeded.clone()))).toBe(false)
  })

  it('retries server and network errors up to 3 times', async () => {
    const serverError = await errorFor(jsonResponse(500, {}))
    expect(shouldRetry(2, serverError)).toBe(true)
    expect(shouldRetry(3, serverError)).toBe(false)
    expect(shouldRetry(2, new TypeError('Failed to fetch'))).toBe(true)
  })
})
