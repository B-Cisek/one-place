import {
  type ContextDto,
  type CreateContextInput,
  MAX_CONTEXTS,
  type UpdateContextInput,
} from '@one-place/shared'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { contexts } from '../../db/schema'
import { AppError } from '../../lib/errors'

function toContextDto(row: typeof contexts.$inferSelect): ContextDto {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

export async function listContexts(db: Database, userId: string): Promise<ContextDto[]> {
  const rows = await db
    .select()
    .from(contexts)
    .where(eq(contexts.userId, userId))
    // Two devices may give two contexts the same position. The id keeps their order stable.
    .orderBy(asc(contexts.position), asc(contexts.id))
  return rows.map(toContextDto)
}

export async function createContext(
  db: Database,
  userId: string,
  input: CreateContextInput,
): Promise<{ context: ContextDto; created: boolean }> {
  // The client generates the id, so a retried request (e.g. after a lost response)
  // finds the record it created the first time. Check it before the limit.
  const [existing] = await db.select().from(contexts).where(eq(contexts.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { context: toContextDto(existing), created: false }
  }
  const count = await db.$count(contexts, eq(contexts.userId, userId))
  if (count >= MAX_CONTEXTS) {
    throw new AppError(422, 'LIMIT_EXCEEDED', `A user can have at most ${MAX_CONTEXTS} contexts`)
  }
  const [row] = await db
    .insert(contexts)
    .values({ ...input, userId })
    .returning()
  return { context: toContextDto(row!), created: true }
}

function contextNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Context not found')
}

function ownContext(userId: string, id: string) {
  return and(eq(contexts.id, id), eq(contexts.userId, userId))
}

export async function updateContext(
  db: Database,
  userId: string,
  id: string,
  input: UpdateContextInput,
): Promise<ContextDto> {
  const [row] = await db
    .update(contexts)
    .set({ ...input, updatedAt: sql`now()`, version: sql`${contexts.version} + 1` })
    .where(ownContext(userId, id))
    .returning()
  if (!row) throw contextNotFound()
  return toContextDto(row)
}

export async function deleteContext(db: Database, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(contexts)
    .where(ownContext(userId, id))
    .returning({ id: contexts.id })
  if (deleted.length === 0) throw contextNotFound()
}
