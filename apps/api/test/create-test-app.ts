import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { createApp } from '../src/app'
import { pino } from 'pino'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const logger = pino({ level: 'silent' })
  const app = createApp({ db, allowedOrigins: [TEST_ORIGIN], logger })
  return { app, client }
}
