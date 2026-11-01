import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('database migrations', () => {
  it('create the Better Auth tables', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    )
    expect(rows.map((row) => row.table_name)).toEqual([
      'account',
      'contexts',
      'session',
      'todo_items',
      'user',
      'user_settings',
      'verification',
      'widgets',
    ])
  })

  // PGlite always uses the C collation, so sorting in tests would pass even without it.
  // Postgres in Docker uses en_US.utf8, which puts 'Zz' after 'a0'.
  it('compare positions byte by byte', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string; collation_name: string | null }>(
      `select table_name, collation_name from information_schema.columns
       where column_name = 'position' order by table_name`,
    )
    expect(rows).toEqual([
      { table_name: 'contexts', collation_name: 'C' },
      { table_name: 'todo_items', collation_name: 'C' },
    ])
  })

  // Without the cascade, deleting a context with widgets would fail on the foreign key
  it('delete widgets together with their context and user', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ column_name: string; delete_rule: string }>(
      `select kcu.column_name, rc.delete_rule
       from information_schema.referential_constraints rc
       join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name
       where kcu.table_name = 'widgets'
       order by kcu.column_name`,
    )
    expect(rows).toEqual([
      { column_name: 'context_id', delete_rule: 'CASCADE' },
      { column_name: 'user_id', delete_rule: 'CASCADE' },
    ])
  })

  // Deleting a widget deletes its tasks (F-WGT-03), and deleting a context deletes its widgets
  it('delete tasks together with their widget and user', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ column_name: string; delete_rule: string }>(
      `select kcu.column_name, rc.delete_rule
       from information_schema.referential_constraints rc
       join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name
       where kcu.table_name = 'todo_items'
       order by kcu.column_name`,
    )
    expect(rows).toEqual([
      { column_name: 'user_id', delete_rule: 'CASCADE' },
      { column_name: 'widget_id', delete_rule: 'CASCADE' },
    ])
  })

  // null means the default theme (or no override), so the columns can be added to tables that
  // already have rows. PGlite starts empty, so it would not notice a NOT NULL column.
  it('add nullable theme columns', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query(
      `select table_name, column_name, data_type, is_nullable from information_schema.columns
       where column_name in ('theme', 'theme_override') order by table_name`,
    )
    expect(rows).toEqual([
      {
        table_name: 'contexts',
        column_name: 'theme_override',
        data_type: 'jsonb',
        is_nullable: 'YES',
      },
      { table_name: 'user_settings', column_name: 'theme', data_type: 'jsonb', is_nullable: 'YES' },
    ])
  })
})
