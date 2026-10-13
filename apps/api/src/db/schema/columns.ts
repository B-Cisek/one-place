import { customType, integer, timestamp } from 'drizzle-orm/pg-core'

// Drizzle has no option for a column collation. Keys from `fractional-indexing` must be compared
// byte by byte, and the default collation of Postgres (e.g. en_US.utf8) would sort them differently.
export const fractionalIndex = customType<{ data: string }>({
  dataType: () => 'text COLLATE "C"',
})

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
}
