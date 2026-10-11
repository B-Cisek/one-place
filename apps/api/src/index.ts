import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createDb } from './db/client'
import { parseEnv } from './env'
import { pino } from 'pino'

const env = parseEnv(process.env)
const logger = pino({ level: env.LOG_LEVEL })
const app = createApp({
  db: createDb(env.DATABASE_URL),
  allowedOrigins: env.ALLOWED_ORIGINS,
  logger,
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API works at http://localhost:${info.port}`)
})
