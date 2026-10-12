import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createAuth } from './auth'
import { createDb } from './db/client'
import { parseEnv } from './env'
import { pino } from 'pino'

const env = parseEnv(process.env)
const logger = pino({ level: env.LOG_LEVEL })
const db = createDb(env.DATABASE_URL)
const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.ALLOWED_ORIGINS,
  logger,
})
const app = createApp({ db, auth, allowedOrigins: env.ALLOWED_ORIGINS, logger })

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`API works at http://localhost:${info.port}`)
})
