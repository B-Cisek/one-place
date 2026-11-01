import { CreateTodoSchema, UpdateTodoSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { type AuthEnv, requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createTodo, deleteTodo, listTodos, updateTodo } from './service'

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

// /api/todos/:id. No other router matches this path, so it has its own requireAuth.
export function todosRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateTodoSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateTodo(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteTodo(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
}
