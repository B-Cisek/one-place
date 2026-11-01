import { type CreateTodoInput, MAX_TODOS_PER_WIDGET, type TodoDto } from '@one-place/shared'
import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { todoItems, widgets } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { ownWidget, widgetNotFound } from '../widgets/service'

function toTodoDto(row: typeof todoItems.$inferSelect): TodoDto {
  return {
    id: row.id,
    widgetId: row.widgetId,
    text: row.text,
    done: row.done,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

// Only a todo widget has tasks. Another user's widget is 404, like everywhere else.
async function assertTodoWidget(db: Database, userId: string, widgetId: string) {
  const [widget] = await db
    .select({ type: widgets.type })
    .from(widgets)
    .where(ownWidget(userId, widgetId))
  if (!widget) throw widgetNotFound()
  if (widget.type !== 'todo') {
    throw new AppError(400, 'VALIDATION_ERROR', `Widgets of type ${widget.type} have no tasks`)
  }
}

export async function listTodos(
  db: Database,
  userId: string,
  widgetId: string,
): Promise<TodoDto[]> {
  await assertTodoWidget(db, userId, widgetId)
  const rows = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.widgetId, widgetId), eq(todoItems.userId, userId)))
    // Byte order (COLLATE "C"), then the id for tasks with the same position
    .orderBy(asc(todoItems.position), asc(todoItems.id))
  return rows.map(toTodoDto)
}

export async function createTodo(
  db: Database,
  userId: string,
  widgetId: string,
  input: CreateTodoInput,
): Promise<{ todo: TodoDto; created: boolean }> {
  // The same order as for contexts and widgets: a retry finds its record before any other check
  const [existing] = await db.select().from(todoItems).where(eq(todoItems.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { todo: toTodoDto(existing), created: false }
  }
  await assertTodoWidget(db, userId, widgetId)
  const count = await db.$count(todoItems, eq(todoItems.widgetId, widgetId))
  if (count >= MAX_TODOS_PER_WIDGET) {
    throw new AppError(
      422,
      'LIMIT_EXCEEDED',
      `A widget can have at most ${MAX_TODOS_PER_WIDGET} tasks`,
    )
  }
  const [row] = await db
    .insert(todoItems)
    .values({ ...input, userId, widgetId })
    .returning()
  return { todo: toTodoDto(row!), created: true }
}
