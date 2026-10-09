import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

export type Database = PgDatabase<PgQueryResultHKT>

export function createDb(databaseUrl: string): Database {
  const pool = new Pool({ connectionString: databaseUrl })
  // pg emits 'error' on the pool when the server drops an idle connection.
  // Without a listener, Node treats it as an uncaught exception and exits.
  pool.on('error', (error) => console.error('Postgres pool error:', error.message))
  return drizzle({ client: pool })
}
