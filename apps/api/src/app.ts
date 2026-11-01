import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { Auth } from './auth'
import type { Database } from './db/client'
import { handleError, handleNotFound } from './lib/errors'
import { requestId } from 'hono/request-id'
import { requestLogger } from './middleware/logger'
import { requireAuth } from './middleware/require-auth'
import type { Logger } from 'pino'
import { settingsRoutes } from './modules/settings/routes'
import { contextsRoutes } from './modules/contexts/routes'
import { todosRoutes } from './modules/todos/routes'
import { widgetsRoutes } from './modules/widgets/routes'

interface AppDeps {
  db: Database
  auth: Auth
  allowedOrigins: string[]
  logger: Logger
}

export function createApp({ db, auth, allowedOrigins, logger }: AppDeps) {
  return new Hono()
    .basePath('/api')
    .use(requestId())
    .use(requestLogger(logger))
    .use(
      cors({
        origin: allowedOrigins,
        allowHeaders: ['Authorization', 'Content-Type'],
        exposeHeaders: ['set-auth-token'],
      }),
    )
    .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
    .get('/health', async (c) => {
      try {
        await db.execute(sql`select 1`)
        return c.json({ status: 'ok', db: 'ok' } as const)
      } catch {
        return c.json({ status: 'error', db: 'unreachable' } as const, 503)
      }
    })
    .get('/me', requireAuth(auth), (c) => {
      const { id, name, email } = c.var.user
      return c.json({ id, name, email })
    })
    .route('/settings', settingsRoutes({ db, auth }))
    .route('/contexts', contextsRoutes({ db, auth }))
    .route('/widgets', widgetsRoutes({ db, auth }))
    .route('/todos', todosRoutes({ db, auth }))
    .onError(handleError)
    .notFound(handleNotFound)
}

export type AppType = ReturnType<typeof createApp>
