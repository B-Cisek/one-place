import type { Locale } from '@one-place/shared'
import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // null means "follow the browser language"
  locale: varchar('locale', { length: 8 }).$type<Locale>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
})
