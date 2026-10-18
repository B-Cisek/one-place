import { CreateWidgetSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import type { AuthEnv } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createWidget, listWidgets } from './service'

// /api/contexts/:id/widgets. Mounted inside contextsRoutes, behind its requireAuth, so the
// session is checked once per request.
export function contextWidgetsRoutes({ db }: Pick<ModuleDeps, 'db'>) {
  return new Hono<AuthEnv>()
    .get('/:id/widgets', validate('param', IdParamSchema), async (c) =>
      c.json(await listWidgets(db, c.var.user.id, c.req.valid('param').id)),
    )
    .post(
      '/:id/widgets',
      validate('param', IdParamSchema),
      validate('json', CreateWidgetSchema),
      async (c) => {
        const { id: contextId } = c.req.valid('param')
        const { widget, created } = await createWidget(
          db,
          c.var.user.id,
          contextId,
          c.req.valid('json'),
        )
        return c.json(widget, created ? 201 : 200)
      },
    )
}
