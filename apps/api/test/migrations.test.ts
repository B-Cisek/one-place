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
      'user',
      'user_settings',
      'verification',
    ])
  })

  // PGlite always uses the C collation, so sorting in tests would pass even without it.
  // Postgres in Docker uses en_US.utf8, which puts 'Zz' after 'a0'.
  it('compare context positions byte by byte', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ collation_name: string | null }>(
      `select collation_name from information_schema.columns
       where table_name = 'contexts' and column_name = 'position'`,
    )
    expect(rows).toEqual([{ collation_name: 'C' }])
  })
})
