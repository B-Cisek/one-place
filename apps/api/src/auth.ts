import { NameSchema, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@one-place/shared'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import type { Logger } from 'pino'
import type { Database } from './db/client'
import * as schema from './db/schema'

const DAY_IN_SECONDS = 60 * 60 * 24

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
    session: { expiresIn: 30 * DAY_IN_SECONDS, updateAge: DAY_IN_SECONDS },
    rateLimit: { enabled: true },
    telemetry: { enabled: false },
    logger: { log: (level, message, ...args) => logger[level]({ args }, message) },
    plugins: [bearer()],
    // Better Auth skips the Origin check when NODE_ENV=test. Explicit false keeps tests honest.
    advanced: { disableOriginCheck: false },
    databaseHooks: {
      user: {
        create: {
          // Better Auth does not limit the name length, so we do it before the insert
          before: async (user) => {
            const name = NameSchema.safeParse(user.name)
            if (!name.success) {
              throw new APIError('BAD_REQUEST', {
                code: 'INVALID_NAME',
                message: 'Name must be between 1 and 50 characters long',
              })
            }
            return { data: { ...user, name: name.data } }
          },
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
