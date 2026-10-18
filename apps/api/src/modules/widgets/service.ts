import {
  type CreateWidgetSchema,
  isWidgetType,
  MAX_WIDGETS_PER_CONTEXT,
  type UpdateWidgetInput,
  widgetConfigSchemas,
  type WidgetDto,
} from '@one-place/shared'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Database } from '../../db/client'
import { contexts, widgets } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { contextNotFound, ownContext } from '../contexts/service'

// The parsed input: the config is already checked with the schema of its type
type CreateWidgetData = z.output<typeof CreateWidgetSchema>

function toWidgetDto(row: typeof widgets.$inferSelect): WidgetDto {
  return {
    id: row.id,
    contextId: row.contextId,
    type: row.type,
    config: row.config,
    x: row.x,
    y: row.y,
    w: row.w,
    h: row.h,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

async function assertOwnContext(db: Database, userId: string, contextId: string) {
  const [context] = await db
    .select({ id: contexts.id })
    .from(contexts)
    .where(ownContext(userId, contextId))
  if (!context) throw contextNotFound()
}

export async function listWidgets(
  db: Database,
  userId: string,
  contextId: string,
): Promise<WidgetDto[]> {
  await assertOwnContext(db, userId, contextId)
  const rows = await db
    .select()
    .from(widgets)
    .where(and(eq(widgets.contextId, contextId), eq(widgets.userId, userId)))
    .orderBy(asc(widgets.y), asc(widgets.x), asc(widgets.id))
  return rows.map(toWidgetDto)
}

export async function createWidget(
  db: Database,
  userId: string,
  contextId: string,
  input: CreateWidgetData,
): Promise<{ widget: WidgetDto; created: boolean }> {
  // The same order as for contexts: a retry finds its record before any other check
  const [existing] = await db.select().from(widgets).where(eq(widgets.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { widget: toWidgetDto(existing), created: false }
  }
  await assertOwnContext(db, userId, contextId)
  const count = await db.$count(widgets, eq(widgets.contextId, contextId))
  if (count >= MAX_WIDGETS_PER_CONTEXT) {
    throw new AppError(
      422,
      'LIMIT_EXCEEDED',
      `A context can have at most ${MAX_WIDGETS_PER_CONTEXT} widgets`,
    )
  }
  const [row] = await db
    .insert(widgets)
    .values({ ...input, userId, contextId })
    .returning()
  return { widget: toWidgetDto(row!), created: true }
}

function widgetNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Widget not found')
}

function ownWidget(userId: string, id: string) {
  return and(eq(widgets.id, id), eq(widgets.userId, userId))
}

// The schema depends on the type saved in the database, so the route cannot check the config.
// parse() throws a ZodError, which handleError turns into 400 VALIDATION_ERROR.
function parseConfig(type: string, config: unknown) {
  if (!isWidgetType(type)) {
    throw new AppError(400, 'VALIDATION_ERROR', `Widgets of type ${type} have no config`)
  }
  return widgetConfigSchemas[type].parse(config)
}

export async function updateWidgetConfig(
  db: Database,
  userId: string,
  id: string,
  input: UpdateWidgetInput,
): Promise<WidgetDto> {
  const [existing] = await db
    .select({ type: widgets.type })
    .from(widgets)
    .where(ownWidget(userId, id))
  if (!existing) throw widgetNotFound()
  const [row] = await db
    .update(widgets)
    .set({
      config: parseConfig(existing.type, input.config),
      updatedAt: sql`now()`,
      version: sql`${widgets.version} + 1`,
    })
    .where(ownWidget(userId, id))
    .returning()
  // Deleted between the two queries, e.g. on another device
  if (!row) throw widgetNotFound()
  return toWidgetDto(row)
}

export async function deleteWidget(db: Database, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(widgets)
    .where(ownWidget(userId, id))
    .returning({ id: widgets.id })
  if (deleted.length === 0) throw widgetNotFound()
}
