import { CreateContextSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createContext, listContexts } from './service'

export function contextsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await listContexts(db, c.var.user.id)))
    .post('/', validate('json', CreateContextSchema), async (c) => {
      const { context, created } = await createContext(db, c.var.user.id, c.req.valid('json'))
      return c.json(context, created ? 201 : 200)
    })
}
