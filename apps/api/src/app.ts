import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { Database } from './db/client'
import { handleError, handleNotFound } from './lib/errors'
import { requestId } from 'hono/request-id'
import { requestLogger } from './middleware/logger'
import type { Logger } from 'pino'

interface AppDeps {
  db: Database
  allowedOrigins: string[]
  logger: Logger
}

export function createApp({ db, allowedOrigins, logger }: AppDeps) {
  return new Hono()
    .basePath('/api')
    .use(requestId())
    .use(requestLogger(logger))
    .use(cors({ origin: allowedOrigins }))
    .get('/health', async (c) => {
      try {
        await db.execute(sql`select 1`)
        return c.json({ status: 'ok', db: 'ok' } as const)
      } catch {
        return c.json({ status: 'error', db: 'unreachable' } as const, 503)
      }
    })
    .onError(handleError)
    .notFound(handleNotFound)
}

export type AppType = ReturnType<typeof createApp>
