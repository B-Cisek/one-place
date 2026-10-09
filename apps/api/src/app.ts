import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import type { Database } from './db/client'

interface AppDeps {
  db: Database
}

export function createApp({ db }: AppDeps) {
  return new Hono().basePath('/api').get('/health', async (c) => {
    try {
      await db.execute(sql`select 1`)
      return c.json({ status: 'ok', db: 'ok' } as const)
    } catch {
      return c.json({ status: 'error', db: 'unreachable' } as const, 503)
    }
  })
}

export type AppType = ReturnType<typeof createApp>
