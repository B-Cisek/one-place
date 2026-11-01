import { boolean, index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { fractionalIndex, timestamps } from './columns'
import { widgets } from './widgets'

export const todoItems = pgTable(
  'todo_items',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Deleting a widget deletes its tasks (F-WGT-03)
    widgetId: uuid('widget_id')
      .notNull()
      .references(() => widgets.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 500 }).notNull(),
    done: boolean('done').default(false).notNull(),
    position: fractionalIndex('position').notNull(),
    ...timestamps,
  },
  (table) => [index('todo_items_widget_id_position_idx').on(table.widgetId, table.position)],
)
