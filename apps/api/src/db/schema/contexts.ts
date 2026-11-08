import type { ContextIcon, ThemeOverride } from '@one-place/shared'
import { index, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { fractionalIndex, timestamps } from './columns'

export const contexts = pgTable(
  'contexts',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 40 }).notNull(),
    icon: varchar('icon', { length: 64 }).$type<ContextIcon>().notNull(),
    position: fractionalIndex('position').notNull(),
    // null means the context uses the global theme
    themeOverride: jsonb('theme_override').$type<ThemeOverride>(),
    ...timestamps,
  },
  (table) => [index('contexts_user_id_position_idx').on(table.userId, table.position)],
)
