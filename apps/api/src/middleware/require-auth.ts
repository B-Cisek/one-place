import { createMiddleware } from 'hono/factory'
import type { Auth } from '../auth'
import { AppError } from '../lib/errors'

export type SessionUser = Auth['$Infer']['Session']['user']

export function requireAuth(auth: Auth) {
  return createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    c.set('user', session.user)
    await next()
  })
}
