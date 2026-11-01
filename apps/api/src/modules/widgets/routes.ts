import { CreateWidgetSchema, LayoutSchema, UpdateWidgetSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { type AuthEnv, requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { widgetTodosRoutes } from '../todos/routes'
import { createWidget, deleteWidget, listWidgets, saveLayout, updateWidgetConfig } from './service'

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
    .put(
      '/:id/layout',
      validate('param', IdParamSchema),
      validate('json', LayoutSchema),
      async (c) => {
        const { id: contextId } = c.req.valid('param')
        return c.json(await saveLayout(db, c.var.user.id, contextId, c.req.valid('json')))
      },
    )
}

export function widgetsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateWidgetSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateWidgetConfig(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteWidget(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
    .route('/', widgetTodosRoutes({ db }))
}
