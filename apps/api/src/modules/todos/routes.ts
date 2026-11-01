import { CreateTodoSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import type { AuthEnv } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createTodo, listTodos } from './service'

// /api/widgets/:id/todos. Mounted inside widgetsRoutes, behind its requireAuth, the same way as
// the widgets of a context.
export function widgetTodosRoutes({ db }: Pick<ModuleDeps, 'db'>) {
  return new Hono<AuthEnv>()
    .get('/:id/todos', validate('param', IdParamSchema), async (c) =>
      c.json(await listTodos(db, c.var.user.id, c.req.valid('param').id)),
    )
    .post(
      '/:id/todos',
      validate('param', IdParamSchema),
      validate('json', CreateTodoSchema),
      async (c) => {
        const { id: widgetId } = c.req.valid('param')
        const { todo, created } = await createTodo(db, c.var.user.id, widgetId, c.req.valid('json'))
        return c.json(todo, created ? 201 : 200)
      },
    )
}
