import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'

export class AppError extends Error {
  readonly status: ContentfulStatusCode
  readonly code: string
  readonly details?: unknown

  constructor(status: ContentfulStatusCode, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function errorBody(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } }
}

export function handleError(error: Error, c: Context) {
  if (error instanceof AppError) {
    return c.json(errorBody(error.code, error.message, error.details), error.status)
  }
  if (error instanceof z.ZodError) {
    return c.json(errorBody('VALIDATION_ERROR', 'Invalid request data', z.flattenError(error)), 400)
  }
  if (error instanceof HTTPException && error.status === 400) {
    return c.json(errorBody('VALIDATION_ERROR', error.message), 400)
  }
  // Details of unexpected errors go to the logs only (see middleware/logger.ts).
  return c.json(errorBody('INTERNAL_ERROR', 'Internal server error'), 500)
}

export function handleNotFound(c: Context) {
  return c.json(errorBody('NOT_FOUND', 'Route not found'), 404)
}
