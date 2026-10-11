import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { pino } from 'pino'
import { createApp } from '../src/app'
import { createAuth } from '../src/auth'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

const migrationsFolder = fileURLToPath(new URL('../src/db/migrations', import.meta.url))

export async function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  await migrate(db, { migrationsFolder })
  const logger = pino({ level: 'silent' })
  const auth = createAuth({
    db,
    secret: 'test-secret-at-least-32-characters-long',
    baseURL: 'http://localhost:3000',
    trustedOrigins: [TEST_ORIGIN],
    logger,
  })
  const app = createApp({ db, auth, allowedOrigins: [TEST_ORIGIN], logger })
  return { app, client }
}
