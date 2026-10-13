import { CreateContextSchema, UpdateContextSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createContext, deleteContext, listContexts, updateContext } from './service'

export function contextsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await listContexts(db, c.var.user.id)))
    .post('/', validate('json', CreateContextSchema), async (c) => {
      const { context, created } = await createContext(db, c.var.user.id, c.req.valid('json'))
      return c.json(context, created ? 201 : 200)
    })
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateContextSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateContext(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteContext(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
}
