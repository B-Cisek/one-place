import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@one-place/shared'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import type { Logger } from 'pino'
import type { Database } from './db/client'
import * as schema from './db/schema'

interface AuthDeps {
  db: Database
  secret: string
  baseURL: string
  trustedOrigins: string[]
  logger: Logger
}

export function createAuth({ db, secret, baseURL, trustedOrigins, logger }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    basePath: '/api/auth',
    trustedOrigins,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    telemetry: { enabled: false },
    logger: { log: (level, message, ...args) => logger[level]({ args }, message) },
    plugins: [bearer()],
  })
}

export type Auth = ReturnType<typeof createAuth>
