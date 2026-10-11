import { createMiddleware } from 'hono/factory'
import type { RequestIdVariables } from 'hono/request-id'
import type { Logger } from 'pino'

export function requestLogger(logger: Logger) {
  return createMiddleware<{ Variables: RequestIdVariables }>(async (c, next) => {
    const start = performance.now()
    await next()
    // path without the query string: query parameters may carry secrets
    const entry = {
      requestId: c.var.requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    }
    if (c.res.status >= 500) {
      // c.error is set by Hono when a handler threw and onError produced the response
      logger.error({ ...entry, err: c.error }, 'request failed')
    } else {
      logger.info(entry, 'request completed')
    }
  })
}
