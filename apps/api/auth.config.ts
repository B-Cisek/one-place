// Used only by the Better Auth CLI (`pnpm db:auth-schema`). The CLI reads the auth options
// to find out which tables and columns they need. It never connects to a database.
import { drizzle } from 'drizzle-orm/node-postgres'
import { pino } from 'pino'
import { createAuth } from './src/auth'

export const auth = createAuth({
  db: drizzle.mock(),
  secret: 'cli-only-secret-that-is-never-used-at-runtime',
  baseURL: 'http://localhost:3000',
  trustedOrigins: [],
  logger: pino({ level: 'silent' }),
})
