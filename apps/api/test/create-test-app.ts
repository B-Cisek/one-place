import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { createApp } from '../src/app'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const app = createApp({ db, allowedOrigins: [TEST_ORIGIN] })
  return { app, client }
}
