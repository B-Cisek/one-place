import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { createApp } from '../src/app'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const app = createApp({ db })
  return { app, client }
}
