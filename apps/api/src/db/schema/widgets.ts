import { index, integer, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { timestamps } from './columns'
import { contexts } from './contexts'

export const widgets = pgTable(
  'widgets',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Deleting a context deletes its widgets (F-CTX-07)
    contextId: uuid('context_id')
      .notNull()
      .references(() => contexts.id, { onDelete: 'cascade' }),
    // Not WidgetType: the column also keeps types the API may stop knowing about
    type: varchar('type', { length: 32 }).notNull(),
    config: jsonb('config').notNull(),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    w: integer('w').notNull(),
    h: integer('h').notNull(),
    ...timestamps,
  },
  (table) => [index('widgets_context_id_idx').on(table.contextId)],
)
